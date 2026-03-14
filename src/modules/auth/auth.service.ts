import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LogStatus } from '@/shared/constants/log-status.constant';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@/modules/system/users/users.service';
import { LoginLogsService } from '@/modules/system/login-logs/login-logs.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { MenuResponseDto } from './dto/menu-response.dto';
// no unified response types needed in service
import { plainToInstance } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { PermissionType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '../../shared/constants/user-status.constant';
import { SUPER_ROLE_KEY } from '../../shared/constants/role.constant';
import { UAParser } from 'ua-parser-js';
import * as crypto from 'crypto';

interface RequestWithHeaders {
  headers?: Record<string, string | string[]>;
  connection?: { remoteAddress?: string };
  socket?: { remoteAddress?: string };
  ip?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly loginLogsService: LoginLogsService,
  ) {}

  async register(
    registerDto: RegisterDto,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    access_token_expires_in: number;
    refresh_token_expires_in: number;
    expires_at: number;
    user: unknown;
  }> {
    const { email, username, nickname, password } = registerDto;

    if (email) {
      const existingByEmail = await this.prisma.user.findUnique({
        where: { email },
      });
      if (existingByEmail) {
        throw new UnauthorizedException('邮箱已被注册');
      }
    }
    const existingByUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingByUsername) {
      throw new UnauthorizedException('用户名已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
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

    // 生成 access token 和 refresh token
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = await this.generateRefreshToken(user.userId);

    // 移除密码字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    // 计算过期时间戳
    const accessTokenExpiresIn = this.parseExpiresIn(
      this.configService.get<string>('jwt.accessTokenExpiresIn') || '2h',
    );
    const refreshTokenExpiresIn = this.parseExpiresIn(
      this.configService.get<string>('jwt.refreshTokenExpiresIn') || '7d',
    );
    const now = Date.now();

    const result = {
      access_token: accessToken,
      refresh_token: refreshToken,
      access_token_expires_in: accessTokenExpiresIn,
      refresh_token_expires_in: refreshTokenExpiresIn,
      expires_at: now + accessTokenExpiresIn * 1000,
      user: userWithoutPassword,
    };

    return result;
  }

  async validateUser(account: string, password: string) {
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

      if (user) {
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { password: _, ...result } = user;
          return result;
        }
      }
    } catch (error) {
      console.error('Error in validateUser:', error);
    }
    return null;
  }

  async login(
    loginDto: LoginDto,
    req?: RequestWithHeaders,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    access_token_expires_in: number;
    refresh_token_expires_in: number;
    expires_at: number;
  }> {
    const ipAddress = this.getClientIp(req);
    const userAgent: string = (req?.headers?.['user-agent'] as string) || '';

    let loginStatus = 0; // 默认失败
    let failReason = '';

    try {
      const user = await this.validateUser(loginDto.account, loginDto.password);
      if (!user) {
        failReason = '用户名/邮箱/手机号或密码错误';
        throw new UnauthorizedException(failReason);
      }

      loginStatus = 1; // 成功

      const payload = {
        sub: user.userId,
        email: user.email,
        username: user.username,
      };

      // 生成 access token 和 refresh token
      const accessToken = this.generateAccessToken(payload);
      const refreshToken = await this.generateRefreshToken(
        user.userId,
        ipAddress,
        userAgent,
      );

      // 计算过期时间戳
      const accessTokenExpiresIn = this.parseExpiresIn(
        this.configService.get<string>('jwt.accessTokenExpiresIn') || '2h',
      );
      const refreshTokenExpiresIn = this.parseExpiresIn(
        this.configService.get<string>('jwt.refreshTokenExpiresIn') || '7d',
      );
      const now = Date.now();

      const result = {
        access_token: accessToken,
        refresh_token: refreshToken,
        access_token_expires_in: accessTokenExpiresIn,
        refresh_token_expires_in: refreshTokenExpiresIn,
        expires_at: now + accessTokenExpiresIn * 1000,
      };

      // 记录登录日志
      await this.recordLoginLog({
        account: loginDto.account,
        ipAddress,
        userAgent,
        status: loginStatus,
        loginType: 'username',
      });

      return result;
    } catch (error: unknown) {
      // 记录失败的登录日志
      await this.recordLoginLog({
        account: loginDto.account,
        ipAddress,
        userAgent,
        status: loginStatus,
        loginType: 'username',
        failReason:
          failReason || (error instanceof Error ? error.message : '未知错误'),
      });

      throw error;
    }
  }

  async getCurrentUser(userId: string): Promise<CurrentUserResponseDto> {
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
        userSettings: {
          select: {
            settings: true,
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
    const rolesArr: any[] = Array.isArray((user as any).userRoles)
      ? (user as any).userRoles
      : [];
    const isSuperAdmin = rolesArr.some(
      (ur: any) => ur.role?.roleKey === SUPER_ROLE_KEY,
    );

    // 将 isSuperAdmin 合并到响应对象
    Object.assign(userResponse, { isSuperAdmin });

    // 计算前端使用的权限代码聚合：超管 -> ['*:*:*']；非超管 -> 角色权限并集
    const permissionCodes: string[] = isSuperAdmin
      ? ['*:*:*']
      : Array.from(
          new Set(
            rolesArr
              .flatMap((ur: any) => ur.role?.rolePermissions || [])
              .map((rp: any) => rp?.permission?.code)
              .filter(
                (c: any): c is string => typeof c === 'string' && c.length > 0,
              ),
          ),
        );

    Object.assign(userResponse, { permissionCodes });

    return userResponse;
  }

  async logout(userId: string): Promise<void> {
    // 撤销该用户的所有 refresh token
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
    
    // 在无状态JWT系统中，access token 的失效由客户端删除处理
    // refresh token 已在数据库中标记为撤销
  }

  async getMenus(userId: string): Promise<MenuResponseDto[]> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      include: {
        userRoles: {
          include: {
            role: {
              include: { rolePermissions: true },
            },
          },
        },
      },
    });
    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }
    const isSuperAdmin =
      Array.isArray(user.userRoles) &&
      user.userRoles.some((ur) => ur.role?.roleKey === SUPER_ROLE_KEY);
    let menus:
      | Array<{
          permissionId: string;
          parentPermissionId: string | null;
          name: string;
          code: string;
          type: string;
          action: string;
          meta: {
            path: string | null;
            icon: string | null;
            hidden: boolean;
            component: string | null;
            sort: number;
          } | null;
        }>
      | [] = [];
    if (isSuperAdmin) {
      const perms = await this.prisma.permission.findMany({
        where: { type: { in: [PermissionType.DIRECTORY, PermissionType.MENU] } },
        select: {
          permissionId: true,
          parentPermissionId: true,
          name: true,
          code: true,
          type: true,
          action: true,
          menuMeta: {
            select: {
              path: true,
              icon: true,
              hidden: true,
              component: true,
              sort: true,
            },
          },
        },
        orderBy: [{ code: 'asc' }],
      });
      menus = perms.map((p) => ({
        permissionId: p.permissionId,
        parentPermissionId: p.parentPermissionId ?? null,
        name: p.name,
        code: p.code,
        type: p.type,
        action: p.action,
        meta: p.menuMeta
          ? {
              path: p.menuMeta.path ?? null,
              icon: p.menuMeta.icon ?? null,
              hidden: p.menuMeta.hidden,
              component: p.menuMeta.component ?? null,
              sort: p.menuMeta.sort ?? 0,
            }
          : null,
      }));
    } else {
      const assignedPermissionIds = Array.from(
        new Set(
          (user.userRoles || [])
            .flatMap((ur) => ur.role?.rolePermissions || [])
            .map((rp) => rp.permissionId)
            .filter(
              (id): id is string => typeof id === 'string' && id.length > 0,
            ),
        ),
      );
      if (assignedPermissionIds.length === 0) return [];
      const perms = await this.prisma.permission.findMany({
        where: {
          permissionId: { in: assignedPermissionIds },
          type: { in: [PermissionType.DIRECTORY, PermissionType.MENU] },
        },
        select: {
          permissionId: true,
          parentPermissionId: true,
          name: true,
          code: true,
          type: true,
          action: true,
          menuMeta: {
            select: {
              path: true,
              icon: true,
              hidden: true,
              component: true,
              sort: true,
            },
          },
        },
        orderBy: [{ code: 'asc' }],
      });
      menus = perms.map((p) => ({
        permissionId: p.permissionId,
        parentPermissionId: p.parentPermissionId ?? null,
        name: p.name,
        code: p.code,
        type: p.type,
        action: p.action,
        meta: p.menuMeta
          ? {
              path: p.menuMeta.path ?? null,
              icon: p.menuMeta.icon ?? null,
              hidden: p.menuMeta.hidden,
              component: p.menuMeta.component ?? null,
              sort: p.menuMeta.sort ?? 0,
            }
          : null,
      }));
    }
    type Node = {
      permissionId: string;
      parentPermissionId: string | null;
      name: string;
      code: string;
      type: string;
      action: string;
      meta?: {
        path: string | null;
        icon: string | null;
        hidden: boolean;
        component: string | null;
        sort: number;
      } | null;
      children?: Node[];
    };
    const map = new Map<string, Node>();
    const roots: Node[] = [];
    menus.forEach((m) => {
      map.set(m.permissionId, {
        permissionId: m.permissionId,
        parentPermissionId: m.parentPermissionId ?? null,
        name: m.name,
        code: m.code,
        type: m.type,
        action: m.action,
        meta: m.meta
          ? {
              path: m.meta.path ?? null,
              icon: m.meta.icon ?? null,
              hidden: m.meta.hidden ?? false,
              component: m.meta.component ?? null,
              sort: m.meta?.sort ?? 0,
            }
          : null,
        children: [],
      });
    });
    menus.forEach((m) => {
      const node = map.get(m.permissionId);
      if (!node) return;
      const pid = m.parentPermissionId;
      if (pid) {
        const parent = map.get(pid);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        } else {
          roots.push(node);
        }
      } else {
        roots.push(node);
      }
    });
    const sortByMeta = (nodes: Node[]) => {
      nodes.sort((a, b) => {
        const as = a.meta?.sort ?? 0;
        const bs = b.meta?.sort ?? 0;
        if (as !== bs) return as - bs;
        return a.name.localeCompare(b.name);
      });
      nodes.forEach((n) => {
        if (n.children && n.children.length > 0) sortByMeta(n.children);
      });
    };
    sortByMeta(roots);
    const result = plainToInstance(MenuResponseDto, roots, {
      excludeExtraneousValues: true,
    });
    return result;
  }

  private getClientIp(req?: RequestWithHeaders): string {
    const ip =
      (req?.headers?.['x-forwarded-for'] as string) ||
      (req?.headers?.['x-real-ip'] as string) ||
      (req?.headers?.['x-client-ip'] as string) ||
      (req?.headers?.['x-cluster-client-ip'] as string) ||
      req?.connection?.remoteAddress ||
      req?.socket?.remoteAddress ||
      req?.ip ||
      '127.0.0.1';

    // 将 IPv6 本地回环地址标准化为 IPv4
    return ip === '::1' ? '127.0.0.1' : ip;
  }

  private async recordLoginLog(logData: {
    account: string;
    ipAddress: string;
    userAgent: string;
    status: number; // HTTP status code
    loginType: string;
    failReason?: string;
  }): Promise<void> {
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

      // 获取IP地理位置信息
      const location = await this.getLocationFromIP(logData.ipAddress);

      await this.loginLogsService.create({
        account: logData.account,
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        status: logData.status >= 200 && logData.status < 300 ? LogStatus.SUCCESS : LogStatus.FAILURE,
        loginType: logData.loginType,
        failReason: logData.failReason,
        location,
        device,
        browser,
        os,
      });
    } catch (error) {
      console.error('记录登录日志失败:', error);
    }
  }

  /**
   * 根据IP地址获取地理位置信息
   * @param ipAddress IP地址
   * @returns 地理位置字符串
   */
  private async getLocationFromIP(
    ipAddress: string,
  ): Promise<string | undefined> {
    try {
      // 跳过本地IP地址
      if (
        ipAddress === '127.0.0.1' ||
        ipAddress === '::1' ||
        ipAddress.startsWith('192.168.') ||
        ipAddress.startsWith('10.') ||
        ipAddress.startsWith('172.')
      ) {
        return '本地网络';
      }

      // 使用 ip-api.com 免费服务获取地理位置
      const response = await fetch(
        `http://ip-api.com/json/${ipAddress}?lang=zh-CN`,
      );

      if (!response.ok) {
        console.warn(`IP地理位置查询失败: ${response.status}`);
        return undefined;
      }

      const data = (await response.json()) as {
        status: string;
        country?: string;
        regionName?: string;
        city?: string;
        message?: string;
      };

      if (data.status === 'success') {
        // 构建地理位置字符串：国家-省份-城市
        const locationParts: string[] = [];
        if (data.country) locationParts.push(data.country);
        if (data.regionName && data.regionName !== data.country) {
          locationParts.push(data.regionName);
        }
        if (data.city && data.city !== data.regionName) {
          locationParts.push(data.city);
        }

        return locationParts.length > 0 ? locationParts.join('-') : undefined;
      } else {
        console.warn(`IP地理位置查询失败: ${data.message}`);
        return undefined;
      }
    } catch (error) {
      console.warn('获取IP地理位置时发生错误:', error);
      return undefined;
    }
  }

  /**
   * 生成 Access Token
   */
  private generateAccessToken(payload: {
    sub: string;
    email: string | null;
    username: string;
  }): string {
    const expiresIn =
      this.configService.get<string>('jwt.accessTokenExpiresIn') || '2h';
    return this.jwtService.sign(payload, { expiresIn: expiresIn as any });
  }

  /**
   * 生成 Refresh Token 并存储到数据库
   */
  private async generateRefreshToken(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<string> {
    // 生成随机的 refresh token
    const token = crypto.randomBytes(64).toString('hex');
    
    // 计算过期时间
    const refreshTokenExpiresIn = this.configService.get<string>('jwt.refreshTokenExpiresIn') || '7d';
    const expiresAt = this.calculateExpirationDate(refreshTokenExpiresIn);

    // 存储到数据库
    await this.prisma.refreshToken.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return token;
  }

  /**
   * 使用 Refresh Token 刷新 Access Token
   */
  async refreshAccessToken(
    refreshToken: string,
  ): Promise<{
    access_token: string;
    refresh_token: string;
    access_token_expires_in: number;
    refresh_token_expires_in: number;
    expires_at: number;
  }> {
    // 查找 refresh token
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Refresh token 无效');
    }

    // 检查是否已撤销
    if (tokenRecord.isRevoked) {
      throw new UnauthorizedException('Refresh token 已被撤销');
    }

    // 检查是否过期
    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token 已过期');
    }

    // 获取用户信息
    const user = await this.prisma.user.findUnique({
      where: { userId: tokenRecord.userId },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 生成新的 access token
    const payload = {
      sub: user.userId,
      email: user.email,
      username: user.username,
    };
    const accessToken = this.generateAccessToken(payload);

    // 生成新的 refresh token（可选：可以选择复用旧的或生成新的）
    const newRefreshToken = await this.generateRefreshToken(
      user.userId,
      tokenRecord.ipAddress || undefined,
      tokenRecord.userAgent || undefined,
    );

    // 撤销旧的 refresh token
    await this.prisma.refreshToken.update({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });

    // 计算过期时间戳
    const accessTokenExpiresIn = this.parseExpiresIn(
      this.configService.get<string>('jwt.accessTokenExpiresIn') || '2h',
    );
    const refreshTokenExpiresIn = this.parseExpiresIn(
      this.configService.get<string>('jwt.refreshTokenExpiresIn') || '7d',
    );
    const now = Date.now();

    return {
      access_token: accessToken,
      refresh_token: newRefreshToken,
      access_token_expires_in: accessTokenExpiresIn,
      refresh_token_expires_in: refreshTokenExpiresIn,
      expires_at: now + accessTokenExpiresIn * 1000,
    };
  }

  /**
   * 撤销 Refresh Token
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token: refreshToken },
      data: { isRevoked: true },
    });
  }

  /**
   * 解析过期时间字符串为秒数
   */
  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);

    if (!match) {
      // 默认 2 小时
      return 2 * 60 * 60;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 24 * 60 * 60;
      default:
        return 2 * 60 * 60;
    }
  }

  /**
   * 计算过期时间
   */
  private calculateExpirationDate(expiresIn: string): Date {
    const now = new Date();
    const seconds = this.parseExpiresIn(expiresIn);
    return new Date(now.getTime() + seconds * 1000);
  }
}
