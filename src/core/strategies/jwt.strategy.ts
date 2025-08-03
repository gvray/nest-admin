import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';
import { IUser } from '../interfaces/user.interface';

interface DbUser {
  userId: string;
  email: string | null;
  username: string;
  nickname: string;
  avatar: string | null;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    roleId: string;
    name: string;
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
        roles: {
          select: {
            roleId: true,
            name: true,
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
                    resourceId: true,
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
    })) as DbUser | null;

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    return {
      userId: user.userId,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map((role) => ({
        roleId: role.roleId,
        name: role.name,
        description: role.description,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: role.rolePermissions.map((rp) => ({
          permissionId: rp.permission.permissionId,
          name: rp.permission.name,
          code: rp.permission.code,
          action: rp.permission.action,
          resourceId: rp.permission.resourceId,
          description: rp.permission.description,
          createdAt: rp.permission.createdAt,
          updatedAt: rp.permission.updatedAt,
        })),
      })),
    };
  }
}
