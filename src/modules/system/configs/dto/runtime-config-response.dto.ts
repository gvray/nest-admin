import { ApiProperty } from '@nestjs/swagger';

export class RuntimeSystemDto {
  @ApiProperty({ description: '系统名称', example: 'G-ADMIN' })
  name: string;

  @ApiProperty({
    description: '系统描述',
    example: '基于 React + NestJS 的企业级 RBAC 权限管理系统',
  })
  description: string;

  @ApiProperty({ description: '系统Logo', example: '/logo.svg' })
  logo: string;

  @ApiProperty({ description: '系统Favicon', example: '/favicon.ico' })
  favicon: string;

  @ApiProperty({
    description: '系统欢迎语',
    example: '这是你的系统运行概览，祝你工作愉快',
  })
  welcomeMessage: string;
}

export class RuntimeDefaultsDto {
  @ApiProperty({ description: '默认主题', example: 'light' })
  theme: string;

  @ApiProperty({ description: '默认语言', example: 'zh-CN' })
  language: string;

  @ApiProperty({ description: '默认时区', example: 'Asia/Shanghai' })
  timezone: string;

  @ApiProperty({ description: '侧边栏默认折叠', example: false })
  sidebarCollapsed: boolean;

  @ApiProperty({ description: '表格默认分页大小', example: 10 })
  pageSize: number;

  @ApiProperty({ description: '默认配色方案', example: 'default' })
  colorScheme: string;

  @ApiProperty({ description: '默认显示水印', example: true })
  showWatermark: boolean;

  @ApiProperty({ description: '默认启用通知', example: true })
  enableNotification: boolean;
}

export class RuntimeFeaturesDto {
  @ApiProperty({ description: '是否启用GitHub登录', example: false })
  oauthGithubEnabled: boolean;

  @ApiProperty({ description: '文件上传最大大小（字节）', example: 10485760 })
  fileUploadMaxSize: number;

  @ApiProperty({
    description: '允许上传的文件类型',
    example: 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx',
  })
  fileUploadAllowedTypes: string;
}

export class RuntimeAssetsDto {
  @ApiProperty({
    description: '默认头像',
    example: 'https://api.dicebear.com/9.x/bottts/svg?seed=GavinRay',
  })
  defaultAvatar: string;
}

export class RuntimeConfigResponseDto {
  @ApiProperty({ description: '系统基础信息', type: RuntimeSystemDto })
  system: RuntimeSystemDto;

  @ApiProperty({
    description: '默认偏好设置（key 与 preferences 一致，可被用户偏好覆盖）',
    type: RuntimeDefaultsDto,
  })
  defaults: RuntimeDefaultsDto;

  @ApiProperty({ description: '功能开关与限制', type: RuntimeFeaturesDto })
  features: RuntimeFeaturesDto;

  @ApiProperty({ description: '资源地址', type: RuntimeAssetsDto })
  assets: RuntimeAssetsDto;
}
