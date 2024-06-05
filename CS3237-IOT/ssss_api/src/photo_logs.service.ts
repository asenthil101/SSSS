import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PhotoLog, Prisma } from '@prisma/client';

@Injectable()
export class PhotoLogService {
  constructor(private prisma: PrismaService) {}

  async photoLog(
    photoLogWhereUniqueInput: Prisma.PhotoLogWhereUniqueInput,
  ): Promise<PhotoLog | null> {
    return this.prisma.photoLog.findUnique({
      where: photoLogWhereUniqueInput,
    });
  }

  async photoLogs(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.PhotoLogWhereUniqueInput;
    where?: Prisma.PhotoLogWhereInput;
    orderBy?: Prisma.PhotoLogOrderByWithRelationInput;
  }): Promise<PhotoLog[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.photoLog.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createPhotoLog(data: Prisma.PhotoLogCreateInput): Promise<PhotoLog> {
    return this.prisma.photoLog.create({
      data,
    });
  }

  async updatePhotoLog(params: {
    where: Prisma.PhotoLogWhereUniqueInput;
    data: Prisma.PhotoLogUpdateInput;
  }): Promise<PhotoLog> {
    const { where, data } = params;
    return this.prisma.photoLog.update({
      data,
      where,
    });
  }

  async deletePhotoLog(
    where: Prisma.PhotoLogWhereUniqueInput,
  ): Promise<PhotoLog> {
    return this.prisma.photoLog.delete({
      where,
    });
  }
}
