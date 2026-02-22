import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CommonStatus } from '@/shared/constants/common-status.constant';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { ConfigResponseDto } from './dto/config-response.dto';
import { RuntimeConfigResponseDto } from './dto/runtime-config-response.dto';
import { plainToInstance } from 'class-transformer';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';

@Injectable()
export class ConfigsService extends BaseService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createConfigDto: CreateConfigDto,
    userId: string,
  ): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.create({
      data: {
        ...createConfigDto,
        createdById: userId,
      },
    });

    return plainToInstance(ConfigResponseDto, config, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: QueryConfigDto,
  ): Promise<PaginationData<ConfigResponseDto>> {
    const { key, name, type, group, status, createdAtStart, createdAtEnd } =
      query;
    const where = this.buildWhere({
      contains: { key, name },
      equals: { type, group, status },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });

    const state = this.getPaginationState(query);
    if (state) {
      const [configs, total] = await Promise.all([
        this.prisma.config.findMany({
          where,
          orderBy: { sort: 'asc' },
          skip: state.skip,
          take: state.take,
        }),
        this.prisma.config.count({ where }),
      ]);
      const transformed = configs.map((config) =>
        plainToInstance(ConfigResponseDto, config, {
          excludeExtraneousValues: true,
        }),
      );
      return {
        items: transformed,
        total,
        page: state.page,
        pageSize: state.pageSize,
      };
    }

    const configs = await this.prisma.config.findMany({
      where,
      orderBy: { sort: 'asc' },
    });
    const transformed = configs.map((config) =>
      plainToInstance(ConfigResponseDto, config, {
        excludeExtraneousValues: true,
      }),
    );
    const total = await this.prisma.config.count({ where });
    return {
      items: transformed,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? transformed.length,
    };
  }

  async findOne(configId: string): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.findUnique({
      where: { configId },
    });

    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    return plainToInstance(ConfigResponseDto, config, {
      excludeExtraneousValues: true,
    });
  }

  async findByKey(key: string): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    return plainToInstance(ConfigResponseDto, config, {
      excludeExtraneousValues: true,
    });
  }

  async findByGroup(group: string): Promise<ConfigResponseDto[]> {
    const configs = await this.prisma.config.findMany({
      where: { group, status: CommonStatus.ENABLED },
      orderBy: { sort: 'asc' },
    });

    return configs.map((config) =>
      plainToInstance(ConfigResponseDto, config, {
        excludeExtraneousValues: true,
      }),
    );
  }

  async update(
    configId: string,
    updateConfigDto: UpdateConfigDto,
    userId: string,
  ): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.findUnique({
      where: { configId },
    });

    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    const updatedConfig = await this.prisma.config.update({
      where: { configId },
      data: {
        ...updateConfigDto,
        updatedById: userId,
      },
    });

    return plainToInstance(ConfigResponseDto, updatedConfig, {
      excludeExtraneousValues: true,
    });
  }

  async remove(configId: string): Promise<void> {
    const config = await this.prisma.config.findUnique({
      where: { configId },
    });

    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    await this.prisma.config.delete({
      where: { configId },
    });
  }

  async removeMany(ids: string[]): Promise<void> {
    const validIds = ids.filter(
      (id) => typeof id === 'string' && id.length > 0,
    );
    if (validIds.length === 0) {
      throw new BadRequestException('缺少有效的配置ID列表');
    }
    await this.prisma.config.deleteMany({
      where: { configId: { in: validIds } },
    });
  }

  /**
   * 获取前端运行时配置（公开接口，无需认证）
   * - system / env：写死或读环境变量
   * - uiDefaults / securityPolicy / features：从 config 表读取，管理员可改
   * - capabilities：动态计算
   */
  async getRuntimeConfig(): Promise<RuntimeConfigResponseDto> {
    // 1. 从 config 表批量读取管理员可改项
    const configKeys = [
      'uiDefaults.theme',
      'uiDefaults.language',
      'uiDefaults.timezone',
      'uiDefaults.sidebarCollapsed',
      'uiDefaults.pageSize',
      'uiDefaults.welcomeMessage',
      'uiDefaults.showBreadcrumb',
      'securityPolicy.watermark.enabled',
      'securityPolicy.password.minLength',
      'securityPolicy.password.requireComplexity',
      'securityPolicy.login.failureLockCount',
      'features.fileUpload.maxSize',
      'features.fileUpload.allowedTypes',
      'features.oss.enabled',
      'features.email.enabled',
      'features.oauth.github.enabled',
    ];

    const configs = await this.prisma.config.findMany({
      where: { key: { in: configKeys }, status: CommonStatus.ENABLED },
    });

    const configMap = new Map<string, string>();
    for (const c of configs) {
      configMap.set(c.key, c.value);
    }

    const str = (key: string, fallback: string) =>
      configMap.get(key) ?? fallback;
    const num = (key: string, fallback: number) => {
      const v = configMap.get(key);
      return v !== undefined ? Number(v) : fallback;
    };
    const bool = (key: string, fallback: boolean) => {
      const v = configMap.get(key);
      return v !== undefined ? v === 'true' || v === '1' : fallback;
    };

    // 2. 动态计算 capabilities
    const [totalUsers, totalRoles, totalPermissions] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.role.count(),
      this.prisma.permission.count(),
    ]);

    return {
      // 写死
      system: {
        name: 'G-ADMIN',
        description:
          '🦄 基于 React + Umi + Ant Design 的现代企业级 RBAC 权限管理系统',
        logo: '/logo.svg',
        favicon: '/favicon.ico',
        defaultAvatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=GavinRay',
      },
      env: {
        mode: process.env.NODE_ENV || 'development',
        apiPrefix: '/api/v1',
      },
      // 管理员可改（从 config 表）
      uiDefaults: {
        theme: str('uiDefaults.theme', 'light'),
        language: str('uiDefaults.language', 'zh-CN'),
        timezone: str('uiDefaults.timezone', 'Asia/Shanghai'),
        sidebarCollapsed: bool('uiDefaults.sidebarCollapsed', false),
        pageSize: num('uiDefaults.pageSize', 10),
        welcomeMessage: str(
          'uiDefaults.welcomeMessage',
          '这是你的系统运行概览，祝你工作愉快',
        ),
        showBreadcrumb: bool('uiDefaults.showBreadcrumb', true),
      },
      securityPolicy: {
        watermarkEnabled: bool('securityPolicy.watermark.enabled', true),
        passwordMinLength: num('securityPolicy.password.minLength', 6),
        passwordRequireComplexity: bool(
          'securityPolicy.password.requireComplexity',
          true,
        ),
        loginFailureLockCount: num('securityPolicy.login.failureLockCount', 5),
      },
      features: {
        fileUploadMaxSize: num('features.fileUpload.maxSize', 10485760),
        fileUploadAllowedTypes: str(
          'features.fileUpload.allowedTypes',
          'jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx',
        ),
        ossEnabled: bool('features.oss.enabled', false),
        emailEnabled: bool('features.email.enabled', false),
        oauthGithubEnabled: bool('features.oauth.github.enabled', false),
      },
      // 动态计算
      capabilities: {
        totalUsers,
        totalRoles,
        totalPermissions,
      },
    };
  }

  async getConfigsByKeys(keys: string[]): Promise<Record<string, unknown>> {
    const configs = await this.prisma.config.findMany({
      where: {
        key: { in: keys },
        status: CommonStatus.ENABLED,
      },
    });

    const result: Record<string, unknown> = {};

    for (const config of configs) {
      const raw = config.value;
      let value: unknown;

      // 根据类型转换值
      switch (config.type) {
        case 'number':
          value = Number(raw);
          break;
        case 'boolean':
          value = raw === 'true' || raw === '1';
          break;
        case 'json':
          try {
            value = JSON.parse(raw);
          } catch {
            // 如果解析失败，保持原值
            value = raw;
          }
          break;
        default:
          // string类型，保持原值
          value = raw;
          break;
      }

      result[config.key] = value;
    }

    return result;
  }
}
