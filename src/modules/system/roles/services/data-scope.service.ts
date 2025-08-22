import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

// 数据权限枚举
export enum DataScope {
  SELF = 1,                    // 仅本人数据权限
  DEPARTMENT = 2,              // 本部门数据权限
  DEPARTMENT_AND_CHILD = 3,    // 本部门及以下数据权限
  CUSTOM = 4,                  // 自定义数据权限
  ALL = 5                      // 全部数据权限
}

@Injectable()
export class DataScopeService {
  constructor(private prisma: PrismaService) {}

  /**
   * 为角色分配数据权限
   */
  async assignDataScopeToRole(
    roleId: string,
    dataScope: number,
    departmentIds?: string[],
    createdById?: string
  ): Promise<{ message: string }> {
    // 更新角色的数据权限
    await this.prisma.role.update({
      where: { roleId },
      data: { dataScope }
    });

    // 如果是自定义权限，需要管理角色-部门关联
    if (dataScope === DataScope.CUSTOM && departmentIds) {
      // 删除现有的角色-部门关联
      await this.prisma.roleDepartment.deleteMany({
        where: { roleId }
      });

      // 创建新的角色-部门关联
      if (departmentIds.length > 0) {
        await this.prisma.roleDepartment.createMany({
          data: departmentIds.map(deptId => ({
            roleId,
            departmentId: deptId,
            createdById
          }))
        });
      }
    } else {
      // 如果不是自定义权限，删除所有角色-部门关联
      await this.prisma.roleDepartment.deleteMany({
        where: { roleId }
      });
    }

    return { message: '数据权限分配成功' };
  }

  /**
   * 获取角色的数据权限
   */
  async getRoleDataScope(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { roleId },
      include: {
        roleDepartments: {
          include: { department: true }
        }
      }
    });

    if (!role) {
      throw new Error('角色不存在');
    }

    return {
      roleId: role.roleId,
      dataScope: role.dataScope,
      departments: role.roleDepartments.map(rd => ({
        departmentId: rd.departmentId,
        departmentName: rd.department.name
      }))
    };
  }

  /**
   * 获取用户的数据权限
   */
  async getUserDataScope(userId: string): Promise<{
    dataScope: number;
    deptIds?: string[];
  }> {
    const userRoles = await this.prisma.userRole.findMany({
      where: { userId },
      include: { 
        role: {
          include: {
            roleDepartments: {
              include: { department: true }
            }
          }
        }
      }
    });

    if (userRoles.length === 0) {
      return { dataScope: DataScope.SELF };
    }

    // 取最高权限
    const highestRole = userRoles.reduce((highest, current) => {
      return current.role.dataScope > highest.role.dataScope ? current : highest;
    });

    return {
      dataScope: highestRole.role.dataScope,
      deptIds: highestRole.role.roleDepartments.map(rd => rd.departmentId)
    };
  }

  /**
   * 构建数据权限查询条件
   */
  async buildDataScopeQuery(userId: string): Promise<any> {
    const { dataScope, deptIds } = await this.getUserDataScope(userId);

    switch (dataScope) {
      case DataScope.ALL:
        return {}; // 无限制

      case DataScope.CUSTOM:
        if (!deptIds || deptIds.length === 0) {
          return { userId }; // 如果没有分配部门，只能看自己的数据
        }
        return {
          departmentId: { in: deptIds }
        };

      case DataScope.DEPARTMENT_AND_CHILD:
        const userDeptId = await this.getUserDepartmentId(userId);
        if (!userDeptId) {
          return { userId };
        }
        const deptAndChildIds = await this.getUserDepartmentAndChildIds(userId);
        return {
          departmentId: { in: deptAndChildIds }
        };

      case DataScope.DEPARTMENT:
        const userDept = await this.getUserDepartmentId(userId);
        if (!userDept) {
          return { userId };
        }
        return {
          departmentId: userDept
        };

      case DataScope.SELF:
      default:
        return { userId };
    }
  }

  /**
   * 获取用户所在部门ID
   */
  private async getUserDepartmentId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { userId },
      select: { departmentId: true }
    });
    return user?.departmentId || null;
  }

  /**
   * 获取用户部门及子部门ID列表
   */
  private async getUserDepartmentAndChildIds(userId: string): Promise<string[]> {
    const userDeptId = await this.getUserDepartmentId(userId);
    if (!userDeptId) {
      return [];
    }

    const childDeptIds = await this.getChildDepartmentIds(userDeptId);
    return [userDeptId, ...childDeptIds];
  }

  /**
   * 递归获取子部门ID列表
   */
  private async getChildDepartmentIds(departmentId: string): Promise<string[]> {
    const children = await this.prisma.department.findMany({
      where: { parentId: departmentId },
      select: { departmentId: true }
    });

    const childIds = children.map(child => child.departmentId);
    const grandChildIds = await Promise.all(
      childIds.map(id => this.getChildDepartmentIds(id))
    );

    return [...childIds, ...grandChildIds.flat()];
  }
} 