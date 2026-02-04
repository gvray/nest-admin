import { Body, Controller, Get, Post, UseGuards, Req } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { MenuResponseDto } from './dto/menu-response.dto';
import { ResponseUtil } from '../../shared/utils/response.util';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { CurrentUser } from '../../core/decorators/current-user.decorator';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({
    summary: '注册新用户',
    description: '注册一个新的用户账户，支持用户名和邮箱注册',
  })
  @ApiResponse({
    status: 201,
    description: '注册成功',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT访问令牌',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: {
              type: 'string',
              example: 'user@example.com',
              nullable: true,
              description: '用户邮箱（可选）',
            },
            username: { type: 'string', example: 'username' },
            nickname: {
              type: 'string',
              example: '小明',
              description: '用户昵称（必须）',
            },
            status: {
              type: 'number',
              example: 1,
              description: '用户状态: 0-禁用, 1-启用, 2-审核中, 3-封禁',
            },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '邮箱已被注册' })
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    return ResponseUtil.created(data, '注册成功');
  }

  @Post('login')
  @ApiOperation({
    summary: '用户登录',
    description: '支持用户名或邮箱登录，返回JWT访问令牌',
  })
  @ApiResponse({
    status: 200,
    description: '登录成功',
    schema: {
      type: 'object',
      properties: {
        access_token: {
          type: 'string',
          description: 'JWT访问令牌',
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: '用户名/邮箱或密码错误' })
  async login(@Body() loginDto: LoginDto, @Req() req: any) {
    const data = await this.authService.login(loginDto, req);
    return ResponseUtil.success(data, '登录成功');
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({
    status: 200,
    description: '成功获取当前用户信息',
    type: CurrentUserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'JWT令牌无效或已过期',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 401 },
        message: { type: 'string', example: 'JWT令牌无效或已过期' },
        data: { type: 'null', example: null },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/profile' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: '用户账户已被禁用',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 403 },
        message: { type: 'string', example: '用户账户已被禁用' },
        data: { type: 'null', example: null },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/profile' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: '用户不存在',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 404 },
        message: { type: 'string', example: '用户不存在' },
        data: { type: 'null', example: null },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/profile' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: '服务器内部错误',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 500 },
        message: { type: 'string', example: '服务器内部错误' },
        data: { type: 'null', example: null },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/profile' },
      },
    },
  })
  async profile(@CurrentUser() user: { userId: string }) {
    const data = await this.authService.getCurrentUser(user.userId);
    return ResponseUtil.found(data, '获取当前用户信息');
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '用户退出登录',
    description: '退出当前用户登录状态，客户端需要删除本地存储的JWT令牌',
  })
  @ApiResponse({
    status: 200,
    description: '退出登录成功',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 200 },
        message: { type: 'string', example: '退出登录成功' },
        data: { type: 'null', example: null },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/logout' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'JWT令牌无效或已过期',
    schema: {
      type: 'object',
      properties: {
        code: { type: 'number', example: 401 },
        message: { type: 'string', example: 'JWT令牌无效或已过期' },
        data: { type: 'null', example: null },
        timestamp: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
        path: { type: 'string', example: '/api/auth/logout' },
      },
    },
  })
  logout() {
    this.authService.logout();
    return ResponseUtil.success(null, '退出登录成功');
  }

  @Get('menus')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户可见菜单' })
  @ApiResponse({ status: 200, description: '菜单树', type: [MenuResponseDto] })
  async menus(@CurrentUser() user: { userId: string }) {
    const data = await this.authService.getMenus(user.userId);
    return ResponseUtil.found(data, '获取菜单成功');
  }
}
