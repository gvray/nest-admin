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
import { ApiResponse } from '../../shared/interfaces/response.interface';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createPositionDto: CreatePositionDto,
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

    // 检查部门是否存在
    const department = await this.prisma.department.findUnique({
      where: { id: createPositionDto.departmentId },
    });

    if (!department) {
      throw new NotFoundException('部门不存在');
    }

    const position = await this.prisma.position.create({
      data: createPositionDto,
      include: {
        department: true,
      },
    });

    return {
      ...position,
      status: position.status,
    } as PositionEntity;
  }

  async findAll(query: QueryPositionDto) {
    const { name, code, status, departmentId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

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

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [positions, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          users: {
            select: {
              id: true,
              userId: true,
              username: true,
              nickname: true,
              email: true,
            },
          },
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.position.count({ where }),
    ]);

    return {
      success: true,
      code: 200,
      message: '获取岗位列表成功',
      data: positions.map(position => ({
        ...position,
        status: position.status,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      timestamp: new Date().toISOString(),
    };
  }

  async findOne(id: number): Promise<PositionEntity> {
    const position = await this.prisma.position.findUnique({
      where: { id },
      include: {
        department: true,
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

    // 如果更新部门，检查部门是否存在
    if (updatePositionDto.departmentId) {
      const department = await this.prisma.department.findUnique({
        where: { id: updatePositionDto.departmentId },
      });

      if (!department) {
        throw new NotFoundException('部门不存在');
      }
    }

    const position = await this.prisma.position.update({
      where: { id },
      data: updatePositionDto,
      include: {
        department: true,
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

  async findByDepartment(departmentId: number): Promise<PositionEntity[]> {
    const positions = await this.prisma.position.findMany({
      where: {
        departmentId,
        status: 1,
      },
      include: {
        department: true,
      },
    });

    return positions.map(position => ({
      ...position,
      status: position.status,
    })) as PositionEntity[];
  }
}
