import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtPayload } from '../types/jwt-payload.type';
import { IUser } from '../interfaces/user.interface';

interface DbUser {
  id: number;
  email: string | null;
  username: string;
  nickname: string;
  avatar: string | null;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  roles: Array<{
    id: number;
    name: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    permissions: Array<{
      id: number;
      name: string;
      code: string;
      description: string | null;
      createdAt: Date;
      updatedAt: Date;
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
      where: { id: payload.sub },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    })) as DbUser | null;

    if (!user) {
      throw new UnauthorizedException('用户不存在或已被禁用');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      roles: user.roles.map((role) => ({
        id: role.id,
        name: role.name,
        description: role.description,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
        permissions: role.permissions.map((permission) => ({
          id: permission.id,
          name: permission.name,
          code: permission.code,
          description: permission.description,
          createdAt: permission.createdAt,
          updatedAt: permission.updatedAt,
        })),
      })),
    };
  }
}
