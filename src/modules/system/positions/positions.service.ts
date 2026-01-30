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
import { ResponseUtil } from '@/shared/utils/response.util';
import {
  ApiResponse,
  PaginationResponse,
} from '@/shared/interfaces/response.interface';

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
  ): Promise<
    PaginationResponse<PositionResponseDto> | ApiResponse<PositionResponseDto[]>
  > {
    const { name, code, status } = query;

    const where: Record<string, unknown> = {};

    if (name) {
      where.name = { contains: name };
    }

    if (code) {
      where.code = { contains: code };
    }

    if (status !== undefined) {
      where.status = status;
    }

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

    // 使用 PaginationDto 的方法来判断是否需要分页
    const skip = query.getSkip();
    const take = query.getTake();

    if (skip !== undefined && take !== undefined && query) {
      const result = (await this.paginateWithResponse(
        this.prisma.position,
        query,
        where,
        include,
        [{ sort: 'asc' }, { createdAt: 'desc' }],
        '岗位列表查询成功',
      )) as PaginationResponse<any>;

      if (
        'data' in result &&
        result.data &&
        'items' in result.data &&
        Array.isArray(result.data.items)
      ) {
        const transformedItems = plainToInstance(
          PositionResponseDto,
          result.data.items,
          {
            excludeExtraneousValues: true,
          },
        );
        return {
          ...result,
          data: {
            ...result.data,
            items: transformedItems,
          },
        };
      }

      return result;
    }

    // 不分页查询
    const positions = await this.prisma.position.findMany({
      where,
      include,
      orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
    });

    const positionResponses = plainToInstance(PositionResponseDto, positions, {
      excludeExtraneousValues: true,
    });
    return ResponseUtil.found(positionResponses, '岗位列表查询成功');
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
}
