import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '@/modules/system/users/users.service';
import { LoginLogsService } from '@/modules/system/login-logs/login-logs.service';
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
import { UAParser } from 'ua-parser-js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly loginLogsService: LoginLogsService,
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

  async login(loginDto: LoginDto, req?: any): Promise<ApiResponse<unknown>> {
    const ipAddress = this.getClientIp(req);
    const userAgent: string =
      (req?.headers?.['user-agent'] as string) || '';

    let loginStatus = 0; // 默认失败
    let failReason = '';
    let userId: string | null = null;

    try {
      const user = await this.validateUser(loginDto.account, loginDto.password);
      if (!user) {
        failReason = '用户名/邮箱/手机号或密码错误';
        throw new UnauthorizedException(failReason);
      }

      userId = user.userId;
      loginStatus = 1; // 成功

      const payload = {
        sub: user.userId,
        email: user.email,
        username: user.username,
      };

      const result = {
        access_token: this.jwtService.sign(payload),
      };

      // 记录登录日志
      await this.recordLoginLog(
        {
          userId: user.userId,
          username: loginDto.account,
          ipAddress,
          userAgent,
          status: loginStatus,
          failReason: undefined,
        },
      );

      return ResponseUtil.success(result, '登录成功');
    } catch (error: unknown) {
      // 记录失败的登录日志
      await this.recordLoginLog(
        {
          userId,
          username: loginDto.account,
          ipAddress,
          userAgent,
          status: loginStatus,
          failReason: failReason || (error instanceof Error ? error.message : '未知错误'),
        },
      );

      throw error;
    }
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

  private getClientIp(req: any): string {
    if (!req) return '';
    const ip: string =
      (req?.headers?.['x-forwarded-for'] as string) ||
      (req?.headers?.['x-real-ip'] as string) ||
      (req?.connection?.remoteAddress as string) ||
      (req?.socket?.remoteAddress as string) ||
      (req?.ip as string) ||
      '';
    return typeof ip === 'string' ? ip.split(',')[0].trim() : '';
  }

  private async recordLoginLog(
    logData: {
      userId: string | null;
      username: string;
      ipAddress: string;
      userAgent: string;
      status: number;
      failReason: string | undefined;
    },
  ): Promise<void> {
    try {
      // 解析用户代理信息
      const parser = new UAParser(logData.userAgent);
      const result = parser.getResult();
      
      // 提取设备、浏览器、操作系统信息
      const device = result.device.model || result.device.type || 'Unknown';
      const browser = result.browser.name
        ? `${result.browser.name} ${result.browser.version || ''}`.trim()
        : 'Unknown';
      const os = result.os.name
        ? `${result.os.name} ${result.os.version || ''}`.trim()
        : 'Unknown';

      // TODO: 可以集成IP地理位置解析服务来获取location
      // 目前暂时设置为空，后续可以集成如GeoIP等服务
      const location = undefined;
      
      await this.loginLogsService.create({
        userId: logData.userId || undefined,
        username: logData.username,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        status: logData.status,
        failReason: logData.failReason,
        location,
        device,
        browser,
        os,
      });
    } catch (error) {
      // 记录日志失败不应该影响登录流程，只记录错误
      console.error('记录登录日志失败:', error);
    }
  }
}
