import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { ResponseUtil } from '../../shared/utils/response.util';
import { ApiResponse } from '../../shared/interfaces/response.interface';
import { UserStatus } from '../../shared/constants/user-status.constant';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<unknown>> {
    const { email, username, nickname, password } = registerDto;

    // 检查邮箱是否已存在（如果提供了邮箱）
    if (email) {
      const existingUser = await this.usersService.findOneByEmail(email);
      if (existingUser) {
        throw new UnauthorizedException('邮箱已被注册');
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
        roles: true,
        department: true,
        position: true,
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
    const user = await this.usersService.findOneByAccount(account);
    if (user && (await bcrypt.compare(password, user.password))) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...result } = user;
      return result;
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

  async getCurrentUser(userId: string): Promise<ApiResponse<unknown>> {
    const user = await this.usersService['prisma'].user.findUnique({
      where: { userId: userId },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
        department: true,
        position: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 移除密码字段
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return ResponseUtil.success(userWithoutPassword, '获取用户信息成功');
  }

  logout(): ApiResponse<unknown> {
    // 在无状态JWT系统中，logout主要是客户端删除token
    // 这里返回成功响应，实际的token失效由客户端处理
    return ResponseUtil.success(null, '退出登录成功');
  }
}
