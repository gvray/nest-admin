import { ApiProperty } from '@nestjs/swagger';

// ==================== 写死：系统基础信息 ====================

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
    description: '默认头像',
    example: 'https://api.dicebear.com/9.x/bottts/svg?seed=GavinRay',
  })
  defaultAvatar: string;
}

// ==================== 写死：环境信息 ====================

export class RuntimeEnvDto {
  @ApiProperty({ description: '运行环境', example: 'development' })
  mode: string;

  @ApiProperty({ description: 'API 基础路径', example: '/api/v1' })
  apiPrefix: string;
}

// ==================== 管理员可改：UI 默认偏好（key 与 preferences 一致） ====================

export class RuntimeUiDefaultsDto {
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

  @ApiProperty({
    description: '系统欢迎语',
    example: '这是你的系统运行概览，祝你工作愉快',
  })
  welcomeMessage: string;

  @ApiProperty({ description: '是否显示面包屑', example: true })
  showBreadcrumb: boolean;
}

// ==================== 管理员可改：安全策略 ====================

export class RuntimeSecurityPolicyDto {
  @ApiProperty({ description: '水印开关', example: true })
  watermarkEnabled: boolean;

  @ApiProperty({ description: '密码最小长度', example: 6 })
  passwordMinLength: number;

  @ApiProperty({ description: '密码复杂度要求', example: true })
  passwordRequireComplexity: boolean;

  @ApiProperty({ description: '登录失败锁定次数', example: 5 })
  loginFailureLockCount: number;
}

// ==================== 管理员可改：功能开关 ====================

export class RuntimeFeaturesDto {
  @ApiProperty({ description: '文件上传最大大小（字节）', example: 10485760 })
  fileUploadMaxSize: number;

  @ApiProperty({
    description: '允许上传的文件类型',
    example: 'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx',
  })
  fileUploadAllowedTypes: string;

  @ApiProperty({ description: 'OSS 上传启用', example: false })
  ossEnabled: boolean;

  @ApiProperty({ description: '邮件功能启用', example: false })
  emailEnabled: boolean;

  @ApiProperty({ description: 'GitHub OAuth 登录', example: false })
  oauthGithubEnabled: boolean;
}

// ==================== 动态计算：系统能力 ====================

export class RuntimeCapabilitiesDto {
  @ApiProperty({ description: '已注册用户总数', example: 22 })
  totalUsers: number;

  @ApiProperty({ description: '可用角色数', example: 3 })
  totalRoles: number;

  @ApiProperty({ description: '权限总数', example: 56 })
  totalPermissions: number;
}

// ==================== 顶层响应 ====================

export class RuntimeConfigResponseDto {
  @ApiProperty({
    description: '系统基础信息（写死/env）',
    type: RuntimeSystemDto,
  })
  system: RuntimeSystemDto;

  @ApiProperty({ description: '环境信息（写死/env）', type: RuntimeEnvDto })
  env: RuntimeEnvDto;

  @ApiProperty({
    description:
      'UI 默认偏好（管理员可改，key 与 preferences 一致，可被用户偏好覆盖）',
    type: RuntimeUiDefaultsDto,
  })
  uiDefaults: RuntimeUiDefaultsDto;

  @ApiProperty({
    description: '安全策略（管理员可改）',
    type: RuntimeSecurityPolicyDto,
  })
  securityPolicy: RuntimeSecurityPolicyDto;

  @ApiProperty({
    description: '功能开关（管理员可改）',
    type: RuntimeFeaturesDto,
  })
  features: RuntimeFeaturesDto;

  @ApiProperty({
    description: '系统能力（动态计算）',
    type: RuntimeCapabilitiesDto,
  })
  capabilities: RuntimeCapabilitiesDto;
}
