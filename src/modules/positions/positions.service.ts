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

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPositionDto: CreatePositionDto): Promise<PositionEntity> {
    // 检查岗位名称和编码是否已存在
    const existingPosition = await this.prisma.position.findFirst({
      where: {
        OR: [
          { name: createPositionDto.name },
          { code: createPositionDto.code },
        ],
      },
    });

    if (existingPosition) {
      throw new ConflictException('岗位名称或编码已存在');
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

    return position;
  }

  async findAll(query: QueryPositionDto) {
    const { name, code, isActive, departmentId, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (name) {
      where.name = { contains: name };
    }

    if (code) {
      where.code = { contains: code };
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    const [positions, total] = await Promise.all([
      this.prisma.position.findMany({
        where,
        include: {
          department: true,
          _count: {
            select: {
              users: true,
            },
          },
        },
        orderBy: [{ sort: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.position.count({ where }),
    ]);

    return {
      data: positions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
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
            department: true,
          },
        },
      },
    });

    if (!position) {
      throw new NotFoundException('岗位不存在');
    }

    return position;
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
        throw new ConflictException('岗位名称或编码已存在');
      }
    }

    // 检查部门
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

    return position;
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

    // 检查是否有用户
    if (position.users.length > 0) {
      throw new ConflictException('请先移除岗位下的用户');
    }

    await this.prisma.position.delete({
      where: { id },
    });
  }

  async findByDepartment(departmentId: number): Promise<PositionEntity[]> {
    const positions = await this.prisma.position.findMany({
      where: {
        departmentId,
        isActive: true,
      },
      include: {
        department: true,
      },
      orderBy: [{ sort: 'asc' }, { createdAt: 'asc' }],
    });

    return positions;
  }
}
