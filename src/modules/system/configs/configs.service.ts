import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { ConfigResponseDto } from './dto/config-response.dto';
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
      where: { group, status: 1 },
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

  async getConfigsByKeys(keys: string[]): Promise<Record<string, unknown>> {
    const configs = await this.prisma.config.findMany({
      where: {
        key: { in: keys },
        status: 1,
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
