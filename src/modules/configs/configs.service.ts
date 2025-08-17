import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { QueryConfigDto } from './dto/query-config.dto';
import { ConfigResponseDto } from './dto/config-response.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ConfigsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createConfigDto: CreateConfigDto, userId: string): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.create({
      data: {
        ...createConfigDto,
        createdById: userId,
      },
    });

    return plainToInstance(ConfigResponseDto, config, { excludeExtraneousValues: true });
  }

  async findAll(query: QueryConfigDto): Promise<ConfigResponseDto[] | any> {
    const { page, pageSize, key, name, type, group, status, ...rest } = query;
    
    const where: any = {};
    if (key) where.key = { contains: key };
    if (name) where.name = { contains: name };
    if (type) where.type = type;
    if (group) where.group = group;
    if (status !== undefined) where.status = status;

    // 检查是否需要分页
    const hasPagination = page !== undefined && pageSize !== undefined;
    
    if (hasPagination) {
      const skip = (page - 1) * pageSize;
      const take = pageSize;

      const [configs, total] = await Promise.all([
        this.prisma.config.findMany({
          where,
          orderBy: { sort: 'asc' },
          skip,
          take,
        }),
        this.prisma.config.count({ where }),
      ]);

      const transformedConfigs = configs.map(config => 
        plainToInstance(ConfigResponseDto, config, { excludeExtraneousValues: true })
      );

      return {
        items: transformedConfigs,
        pagination: {
          page,
          pageSize,
          total,
          pages: Math.ceil(total / pageSize),
        },
      };
    } else {
      // 不分页，返回所有数据
      const configs = await this.prisma.config.findMany({
        where,
        orderBy: { sort: 'asc' },
      });

      const transformedConfigs = configs.map(config => 
        plainToInstance(ConfigResponseDto, config, { excludeExtraneousValues: true })
      );

      return transformedConfigs;
    }
  }

  async findOne(configId: string): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.findUnique({
      where: { configId },
    });

    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    return plainToInstance(ConfigResponseDto, config, { excludeExtraneousValues: true });
  }

  async findByKey(key: string): Promise<ConfigResponseDto> {
    const config = await this.prisma.config.findUnique({
      where: { key },
    });

    if (!config) {
      throw new NotFoundException('配置不存在');
    }

    return plainToInstance(ConfigResponseDto, config, { excludeExtraneousValues: true });
  }

  async findByGroup(group: string): Promise<ConfigResponseDto[]> {
    const configs = await this.prisma.config.findMany({
      where: { group, status: 1 },
      orderBy: { sort: 'asc' },
    });

    return configs.map(config => 
      plainToInstance(ConfigResponseDto, config, { excludeExtraneousValues: true })
    );
  }

  async update(configId: string, updateConfigDto: UpdateConfigDto, userId: string): Promise<ConfigResponseDto> {
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

    return plainToInstance(ConfigResponseDto, updatedConfig, { excludeExtraneousValues: true });
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

  async getConfigsByKeys(keys: string[]): Promise<Record<string, any>> {
    const configs = await this.prisma.config.findMany({
      where: {
        key: { in: keys },
        status: 1,
      },
    });

    const result: Record<string, any> = {};
    
    for (const config of configs) {
      let value: any = config.value;
      
      // 根据类型转换值
      switch (config.type) {
        case 'number':
          value = Number(value);
          break;
        case 'boolean':
          value = value === 'true' || value === '1';
          break;
        case 'json':
          try {
            value = JSON.parse(value);
          } catch {
            // 如果解析失败，保持原值
          }
          break;
        default:
          // string类型，保持原值
          break;
      }
      
      result[config.key] = value;
    }

    return result;
  }
} 