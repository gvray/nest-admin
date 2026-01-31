import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateDictionaryTypeDto } from './dto/create-dictionary-type.dto';
import { UpdateDictionaryTypeDto } from './dto/update-dictionary-type.dto';
import { QueryDictionaryTypeDto } from './dto/query-dictionary-type.dto';
import { DictionaryTypeResponseDto } from './dto/dictionary-type-response.dto';
import { CreateDictionaryItemDto } from './dto/create-dictionary-item.dto';
import { UpdateDictionaryItemDto } from './dto/update-dictionary-item.dto';
import { QueryDictionaryItemDto } from './dto/query-dictionary-item.dto';
import { DictionaryItemResponseDto } from './dto/dictionary-item-response.dto';
import { plainToInstance } from 'class-transformer';
import { startOfDay, endOfDay } from '@/shared/utils/time.util';

@Injectable()
export class DictionariesService {
  constructor(private readonly prisma: PrismaService) {}

  // 字典类型相关方法
  async createDictionaryType(
    createDictionaryTypeDto: CreateDictionaryTypeDto,
    currentUserId?: string,
  ): Promise<DictionaryTypeResponseDto> {
    // 检查编码是否已存在
    const existingType = await this.prisma.dictionaryType.findUnique({
      where: { code: createDictionaryTypeDto.code },
    });

    if (existingType) {
      throw new ConflictException('字典类型编码已存在');
    }

    const dictionaryType = await this.prisma.dictionaryType.create({
      data: {
        ...createDictionaryTypeDto,
        createdById: currentUserId,
      },
    });

    return plainToInstance(DictionaryTypeResponseDto, dictionaryType, {
      excludeExtraneousValues: true,
    });
  }

  async findAllDictionaryTypes(
    query: QueryDictionaryTypeDto,
  ): Promise<DictionaryTypeResponseDto[] | any> {
    const {
      page,
      pageSize,
      code,
      name,
      status,
      createdAtStart,
      createdAtEnd,
      ...rest
    } = query;

    const where: any = {};
    if (code) {
      where.code = { contains: code };
    }
    if (name) {
      where.name = { contains: name };
    }
    if (status !== undefined) {
      where.status = status;
    }

    if (createdAtStart || createdAtEnd) {
      const o: Record<string, Date> = {};
      if (createdAtStart) o.gte = startOfDay(createdAtStart);
      if (createdAtEnd) o.lte = endOfDay(createdAtEnd);
      where.createdAt = o;
    }

    const hasPaginationParams =
      query.page !== undefined || query.pageSize !== undefined;

    if (hasPaginationParams) {
      const skip = query.page ? (query.page - 1) * query.pageSize! : 0;
      const take = query.pageSize || 10;
      const [data, total] = await Promise.all([
        this.prisma.dictionaryType.findMany({
          where,
          skip,
          take,
          orderBy: { sort: 'asc' },
        }),
        this.prisma.dictionaryType.count({ where }),
      ]);

      const totalPages = Math.ceil(total / take);
      const hasNext = query.page! < totalPages;
      const hasPrev = query.page! > 1;

      const paginationData = {
        items: plainToInstance(DictionaryTypeResponseDto, data, {
          excludeExtraneousValues: true,
        }),
        total,
        page: query.page!,
        pageSize: query.pageSize!,
        totalPages,
        hasNext,
        hasPrev,
      };

      return paginationData;
    } else {
      const data = await this.prisma.dictionaryType.findMany({
        where,
        orderBy: { sort: 'asc' },
      });

      return plainToInstance(DictionaryTypeResponseDto, data, {
        excludeExtraneousValues: true,
      });
    }
  }

