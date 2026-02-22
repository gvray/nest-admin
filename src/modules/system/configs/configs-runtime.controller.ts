import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigsService } from './configs.service';
import { RuntimeConfigResponseDto } from './dto/runtime-config-response.dto';
import { ResponseUtil } from '@/shared/utils/response.util';

@ApiTags('运行时配置')
@Controller('system')
export class ConfigsRuntimeController {
  constructor(private readonly configsService: ConfigsService) {}

  @Get('runtime-config')
  @ApiOperation({
    summary: '获取前端运行时配置',
    description:
      '公开接口，无需认证。前端初始化系统时拉取必要配置。仅返回安全白名单字段，敏感配置不会暴露。',
  })
  @ApiResponse({
    status: 200,
    description: '运行时配置（仅安全字段）',
    type: RuntimeConfigResponseDto,
  })
  async getRuntimeConfig() {
    const data = await this.configsService.getRuntimeConfig();
    return ResponseUtil.success(data, '获取运行时配置成功');
  }
}
