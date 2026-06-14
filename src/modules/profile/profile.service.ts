import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SUPER_ROLE_KEY } from '@/shared/constants/role.constant';

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: {
        userRoles: {
          select: {
            role: {
              select: {
                roleId: true,
                name: true,
                roleKey: true,
                description: true,
                rolePermissions: {
                  where: { permission: { deletedAt: null } },
                  select: {
                    permission: {
                      select: {
                        permissionId: true,
                        name: true,
                        code: true,
                        type: true,
                        action: true,
                        description: true,
                        parentPermissionId: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new NotFoundException('用户不存在');

    const roles = user.userRoles.map((ur) => ({
      roleId: ur.role.roleId,
      name: ur.role.name,
      roleKey: ur.role.roleKey,
      description: ur.role.description,
    }));

    const isSuperAdmin = user.userRoles.some(
      (ur) => ur.role.roleKey === SUPER_ROLE_KEY,
    );

    const permissionMap = new Map<
      string,
      {
        permissionId: string;
        name: string;
        code: string;
        type: string;
        action: string;
        description: string | null;
        parentPermissionId: string | null;
      }
    >();
    user.userRoles
      .flatMap((ur) => ur.role.rolePermissions)
      .forEach((rp) => {
        if (!permissionMap.has(rp.permission.code)) {
          permissionMap.set(rp.permission.code, rp.permission);
        }
      });
    const permissions = Array.from(permissionMap.values());

    return { roles, permissions, isSuperAdmin };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.findUnique({ where: { userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 手机号唯一性检查
    if (dto.phone) {
      const existing = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing && existing.userId !== userId) {
        throw new BadRequestException('该手机号已被其他用户使用');
      }
    }

    const updated = await this.prisma.user.update({
      where: { userId },
      data: {
        ...(dto.nickname !== undefined && { nickname: dto.nickname }),
        ...(dto.avatar !== undefined && { avatar: dto.avatar }),
        ...(dto.phone !== undefined && { phone: dto.phone || null }),
        ...(dto.gender !== undefined && { gender: dto.gender }),
      },
      select: {
        userId: true,
        username: true,
        nickname: true,
        email: true,
        phone: true,
        avatar: true,
        gender: true,
        updatedAt: true,
      },
    });
    return updated;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { userId: true, password: true },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('当前密码不正确');
    }

    if (dto.oldPassword === dto.newPassword) {
      throw new BadRequestException('新密码不能与当前密码相同');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { userId },
      data: { password: hashedPassword },
    });
  }

  async getSettings(userId: string) {
    const record = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { settings: true },
    });
    return (record?.settings as Record<string, unknown>) ?? {};
  }

  async updateSettings(userId: string, dto: UpdateSettingsDto) {
    const existing = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { settings: true },
    });

    const current = (existing?.settings as Record<string, unknown>) ?? {};
    const merged = { ...current, ...dto } as Prisma.InputJsonObject;

    const record = await this.prisma.userSettings.upsert({
      where: { userId },
      update: { settings: merged },
      create: { userId, settings: merged },
    });
    return record.settings;
  }
}
