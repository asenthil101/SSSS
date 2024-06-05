import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { BreakingLog, Prisma } from '@prisma/client';

@Injectable()
export class BreakingLogService {
  constructor(private prisma: PrismaService) {}

  async breakingLog(
    breakingLogWhereUniqueInput: Prisma.BreakingLogWhereUniqueInput,
  ): Promise<BreakingLog | null> {
    return this.prisma.breakingLog.findUnique({
      where: breakingLogWhereUniqueInput,
    });
  }

  async breakingLogs(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.BreakingLogWhereUniqueInput;
    where?: Prisma.BreakingLogWhereInput;
    orderBy?: Prisma.BreakingLogOrderByWithRelationInput;
  }): Promise<BreakingLog[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.breakingLog.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
    });
  }

  async createBreakingLog(
    data: Prisma.BreakingLogCreateInput,
  ): Promise<BreakingLog> {
    return this.prisma.breakingLog.create({
      data,
    });
  }

  async updateBreakingLog(params: {
    where: Prisma.BreakingLogWhereUniqueInput;
    data: Prisma.BreakingLogUpdateInput;
  }): Promise<BreakingLog> {
    const { where, data } = params;
    return this.prisma.breakingLog.update({
      data,
      where,
    });
  }

  async deleteBreakingLog(
    where: Prisma.BreakingLogWhereUniqueInput,
  ): Promise<BreakingLog> {
    return this.prisma.breakingLog.delete({
      where,
    });
  }
}
