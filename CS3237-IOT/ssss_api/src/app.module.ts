import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { UserService } from './user.service'; // Import the UserService
import { PrismaService } from './prisma.service';
import { PhotoLogService } from './photo_logs.service';
import { BreakingLogService } from './breaking_logs.service';
import { VaultService } from './vault.service';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [
    AppService,
    UserService,
    PrismaService,
    PhotoLogService,
    BreakingLogService,
    VaultService,
  ],
})
export class AppModule {}
