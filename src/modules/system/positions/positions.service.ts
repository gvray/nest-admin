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
import { ApiResponse, PaginationResponse } from '@/shared/interfaces/response.interface';

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
  ): Promise<PaginationResponse<PositionResponseDto> | ApiResponse<PositionResponseDto[]>> {
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
      users: {
        select: {
          id: true,
          userId: true,
          username: true,
          nickname: true,
          email: true,
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
        } as PaginationResponse<PositionResponseDto>;
      }
      return result as PaginationResponse<PositionResponseDto>;
    }

    // 返回全量数据
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
    // 判断是数字ID还是UUID
    const isNumericId = !isNaN(Number(id));
    const whereClause = isNumericId 
      ? { id: Number(id) } 
      : { positionId: id };

    const position = await this.prisma.position.findUnique({
      where: whereClause,
      include: {
        users: {
          include: {
            roles: true,
            positions: true,
          },
        },
      },
    });

    if (!position) {
      throw new NotFoundException('岗位不存在');
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
    // 判断是数字ID还是UUID
    const isNumericId = !isNaN(Number(id));
    const whereClause = isNumericId 
      ? { id: Number(id) } 
      : { positionId: id };

    // 检查岗位是否存在
    const existingPosition = await this.prisma.position.findUnique({
      where: whereClause,
    });

    if (!existingPosition) {
      throw new NotFoundException('岗位不存在');
    }

    // 检查名称和编码是否与其他岗位冲突
    if (updatePositionDto.name || updatePositionDto.code) {
      const conflictPosition = await this.prisma.position.findFirst({
        where: {
          OR: [
            ...(updatePositionDto.name
              ? [{ name: updatePositionDto.name }]
              : []),
            ...(updatePositionDto.code
              ? [{ code: updatePositionDto.code }]
              : []),
          ],
          NOT: { id: existingPosition.id },
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
    // 判断是数字ID还是UUID
    const isNumericId = !isNaN(Number(id));
    const whereClause = isNumericId 
      ? { id: Number(id) } 
      : { positionId: id };

    // 检查岗位是否存在
    const position = await this.prisma.position.findUnique({
      where: whereClause,
      include: {
        users: true,
      },
    });

    if (!position) {
      throw new NotFoundException('岗位不存在');
    }

    // 检查是否有用户关联
    if (position.users && position.users.length > 0) {
      throw new ConflictException('该岗位下还有用户，无法删除');
    }

    await this.prisma.position.delete({
      where: { id: position.id },
    });
  }


}