  async findOneDictionaryType(
    typeId: string,
  ): Promise<DictionaryTypeResponseDto> {
    console.log('findOneDictionaryType called with typeId:', typeId);
    const dictionaryType = await this.prisma.dictionaryType.findUnique({
      where: { typeId },
      include: {
        items: {
          where: { status: 1 },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!dictionaryType) {
      throw new NotFoundException('字典类型不存在');
    }

    return plainToInstance(DictionaryTypeResponseDto, dictionaryType, {
      excludeExtraneousValues: true,
    });
  }

  async updateDictionaryType(
    typeId: string,
    updateDictionaryTypeDto: UpdateDictionaryTypeDto,
    currentUserId?: string,
  ): Promise<DictionaryTypeResponseDto> {
    const existingType = await this.prisma.dictionaryType.findUnique({
      where: { typeId },
    });

    if (!existingType) {
      throw new NotFoundException('字典类型不存在');
    }

    // 检查编码是否与其他类型冲突
    if (updateDictionaryTypeDto.code) {
      const conflictType = await this.prisma.dictionaryType.findFirst({
        where: {
          code: updateDictionaryTypeDto.code,
          NOT: { typeId },
        },
      });

      if (conflictType) {
        throw new ConflictException('字典类型编码已存在');
      }
    }

    const dictionaryType = await this.prisma.dictionaryType.update({
      where: { typeId },
      data: {
        ...updateDictionaryTypeDto,
        updatedById: currentUserId,
      },
    });

    return plainToInstance(DictionaryTypeResponseDto, dictionaryType, {
      excludeExtraneousValues: true,
    });
  }

  async removeDictionaryType(typeId: string): Promise<void> {
    const dictionaryType = await this.prisma.dictionaryType.findUnique({
      where: { typeId },
      include: {
        items: true,
      },
    });

    if (!dictionaryType) {
      throw new NotFoundException('字典类型不存在');
    }

    if (dictionaryType.items.length > 0) {
      throw new ConflictException('该字典类型下还有字典项，无法删除');
    }

    await this.prisma.dictionaryType.delete({
      where: { typeId },
    });
  }

  // 字典项相关方法
  async createDictionaryItem(
    createDictionaryItemDto: CreateDictionaryItemDto,
    currentUserId?: string,
  ): Promise<DictionaryItemResponseDto> {
    // 检查字典类型是否存在
    const dictionaryType = await this.prisma.dictionaryType.findUnique({
      where: { code: createDictionaryItemDto.typeCode },
    });

    if (!dictionaryType) {
      throw new NotFoundException('字典类型不存在');
    }

    const dictionaryItem = await this.prisma.dictionaryItem.create({
      data: {
        ...createDictionaryItemDto,
        createdById: currentUserId,
      },
    });

    return plainToInstance(DictionaryItemResponseDto, dictionaryItem, {
      excludeExtraneousValues: true,
    });
  }

  async findAllDictionaryItems(
    query: QueryDictionaryItemDto,
  ): Promise<DictionaryItemResponseDto[] | any> {
    const { page, pageSize, typeCode, label, value, status, ...rest } = query;

    const where: any = {};
    if (typeCode) {
      where.typeCode = typeCode;
    }
    if (label) {
      where.label = { contains: label };
    }
    if (value) {
      where.value = { contains: value };
    }
    if (status !== undefined) {
      where.status = status;
    }

    const hasPaginationParams =
      query.page !== undefined || query.pageSize !== undefined;

    if (hasPaginationParams) {
      const skip = query.page ? (query.page - 1) * query.pageSize! : 0;
      const take = query.pageSize || 10;
      const [data, total] = await Promise.all([
        this.prisma.dictionaryItem.findMany({
          where,
          skip,
          take,
          orderBy: { sort: 'asc' },
          include: {
            type: {
              select: {
                typeId: true,
                code: true,
                name: true,
              },
            },
          },
        }),
        this.prisma.dictionaryItem.count({ where }),
      ]);

      const totalPages = Math.ceil(total / take);
      const hasNext = query.page! < totalPages;
      const hasPrev = query.page! > 1;

      const paginationData = {
        items: plainToInstance(DictionaryItemResponseDto, data, {
          excludeExtraneousValues: true,
        }),
        total,
        page: query.page!,
        pageSize: query.pageSize!,
        totalPages,
        hasNext,
        hasPrev,
      };

      return paginationData;
    } else {
      const data = await this.prisma.dictionaryItem.findMany({
        where,
        orderBy: { sort: 'asc' },
        include: {
          type: {
            select: {
              typeId: true,
              name: true,
            },
          },
        },
      });

      return plainToInstance(DictionaryItemResponseDto, data, {
        excludeExtraneousValues: true,
      });
    }
  }

  async findOneDictionaryItem(
    itemId: string,
  ): Promise<DictionaryItemResponseDto> {
    const dictionaryItem = await this.prisma.dictionaryItem.findUnique({
      where: { itemId },
      include: {
        type: {
          select: {
            typeId: true,
            code: true,
            name: true,
          },
        },
      },
    });

    if (!dictionaryItem) {
      throw new NotFoundException('字典项不存在');
    }

    return plainToInstance(DictionaryItemResponseDto, dictionaryItem, {
      excludeExtraneousValues: true,
    });
  }

  async updateDictionaryItem(
    itemId: string,
    updateDictionaryItemDto: UpdateDictionaryItemDto,
    currentUserId?: string,
  ): Promise<DictionaryItemResponseDto> {
    const existingItem = await this.prisma.dictionaryItem.findUnique({
      where: { itemId },
    });

    if (!existingItem) {
      throw new NotFoundException('字典项不存在');
    }

    const dictionaryItem = await this.prisma.dictionaryItem.update({
      where: { itemId },
      data: {
        ...updateDictionaryItemDto,
        updatedById: currentUserId,
      },
    });

    return plainToInstance(DictionaryItemResponseDto, dictionaryItem, {
      excludeExtraneousValues: true,
    });
  }

  async removeDictionaryItem(itemId: string): Promise<void> {
    const dictionaryItem = await this.prisma.dictionaryItem.findUnique({
      where: { itemId },
    });

    if (!dictionaryItem) {
      throw new NotFoundException('字典项不存在');
    }

    await this.prisma.dictionaryItem.delete({
      where: { itemId },
    });
  }

  // 根据字典类型编码获取字典项列表
  async getDictionaryItemsByTypeCode(
    typeCode: string,
  ): Promise<DictionaryItemResponseDto[]> {
    console.log('getDictionaryItemsByTypeCode called with typeCode:', typeCode);
    const dictionaryType = await this.prisma.dictionaryType.findUnique({
      where: { code: typeCode },
      include: {
        items: {
          where: { status: 1 },
          orderBy: { sort: 'asc' },
        },
      },
    });

    if (!dictionaryType) {
      throw new NotFoundException('字典类型不存在');
    }

    return plainToInstance(DictionaryItemResponseDto, dictionaryType.items, {
      excludeExtraneousValues: true,
    });
  }

  // 根据多个字典类型编码获取字典项列表
  async getDictionaryItemsByTypeCodes(
    typeCodes: string[],
  ): Promise<Record<string, any[]>> {
    console.log(
      'getDictionaryItemsByTypeCodes called with typeCodes:',
      typeCodes,
    );
    const result: Record<string, any[]> = {};

    for (const typeCode of typeCodes) {
      try {
        // 首先检查字典类型是否存在
        const dictionaryType = await this.prisma.dictionaryType.findUnique({
          where: { code: typeCode },
        });

        if (!dictionaryType) {
          result[typeCode] = [];
          continue;
        }

        const dictionaryItems = await this.prisma.dictionaryItem.findMany({
          where: {
            typeCode: typeCode,
            status: 1,
          },
          orderBy: { sort: 'asc' },
        });

        result[typeCode] = dictionaryItems.map((item) => ({
          value: item.value,
          label: item.label,
        }));
      } catch (error) {
        // 如果某个字典类型不存在，返回空数组
        result[typeCode] = [];
      }
    }

    return result;
  }
}
