import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PERMISSION_METADATA } from '@/shared/constants/permissions.constant';
import { ResponseUtil } from '@/shared/utils/response.util';

@ApiTags('权限配置')
@Controller('permissions-config')
export class PermissionsConfigController {
  @Get()
  @ApiOperation({ summary: '获取权限配置元数据（供前端使用）' })
  @ApiResponse({
    status: 200,
    description: '权限配置列表',
    schema: {
      type: 'object',
      properties: {
        user: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'system:user:view' },
              name: { type: 'string', example: '查看用户' },
              type: { type: 'string', example: 'BUTTON' },
              description: { type: 'string', example: '查看用户列表和详情' },
            },
          },
        },
      },
    },
  })
  getPermissionsConfig() {
    return ResponseUtil.success(PERMISSION_METADATA, '权限配置获取成功');
  }
}
