import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Vault, Prisma } from '@prisma/client';

@Injectable()
export class VaultService {
  constructor(private prisma: PrismaService) {}

  async vault(
    vaultWhereUniqueInput: Prisma.VaultWhereUniqueInput,
  ): Promise<Vault | null> {
    return this.prisma.vault.findUnique({
      where: { status: true, ...vaultWhereUniqueInput },
    });
  }

  async vaults(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.VaultWhereUniqueInput;
    where?: Prisma.VaultWhereInput;
    orderBy?: Prisma.VaultOrderByWithRelationInput;
  }): Promise<Vault[]> {
    const { skip, take, cursor, where, orderBy } = params;
    return this.prisma.vault.findMany({
      skip,
      take,
      cursor,
      where: {
        status: true,
        ...where,
      },
      orderBy,
    });
  }

  async createVault(data: Prisma.VaultCreateInput): Promise<Vault> {
    return this.prisma.vault.create({
      data,
    });
  }

  async updateVault(params: {
    where: Prisma.VaultWhereUniqueInput;
    data: Prisma.VaultUpdateInput;
  }): Promise<Vault> {
    const { where, data } = params;
    return this.prisma.vault.update({
      data,
      where,
    });
  }

  async deleteVault(where: Prisma.VaultWhereUniqueInput): Promise<Vault> {
    return this.prisma.vault.update({
      data: { status: false },
      where,
    });
  }
}
