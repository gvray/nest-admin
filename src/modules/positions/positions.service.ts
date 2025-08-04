import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePositionDto } from './dto/create-position.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { QueryPositionDto } from './dto/query-position.dto';
import { PositionEntity } from './entities/position.entity';
import { BaseService } from '../../shared/services/base.service';
import { PaginationResponse } from '../../shared/interfaces/response.interface';

@Injectable()
export class PositionsService extends BaseService {
  constructor(protected readonly prisma: PrismaService) {
    super(prisma);
  }

  async create(
    createPositionDto: CreatePositionDto,
    currentUserId?: string,
  ): Promise<PositionEntity> {
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

    return {
      ...position,
      status: position.status,
    } as PositionEntity;
  }

  async findAll(query: QueryPositionDto): Promise<PaginationResponse<PositionEntity>> {
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

    const orderBy = [{ sort: 'asc' }, { createdAt: 'desc' }];

    return this.paginateWithResponse<PositionEntity>(
      this.prisma.position,
      query,
      where,
      include,
      orderBy,
      '获取岗位列表成功',
    );
  }

  async findOne(id: number): Promise<PositionEntity> {
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: {
        users: {
          include: {
            roles: true,
            position: true,
          },
        },
      },
    });

    if (!position) {
      throw new NotFoundException('岗位不存在');
    }

    return {
      ...position,
      status: position.status,
    } as PositionEntity;
  }

  async update(
    id: number,
    updatePositionDto: UpdatePositionDto,
    currentUserId?: string,
  ): Promise<PositionEntity> {
    // 检查岗位是否存在
    const existingPosition = await this.prisma.position.findUnique({
      where: { id },
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
          NOT: { id },
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
      where: { id },
      data: {
        ...updatePositionDto,
        updatedById: currentUserId,
      },
    });

    return {
      ...position,
      status: position.status,
    } as PositionEntity;
  }

  async remove(id: number): Promise<void> {
    // 检查岗位是否存在
    const position = await this.prisma.position.findUnique({
      where: { id },
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
      where: { id },
    });
  }


}
