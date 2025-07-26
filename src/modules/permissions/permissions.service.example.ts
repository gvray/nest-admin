import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { BaseService } from '../../shared/services/base.service';
import { ResponseUtil } from '../../shared/utils/response.util';
import { PaginationSortDto } from '../../shared/dtos/pagination.dto';
import { ApiResponse, PaginationResponse } from '../../shared/interfaces/response.interface';

/**
 * 权限服务示例 - 展示如何使用统一响应格式
 * 这是一个示例文件，展示如何重构现有服务以使用统一响应格式
 */
@Injectable()
export class PermissionsServiceExample extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  /**
   * 创建权限
   * @param createPermissionDto 创建权限DTO
   * @returns 创建结果
   */
  async create(createPermissionDto: CreatePermissionDto): Promise<ApiResponse<any>> {
    const { name, code, description } = createPermissionDto;

    const permission = await this.prisma.permission.create({
      data: {
        name,
        code,
        description,
      },
    });

    return ResponseUtil.created(permission, '权限创建成功');
  }

  /**
   * 分页查询权限列表
   * @param pagination 分页参数
   * @returns 分页结果
   */
  async findAll(pagination: PaginationSortDto): Promise<PaginationResponse<any>> {
    return this.paginateWithSortAndResponse(
      this.prisma.permission,
      pagination,
      undefined, // where条件
      undefined, // include关联
      'createdAt', // 默认排序字段
      '权限列表查询成功',
    );
  }

  /**
   * 根据ID查询权限
   * @param id 权限ID
   * @returns 权限详情
   */
  async findOne(id: number): Promise<ApiResponse<any>> {
    const permission = await this.prisma.permission.findUnique({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(`权限ID ${id} 不存在`);
    }

    return ResponseUtil.found(permission, '权限查询成功');
  }

  /**
   * 更新权限
   * @param id 权限ID
   * @param updatePermissionDto 更新权限DTO
   * @returns 更新结果
   */
  async update(
    id: number,
    updatePermissionDto: Partial<CreatePermissionDto>,
  ): Promise<ApiResponse<any>> {
    const { name, code, description } = updatePermissionDto;

    // 检查权限是否存在
    await this.findOneOrFail(
      this.prisma.permission,
      { id },
      `权限ID ${id} 不存在`,
    );

    const permission = await this.prisma.permission.update({
      where: { id },
      data: {
        name,
        code,
        description,
      },
    });

    return ResponseUtil.updated(permission, '权限更新成功');
  }

  /**
   * 删除权限
   * @param id 权限ID
   * @returns 删除结果
   */
  async remove(id: number): Promise<ApiResponse<any>> {
    // 检查权限是否存在
    await this.findOneOrFail(
      this.prisma.permission,
      { id },
      `权限ID ${id} 不存在`,
    );

    const permission = await this.prisma.permission.delete({
      where: { id },
    });

    return ResponseUtil.deleted(permission, '权限删除成功');
  }

  /**
   * 搜索权限
   * @param keyword 搜索关键词
   * @param pagination 分页参数
   * @returns 搜索结果
   */
  async search(
    keyword: string,
    pagination: PaginationSortDto,
  ): Promise<PaginationResponse<any>> {
    const where = {
      OR: [
        { name: { contains: keyword } },
        { code: { contains: keyword } },
        { description: { contains: keyword } },
      ],
    };

    return this.paginateWithSortAndResponse(
      this.prisma.permission,
      pagination,
      where,
      undefined,
      'createdAt',
      '权限搜索成功',
    );
  }
}