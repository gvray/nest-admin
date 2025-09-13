import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/system/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { ResponseUtil } from '../../shared/utils/response.util';
import { ApiResponse } from '../../shared/interfaces/response.interface';
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '../../shared/constants/user-status.constant';
import { SUPER_ROLE_KEY } from '../../shared/constants/role.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<unknown>> {
    const { email, username, nickname, password } = registerDto;

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      try {
        await this.usersService.findOne(email);
        throw new UnauthorizedException('邮箱已被注册');
      } catch (error) {
        // 用户不存在是正常情况，可以继续注册
        if (error instanceof UnauthorizedException) {
          throw error;
        }
      }
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户 - 直接调用 Prisma，因为 usersService.create 现在返回 ApiResponse
    const user = await this.usersService['prisma'].user.create({
      data: {
        email,
        username,
        nickname,
        password: hashedPassword,
        status: UserStatus.ENABLED,
      },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        department: true,
        userPositions: {
          include: {
            position: true,
          },
        },
      },
    });

    // 生成 token
    const payload = {
      sub: user.userId,
      email: user.email,
      username: user.username,
    };

    // 移除密码字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    const result = {
      access_token: this.jwtService.sign(payload),
      user: userWithoutPassword,
    };

    return ResponseUtil.created(result, '注册成功');
  }

  async validateUser(account: string, password: string) {
    console.log('validateUser called with account:', account);
    try {
      // 直接从数据库查询用户，包含密码字段
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { email: account },
            { username: account },
            { phone: account },
            { userId: account },
          ],
        },
      });

      console.log('Query result:', user);

      console.log(
        'Found user:',
        user
          ? {
              userId: user.userId,
              username: user.username,
              status: user.status,
            }
          : 'null',
      );

      if (user) {
        console.log('User password hash:', user.password);
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log('Password match:', passwordMatch);

        if (passwordMatch) {
          console.log('Password validation successful');
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _, ...result } = user;
          return result;
        } else {
          console.log('Password validation failed');
        }
      } else {
        console.log('No user found');
      }
    } catch (error) {
      console.error('Error in validateUser:', error);
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<ApiResponse<unknown>> {
    const user = await this.validateUser(loginDto.account, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('用户名/邮箱/手机号或密码错误');
    }

    const payload = {
      sub: user.userId,
      email: user.email,
      username: user.username,
    };

    const result = {
      access_token: this.jwtService.sign(payload),
    };

    return ResponseUtil.success(result, '登录成功');
  }

  async getCurrentUser(
    userId: string,
  ): Promise<ApiResponse<CurrentUserResponseDto>> {
    const user = await this.usersService['prisma'].user.findUnique({
      where: { userId: userId },
      select: {
        userId: true,
        username: true,
        nickname: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        avatar: true,
        userRoles: {
          select: {
            role: {
              select: {
                roleId: true,
                name: true,
                roleKey: true,
                description: true,
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
                      },
                    },
                  },
                },
              },
            },
          },
        },
        department: {
          select: {
            departmentId: true,
            name: true,
            description: true,
          },
        },
        userPositions: {
          select: {
            position: {
              select: {
                positionId: true,
                name: true,
                description: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    const userResponse = plainToInstance(CurrentUserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    // 计算是否为超级管理员（约定：仅当存在 roleKey === 'super_admin' 的角色时为超管）
    const isSuperAdmin =
      Array.isArray(user.userRoles) &&
      user.userRoles.some((ur) => ur.role?.roleKey === SUPER_ROLE_KEY);

    // 将 isSuperAdmin 合并到响应对象
    Object.assign(userResponse, { isSuperAdmin });

    // 计算前端使用的权限代码聚合：超管 -> ['*:*:*']；非超管 -> 角色权限并集
    const permissionCodes: string[] = isSuperAdmin
      ? ['*:*:*']
      : Array.isArray(user.userRoles)
        ? Array.from(
            new Set(
              user.userRoles
                .flatMap((ur) => ur.role?.rolePermissions || [])
                .map((rp) => rp?.permission?.code)
                .filter(
                  (c): c is string =>
                    typeof c === 'string' && c.length > 0,
                ),
            ),
          )
        : [];

    Object.assign(userResponse, { permissionCodes });

    return ResponseUtil.success(userResponse, '获取用户信息成功');
  }

  logout(): ApiResponse<unknown> {
    // 在无状态JWT系统中，logout主要是客户端删除token
    // 这里返回成功响应，实际的token失效由客户端处理
    return ResponseUtil.success(null, '退出登录成功');
  }
}
