import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('认证管理')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ 
    summary: '注册新用户',
    description: '注册一个新的用户账户，支持用户名和邮箱注册'
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
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'user@example.com' },
            username: { type: 'string', example: 'username' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: '请求参数错误' })
  @ApiResponse({ status: 401, description: '邮箱已被注册' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ 
    summary: '用户登录',
    description: '支持用户名或邮箱登录，返回JWT访问令牌'
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
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        },
        user: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            email: { type: 'string', example: 'admin@example.com' },
            username: { type: 'string', example: 'admin' },
            isActive: { type: 'boolean', example: true },
            roles: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 1 },
                  name: { type: 'string', example: 'admin' },
                  permissions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', example: 1 },
                        name: { type: 'string', example: '用户管理' },
                        code: { type: 'string', example: 'user:manage' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: '用户名/邮箱或密码错误' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
