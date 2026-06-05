import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';
import { IUser } from '../interfaces/user.interface';
import { SUPER_ROLE_KEY } from '@/shared/constants/role.constant';

interface DbUser {
  userId: string;
  email: string | null;
  username: string;
  nickname: string;
  avatar: string | null;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  userRoles: Array<{
    role: {
      roleId: string;
      name: string;
      roleKey: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
      rolePermissions: Array<{
        permission: {
          permissionId: string;
          name: string;
          code: string;
          action: string;
          resourceId: string;
          description: string | null;
          createdAt: Date;
          updatedAt: Date;
        };
      }>;
    };
  }>;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretOrKey = configService.get<string>('jwt.secret');
    if (!secretOrKey) {
      throw new Error('JWT_SECRET is not defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: JwtPayload): Promise<IUser> {
    const user = (await this.prisma.user.findUnique({
      where: { userId: payload.sub },
      select: {
        userId: true,
        email: true,
        username: true,
        nickname: true,
        avatar: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        userRoles: {
          select: {
            role: {
              select: {
                roleId: true,
                name: true,
                roleKey: true,
                description: true,
                createdAt: true,
                updatedAt: true,
                rolePermissions: {
                  select: {
                    permission: {
                      select: {
                        permissionId: true,
                        name: true,
                        code: true,
                        action: true,
                        description: true,
                        createdAt: true,
                        updatedAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })) as DbUser | null;

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    const hasSuperRole = user.userRoles.some(
      (userRole) => userRole.role.roleKey === SUPER_ROLE_KEY,
    );
    const allPermissions = hasSuperRole
      ? await this.prisma.permission.findMany({
          where: { deletedAt: null },
          select: {
            permissionId: true,
            name: true,
            code: true,
            action: true,
            description: true,
            createdAt: true,
            updatedAt: true,
          },
        })
      : null;

    return {
      userId: user.userId,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.userRoles.map((userRole) => ({
        roleId: userRole.role.roleId,
        name: userRole.role.name,
        roleKey: userRole.role.roleKey,
        description: userRole.role.description,
        createdAt: userRole.role.createdAt,
        updatedAt: userRole.role.updatedAt,
        permissions:
          userRole.role.roleKey === SUPER_ROLE_KEY && allPermissions
            ? allPermissions
            : userRole.role.rolePermissions.map((rp) => ({
                permissionId: rp.permission.permissionId,
                name: rp.permission.name,
                code: rp.permission.code,
                action: rp.permission.action,
                description: rp.permission.description,
                createdAt: rp.permission.createdAt,
                updatedAt: rp.permission.updatedAt,
              })),
      })),
    };
  }
}
