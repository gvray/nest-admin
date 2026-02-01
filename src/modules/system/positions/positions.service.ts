import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from '@/prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';
import { PositionResponseDto } from './dto/position-response.dto';
import { BaseService } from '@/shared/services/base.service';
import { PaginationData } from '@/shared/interfaces/response.interface';

@Injectable()
export class PositionsService extends BaseService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createPositionDto: CreatePositionDto,
    currentUserId?: string,
  ): Promise<PositionResponseDto> {
    // 检查名称和编码是否已存在
    const existingPosition = await this.prisma.position.findFirst({
      where: {
        OR: [
          { name: createPositionDto.name },
          { code: createPositionDto.code },
        ],
      },
    });

    if (existingPosition) {
      if (existingPosition.name === createPositionDto.name) {
        throw new ConflictException('岗位名称已存在');
      }
      if (existingPosition.code === createPositionDto.code) {
        throw new ConflictException('岗位编码已存在');
      }
    }

    const position = await this.prisma.position.create({
      data: {
        ...createPositionDto,
        createdById: currentUserId,
      },
    });

    return plainToInstance(PositionResponseDto, position, {
      excludeExtraneousValues: true,
    });
  }

  async findAll(
    query: QueryPositionDto,
  ): Promise<PaginationData<PositionResponseDto>> {
    const { name, code, status, createdAtStart, createdAtEnd } = query;
    const where = this.buildWhere({
      contains: { name, code },
      equals: { status },
      date: { field: 'createdAt', start: createdAtStart, end: createdAtEnd },
    });
    const include = {
      userPositions: {
        select: {
          user: {
            select: {
              userId: true,
              username: true,
              nickname: true,
              email: true,
            },
          },
        },
      },
    };
    const state = this.getPaginationState(query);
    if (state) {
      const [items, total] = await Promise.all([
        this.prisma.position.findMany({
          where,
          include,
          orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
          skip: state.skip,
          take: state.take,
        }),
        this.prisma.position.count({ where }),
      ]);
      const transformedItems = plainToInstance(PositionResponseDto, items, {
        excludeExtraneousValues: true,
      });
      return {
        items: transformedItems,
        total,
        page: state.page,
        pageSize: state.pageSize,
      };
    }
    const items = await this.prisma.position.findMany({
      where,
      include,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });
    const total = await this.prisma.position.count({ where });
    const transformedItems = plainToInstance(PositionResponseDto, items, {
      excludeExtraneousValues: true,
    });
    return {
      items: transformedItems,
      total,
      page: query.page ?? 1,
      pageSize: query.pageSize ?? transformedItems.length,
    };
  }

  async findOne(id: string): Promise<PositionResponseDto> {
    const position = await this.prisma.position.findFirst({
      where: isNaN(Number(id)) ? { positionId: id } : { id: Number(id) },
    });

    if (!position) {
      throw new NotFoundException(`岗位ID ${id} 不存在`);
    }

    return plainToInstance(PositionResponseDto, position, {
      excludeExtraneousValues: true,
    });
  }

  async update(
    id: string,
    updatePositionDto: UpdatePositionDto,
    currentUserId?: string,
  ): Promise<PositionResponseDto> {
    // 检查岗位是否存在
    const existingPosition = await this.prisma.position.findFirst({
      where: isNaN(Number(id)) ? { positionId: id } : { id: Number(id) },
    });

    if (!existingPosition) {
      throw new NotFoundException(`岗位ID ${id} 不存在`);
    }

    // 检查名称和编码是否已被其他岗位使用
    if (updatePositionDto.name || updatePositionDto.code) {
      const conflictPosition = await this.prisma.position.findFirst({
        where: {
          AND: [
            {
              OR: [
                { positionId: { not: existingPosition.positionId } },
                { id: { not: existingPosition.id } },
              ],
            },
            {
              OR: [
                updatePositionDto.name ? { name: updatePositionDto.name } : {},
                updatePositionDto.code ? { code: updatePositionDto.code } : {},
              ].filter((condition) => Object.keys(condition).length > 0),
            },
          ],
        },
      });

      if (conflictPosition) {
        if (
          updatePositionDto.name &&
          conflictPosition.name === updatePositionDto.name
        ) {
          throw new ConflictException('岗位名称已存在');
        }
        if (
          updatePositionDto.code &&
          conflictPosition.code === updatePositionDto.code
        ) {
          throw new ConflictException('岗位编码已存在');
        }
      }
    }

    const position = await this.prisma.position.update({
      where: { id: existingPosition.id },
      data: {
        ...updatePositionDto,
        updatedById: currentUserId,
      },
    });

    return plainToInstance(PositionResponseDto, position, {
      excludeExtraneousValues: true,
    });
  }

  async remove(id: string): Promise<void> {
    const existingPosition = await this.prisma.position.findFirst({
      where: isNaN(Number(id)) ? { positionId: id } : { id: Number(id) },
    });

    if (!existingPosition) {
      throw new NotFoundException(`岗位ID ${id} 不存在`);
    }

    await this.prisma.position.delete({
      where: { id: existingPosition.id },
    });
  }

  async removeMany(ids: string[]): Promise<void> {
    const numericIds = ids
      .map((x) => Number(x))
      .filter((n) => Number.isInteger(n));
    const stringIds = ids.filter((x) => isNaN(Number(x)) && x.length > 0);
    if (numericIds.length > 0) {
      await this.prisma.position.deleteMany({
        where: { id: { in: numericIds } },
      });
    }
    if (stringIds.length > 0) {
      await this.prisma.position.deleteMany({
        where: { positionId: { in: stringIds } },
      });
    }
  }
}
