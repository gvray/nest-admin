import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDictionaryTypeDto } from './dto/create-dictionary-type.dto';
import { UpdateDictionaryTypeDto } from './dto/update-dictionary-type.dto';
import { QueryDictionaryTypeDto } from './dto/query-dictionary-type.dto';
import { DictionaryTypeResponseDto } from './dto/dictionary-type-response.dto';
import { CreateDictionaryItemDto } from './dto/create-dictionary-item.dto';
import { UpdateDictionaryItemDto } from './dto/update-dictionary-item.dto';
import { QueryDictionaryItemDto } from './dto/query-dictionary-item.dto';
import { DictionaryItemResponseDto } from './dto/dictionary-item-response.dto';
import { plainToInstance } from 'class-transformer';

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
    const { page, pageSize, code, name, status, ...rest } = query;

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

    const hasPaginationParams = query.page !== undefined || query.pageSize !== undefined;

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

  async findOneDictionaryType(typeId: string): Promise<DictionaryTypeResponseDto> {
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
      where: { typeId: createDictionaryItemDto.typeId },
    });

    if (!dictionaryType) {
      throw new NotFoundException('字典类型不存在');
    }

    // 检查编码是否已存在
    const existingItem = await this.prisma.dictionaryItem.findFirst({
      where: {
        typeId: createDictionaryItemDto.typeId,
        code: createDictionaryItemDto.code,
      },
    });

    if (existingItem) {
      throw new ConflictException('字典项编码已存在');
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
    const { page, pageSize, typeId, code, name, value, status, ...rest } = query;

    const where: any = {};
    if (typeId) {
      where.typeId = typeId;
    }
    if (code) {
      where.code = { contains: code };
    }
    if (name) {
      where.name = { contains: name };
    }
    if (value) {
      where.value = { contains: value };
    }
    if (status !== undefined) {
      where.status = status;
    }

    const hasPaginationParams = query.page !== undefined || query.pageSize !== undefined;

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

  async findOneDictionaryItem(itemId: string): Promise<DictionaryItemResponseDto> {
    const dictionaryItem = await this.prisma.dictionaryItem.findUnique({
      where: { itemId },
      include: {
        type: {
          select: {
            typeId: true,
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

    // 检查编码是否与其他项冲突
    if (updateDictionaryItemDto.code) {
      const conflictItem = await this.prisma.dictionaryItem.findFirst({
        where: {
          typeId: existingItem.typeId,
          code: updateDictionaryItemDto.code,
          NOT: { itemId },
        },
      });

      if (conflictItem) {
        throw new ConflictException('字典项编码已存在');
      }
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
  async getDictionaryItemsByTypeCode(typeCode: string): Promise<DictionaryItemResponseDto[]> {
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
} 