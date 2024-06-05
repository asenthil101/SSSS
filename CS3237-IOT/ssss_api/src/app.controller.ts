import { PhotoLogService } from './photo_logs.service';
import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { User as UserModel } from '@prisma/client';
import { UserService } from './user.service';
import { RegisterDto } from './users/register.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  S3Client,
  ListObjectsCommand,
  ListObjectsCommandInput,
  PutObjectCommand,
  DeleteObjectCommand,
  CopyObjectCommandInput,
  CopyObjectCommand,
} from '@aws-sdk/client-s3';
import { Twilio } from 'twilio';
import { BreakingLogService } from './breaking_logs.service';
import { VaultService } from './vault.service';

@Controller()
export class AppController {
  constructor(
    private readonly userService: UserService,
    private readonly PhotoLogService: PhotoLogService,
    private readonly breakingLogService: BreakingLogService,
    private readonly vaultService: VaultService,
  ) {}
  private accountSid = 'AC7086c7d22a59b553b84594f7661e0630';
  private authToken = process.env.TWILIO_TOKEN;
  private twilioClient = new Twilio(this.accountSid, this.authToken);

  //S3
  private s3 = new S3Client({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });

  //Health check
  @Get('health')
  async health(): Promise<string> {
    console.log(this.authToken);
    await this.twilioClient.messages.create({
      body: `Hey Admin! We detected someone taking a picture and it is not recognized. Please check the photo and take action if needed.`,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${process.env.ADMIN_PHONE}`,
      mediaUrl: [
        `https://ichef.bbci.co.uk/news/1024/cpsprodpb/3D6F/production/_129872751_gettyimages-962297762.jpg`,
      ],
    });
    return 'OK';
  }

  // Register an authorized user
  @Post('user')
  async registerUser(@Body() userData: RegisterDto): Promise<UserModel> {
    const cleanUser = userData.username.toLowerCase().trim();
    userData.username = cleanUser;
    const newUser = await this.userService.createUser({
      username: userData.username,
      phone: userData.phoneNumber,
    });
    return newUser;
  }

  // Get all users
  @Get('users')
  async users(): Promise<UserModel[]> {
    return this.userService.users({});
  }

  // Get a single user
  @Get('user/:id')
  async user(@Param('id') id: string): Promise<UserModel> {
    return this.userService.user({ id: Number(id) });
  }

  // Delete a user (not really deleting, just setting the deleted flag)
  @Delete('user/:id')
  async deleteUser(@Param('id') id: string): Promise<UserModel> {
    return this.userService.deleteUser({ id: Number(id) });
  }

  // Register a card
  @Post('registerCard')
  async registerCard(@Body() body) {
    console.log(body);
    const { cardNumber } = body;
    //Find the user without a card There should only be one!
    const user = await this.userService.users({
      where: { cardNumber: null },
    });
    if (!user[0]) {
      return {
        message: 'no user to update', //! Better to thow an error
      };
    }

    //Update the user with the card number
    return this.userService.updateUser({
      where: { id: user[0].id },
      data: { cardNumber: cardNumber },
    });
  }

  // -----------------  Photo Logs -----------------

  generateLast24HoursArray = () => {
    return Array.from(Array(24).keys()).map((x) => {
      let date = new Date();
      date.setHours(date.getHours() - (24 - x) + 2);
      return date.getHours();
    });
  };

  // Create a new photo log of known person
  @Post('photo_log/:username')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
    }),
  )
  async createPhotoLogOfKnown(
    @UploadedFile() file,
    @Param('username') username: string,
  ) {
    console.log('username', username);
    const { originalname, buffer } = file;
    // Send file to ML model to get what's in the photo
    const personInPhoto = await this.userService.user({ username: username });

    const fileExtension = originalname.split('.').pop();

    const input = {
      Bucket: 'iotsecuresystem',
      Key: personInPhoto.username + '/' + Date.now() + '.' + fileExtension,
      Body: buffer,
    };
    const command = new PutObjectCommand(input);
    await this.s3.send(command);
    const newP = await this.PhotoLogService.createPhotoLog({
      user: { connect: { id: personInPhoto.id } },
      url: input.Key,
    });
    //Send it to the python api to retrain the model
    await fetch('http://127.0.0.1:8000/newPhoto', {
      method: 'POST',
      body: JSON.stringify({
        username: personInPhoto.username,
      }),
      headers: { 'Content-Type': 'application/json' },
    }).then((res) => {
      console.log('res', res);
    });

    return newP;
  }

  // Create a new photo log
  @Post('photo_log')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 1024 * 1024 * 5, // 5MB
      },
    }),
  )
  async createPhotoLog(@UploadedFile() file) {
    const { originalname, buffer } = file;
    // Upload image to S3 unknown folder
    const unknownFileExtension = originalname.split('.').pop();
    const unkownKey = 'unknown/' + Date.now() + '.' + unknownFileExtension;
    const unknownInput = {
      Bucket: 'iotsecuresystem',
      Key: unkownKey,
      Body: buffer,
    };
    const unknownCommand = new PutObjectCommand(unknownInput);

    await this.s3.send(unknownCommand);
    // Send file to ML model to get what's in the photo in post request with the image
    const response = await fetch('http://127.0.0.1:8000/', {
      method: 'POST',
      body: JSON.stringify({
        url: `https://iotsecuresystem.s3.amazonaws.com/${unkownKey}`,
      }),
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => {
        return res.json();
      })
      .catch((err) => {
        throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
      });

    console.log('personInPhoto', response);

    if (
      response &&
      response.message &&
      response.message === 'No face detected'
    ) {
      return {
        username: 'none',
        cardNumber: '00000000',
      };
    }

    if (!response || !response.label) {
      console.log("We don't know who it is");
      //If we dont know who it was we still create a photo log but we dont connect it to a user and do not delete the photo
      await this.PhotoLogService.createPhotoLog({
        url: unkownKey,
      });
      await this.unidentified();
      return {
        username: 'none',
        cardNumber: '00000000',
      };
    }

    //We wont delete the picture, we will not do this after sending the whatsapp message
    //Make sure the person actually exists in the database
    const user = await this.userService.user({
      id: response.label,
    });

    if (!user) {
      //This should never happen
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const fileExtension = originalname.split('.').pop();

    const input = {
      Bucket: 'iotsecuresystem',
      Key: user.username + '/' + Date.now() + '.' + fileExtension,
      Body: buffer,
    };
    const command = new PutObjectCommand(input);
    await this.s3.send(command);
    await this.PhotoLogService.createPhotoLog({
      user: { connect: { id: user.id } },
      url: input.Key,
    });

    // Retrain the ML model but dont wait for it to finish
    fetch('http://127.0.0.1:8000/', {
      method: 'GET',
    });
    console.log(user);
    return user;
  }

  //Get all the photo logs for a user
  @Get('photo_logs/:username')
  async photoLogsForUser(@Param('username') username: string) {
    //Find the user
    const user = await this.userService.user({ username: username });
    //Get all the photo logs for the user
    let photoLog = await this.PhotoLogService.photoLogs({
      where: { user: { username: username } },
    });
    //Get a presigned URL for each photo log
    const input: ListObjectsCommandInput = {
      Bucket: 'iotsecuresystem',
      Prefix: username,
    };
    const command = new ListObjectsCommand(input);
    const results = await this.s3.send(command);
    const photoLogs = photoLog.map((photoLog) => {
      const photo = results.Contents.find((result) => {
        return result.Key === photoLog.url;
      });
      return {
        ...photoLog,
        url: `https://iotsecuresystem.s3.amazonaws.com/${photo.Key}`,
      };
    });
    return photoLogs;
  }

  // Get a single photo log
  @Get('photo_log/:id')
  async photoLog(@Param('id') id: string) {
    //Get a presigned URL for the photo log
    let photoLog = await this.PhotoLogService.photoLog({ id: Number(id) });
    //Get the user for the photo log
    const user = await this.userService.user({ id: photoLog.userId });

    const input: ListObjectsCommandInput = {
      Bucket: 'iotsecuresystem',
      Prefix: user.username,
    };
    const command = new ListObjectsCommand(input);
    const results = await this.s3.send(command);
    const photo = results.Contents.find((result) => {
      return result.Key === photoLog.url;
    });
    return {
      ...photoLog,
      url: `https://iotsecuresystem.s3.amazonaws.com/${photo.Key}`,
    };
  }

  // Delete a photo log
  @Delete('photo_log/:id')
  async deletePhotoLog(@Param('id') id: string) {
    //Delete the photo from S3
    let photoLog = await this.PhotoLogService.photoLog({ id: Number(id) });
    const input = {
      Bucket: 'iotsecuresystem',
      Key: photoLog.url,
    };
    const command = new DeleteObjectCommand(input);
    await this.s3.send(command);
    //Delete the photo log from the database
    return this.PhotoLogService.deletePhotoLog({ id: Number(id) });
  }

  //Photo log stats
  @Get('stats/photo_logs/:id')
  async photoLogStats(@Param('id') id: string) {
    const whereClause = id === 'all' ? {} : { userId: { equals: Number(id) } };
    console.log('whereClause', whereClause);
    const photoLogs = await this.PhotoLogService.photoLogs({
      where: whereClause,
    });
    // console.log('photoLogs', photoLogs);
    const byUser = photoLogs.reduce((acc, photoLog) => {
      if (photoLog.userId) {
        acc[photoLog.userId] = acc[photoLog.userId]
          ? acc[photoLog.userId] + 1
          : 1;
      } else {
        acc['unknown'] = acc['unknown'] ? acc['unknown'] + 1 : 1;
      }
      return acc;
    }, {});
    //Return counter of photo logs by day
    const byDay = photoLogs.reduce((acc, photoLog) => {
      const day = photoLog.createdAt.toISOString().split('T')[0];
      acc[day] = acc[day] ? acc[day] + 1 : 1;
      return acc;
    }, {});

    //For each day get divide by hour
    const byHour = photoLogs.reduce((acc, photoLog) => {
      const day = photoLog.createdAt.toISOString().split('T')[0];
      const hour = photoLog.createdAt.toISOString().split('T')[1].split(':')[0];
      acc[day] = acc[day] ? acc[day] : {};
      acc[day][hour] = acc[day][hour] ? acc[day][hour] + 1 : 1;
      return acc;
    }, {});

    return {
      total: photoLogs.length,
      byUser,
      byDay,
      byHour,
    };
  }
  /*
  Get the stats for the last day
   [
          {
            data: [count in hour 0, count in hour 1, ...],
            label: "User 1",
            borderColor: "#3e95cd",
            backgroundColor: "#7bb6dd",
            fill: false,
          },...]

  */

  @Get('stats/last_day')
  async lastDayStats() {
    const colors = [
      '#3e95cd',
      '#8e5ea2',
      '#3cba9f',
      '#e8c3b9',
      '#c45850',
      '#3e95cd',
      '#8e5ea2',
      '#3cba9f',
      '#e8c3b9',
      '#c45850',
    ];

    //Get all the users with photo logs in the last 24 hours
    const photoLogs = await this.PhotoLogService.photoLogs({
      where: {
        createdAt: {
          gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        },
      },
    });

    const hoursArray = this.generateLast24HoursArray();

    const users = photoLogs.reduce((acc, photoLog) => {
      const currentHour = photoLog.createdAt.getHours();
      const adjustedHourIndex = hoursArray.indexOf(currentHour);

      const processLog = (key) => {
        if (!acc[key]) {
          acc[key] = new Array(24).fill(0);
        }
        acc[key][adjustedHourIndex]++;
      };

      if (photoLog.userId) {
        processLog(photoLog.userId);
      } else {
        processLog('unknown');
      }

      processLog('total');

      return acc;
    }, {});

    type Response = {
      data: number[];
      label: string;
      borderColor: string;
      backgroundColor: string;
      fill: boolean;
    };

    const response: Response[] = [];

    for (const user in users) {
      const colorIndex = Math.floor(Math.random() * colors.length);

      response.push({
        data: users[user],
        label: user,
        borderColor: colors[colorIndex],
        backgroundColor: colors[colorIndex],
        fill: false,
      });
    }

    return response;
  }

  // -----------------  Breaking Logs -----------------
  /*
   Get all the breaking logs
    */
  @Get('breaking_logs')
  async breakingLogs() {
    return this.breakingLogService.breakingLogs({});
  }

  /*Delete a breaking log
   */
  @Delete('breaking_log/:id')
  async deleteBreakingLog(@Param('id') id: string) {
    //Delete the photo from S3
    let breakingLog = await this.breakingLogService.breakingLog({
      id: Number(id),
    });
    const input = {
      Bucket: 'iotsecuresystem',
      Key: breakingLog.url,
    };
    const command = new DeleteObjectCommand(input);
    await this.s3.send(command);
    //Delete the photo log from the database
    return this.breakingLogService.deleteBreakingLog({ id: Number(id) });
  }

  // -----------------  Whatapp -----------------
  @Post('loginLog')
  async loginRegisted(@Body() body) {
    const { cardNumber } = body;
    console.log('cardNumber', cardNumber);
    //Find the user
    const user = await this.userService.users({
      where: { cardNumber: cardNumber },
    });
    if (!user[0]) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    console.log(`Correct login from user ${user[0].username}`);
    //Get the newest photo log for the user
    const photoLog = await this.PhotoLogService.photoLogs({
      where: { user: { username: user[0].username } },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    //Send a whatsapp message to the user
    await this.twilioClient.messages.create({
      body: `Hey ${user[0].username}! We detected a login with your username. Was this you? If not contact the administrator immediately.`,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${user[0].phone}`,
      mediaUrl: [`https://iotsecuresystem.s3.amazonaws.com/${photoLog[0].url}`],
    });
    return photoLog;
  }

  //When someone uses your card but we did not identify it as you!
  // The username that arrives is the one from the photo not the one from the card
  @Post('stolenCard')
  async stolenCard(@Body() body) {
    const { cardNumber } = body;
    console.log(cardNumber);
    console.log('Just calling');

    //Get the newest photo log
    const photoLog = await this.PhotoLogService.photoLogs({
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    console.log('got photo log');
    if (!photoLog[0]) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    // Find user with card number
    const user = await this.userService.users({
      where: { cardNumber: cardNumber },
    });
    console.log('got user');
    if (!user[0]) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }
    console.log('got user');
    //Send a whatsapp message to the user
    await this.twilioClient.messages.create({
      body: `Hey ${user[0].username}! We detected someone using your card but we strongly believe it was not you. If this was you please contact the administrator immediately as we have called the police.`,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${user[0].phone}`,
      mediaUrl: [`https://iotsecuresystem.s3.amazonaws.com/${photoLog[0].url}`],
    });

    // Now copy to /breakings folder
    const input: CopyObjectCommandInput = {
      Bucket: 'iotsecuresystem',
      CopySource: `iotsecuresystem/${photoLog[0].url}`,
      Key: `breakings/${photoLog[0].url}`,
    };
    const command = new CopyObjectCommand(input);
    await this.s3.send(command);

    //Delete the photo from S3
    // const deleteInput = {
    //   Bucket: 'iotsecuresystem',
    //   Key: photoLog[0].url,
    // };
    // const deleteCommand = new DeleteObjectCommand(deleteInput);
    // await this.s3.send(deleteCommand);

    // //Delete the photo log from the database
    // await this.PhotoLogService.deletePhotoLog({ id: photoLog[0].id });

    //Create a breaking log
    const breakingLog = await this.breakingLogService.createBreakingLog({
      url: `breakings/${photoLog[0].url}`,
      time: photoLog[0].createdAt,
    });
    console.log('finish');

    return breakingLog;
  }

  // When someone not identified takes a picture create a BreakingLog and send a whatsapp message to the admin
  async unidentified() {
    //Get the newest photo log from unknown
    const photoLog = await this.PhotoLogService.photoLogs({
      //it has no user
      where: { user: null },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    //Create a breaking log
    const bLog = this.breakingLogService.createBreakingLog({
      url: photoLog[0].url,
      time: photoLog[0].createdAt,
    });
    //Send a whatsapp message to the user
    await this.twilioClient.messages.create({
      body: `Hey Admin! We detected someone taking a picture and it is not recognized. Please check the photo and take action if needed.`,
      from: 'whatsapp:+14155238886',
      to: `whatsapp:${process.env.ADMIN_PHONE}`,
      mediaUrl: [`https://iotsecuresystem.s3.amazonaws.com/${photoLog[0].url}`],
    });

    return bLog;
  }

  /// -----------------  Vault -----------------
  //Create a new vault
  @Post('vault')
  async createVault(@Body() body) {
    //Create a vault
    const vault = await this.vaultService.createVault({
      lat: body.lat,
      lng: body.lng,
    });
    return vault;
  }

  //Get all vaults
  @Get('vaults')
  async vaults() {
    return this.vaultService.vaults({});
  }

  //Get a single vault
  @Get('vault/:id')
  async vault(@Param('id') id: string) {
    return this.vaultService.vault({ id: Number(id) });
  }

  //Update a vault
  @Put('vault/:id')
  async updateVault(@Param('id') id: string, @Body() body) {
    return this.vaultService.updateVault({
      where: { id: Number(id) },
      data: { lat: body.lat, lng: body.lng },
    });
  }

  //Delete a vault
  @Delete('vault/:id')
  async deleteVault(@Param('id') id: string) {
    return this.vaultService.deleteVault({ id: Number(id) });
  }
}
