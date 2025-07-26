import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { ResponseUtil } from '../../shared/utils/response.util';
import { ApiResponse } from '../../shared/interfaces/response.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<ApiResponse<any>> {
    const { email, username, password } = registerDto;

    // 检查邮箱是否已存在
    const existingUser = await this.usersService.findOneByEmail(email);

    if (existingUser) {
      throw new UnauthorizedException('邮箱已被注册');
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户 - 直接调用 Prisma，因为 usersService.create 现在返回 ApiResponse
    const user = await this.usersService['prisma'].user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        isActive: true,
      },
      include: {
        roles: true,
        department: true,
        position: true,
      },
    });

    // 生成 token
    const payload = {
      sub: user.id,
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

  async login(loginDto: LoginDto): Promise<ApiResponse<any>> {
    const user = await this.validateUser(loginDto.account, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('用户名/邮箱/手机号或密码错误');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const result = {
      access_token: this.jwtService.sign(payload),
    };

    return ResponseUtil.success(result, '登录成功');
  }

  async getCurrentUser(userId: number): Promise<ApiResponse<any>> {
    const user = await this.usersService['prisma'].user.findUnique({
      where: { id: userId },
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
}
