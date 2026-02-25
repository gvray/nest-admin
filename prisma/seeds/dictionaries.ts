import { PrismaClient } from '@prisma/client';
import { CommonStatus } from '../../src/shared/constants/common-status.constant';

export async function seedDictionaries(prisma: PrismaClient) {
  console.log('🌐 开始创建完整字典数据（批量插入优化）...');

  // 字典类型
  const dictionaryTypes = [
    {
      code: 'user_status',
      name: '用户状态',
      description: '用户状态字典',
      sort: 0,
      status: CommonStatus.ENABLED,
    },
    {
      code: 'user_gender',
      name: '用户性别',
      description: '用户性别字典',
      sort: 1,
      status: CommonStatus.ENABLED,
    },
    {
      code: 'role_status',
      name: '角色状态',
      description: '角色状态字典',
      sort: 2,
    },
    {
      code: 'data_scope',
      name: '数据权限范围',
      description: '角色数据权限范围',
      sort: 3,
    },
    {
      code: 'department_status',
      name: '部门状态',
      description: '部门状态字典',
      sort: 4,
    },
    {
      code: 'position_status',
      name: '岗位状态',
      description: '岗位状态字典',
      sort: 5,
    },
    {
      code: 'permission_type',
      name: '权限类型',
      description: '权限类型字典',
      sort: 6,
    },
    {
      code: 'permission_action',
      name: '权限操作',
      description: '权限操作类型字典',
      sort: 7,
    },
    {
      code: 'menu_hidden',
      name: '菜单显示状态',
      description: '菜单隐藏/显示',
      sort: 8,
    },
    {
      code: 'login_status',
      name: '登录状态',
      description: '登录成功/失败',
      sort: 9,
    },
    {
      code: 'login_type',
      name: '登录类型',
      description: '登录方式类型',
      sort: 10,
    },
    {
      code: 'operation_status',
      name: '操作状态',
      description: '操作日志状态',
      sort: 11,
    },
    {
      code: 'operation_action',
      name: '操作类型',
      description: '操作日志动作类型',
      sort: 12,
    },
    {
      code: 'config_group',
      name: '配置分组',
      description: '系统配置分组',
      sort: 13,
    },
  ];

  // 批量 upsert 字典类型
  const createdTypes: any[] = [];
  for (const typeData of dictionaryTypes) {
    const type = await prisma.dictionaryType.upsert({
      where: { code: typeData.code },
      update: {},
      create: { ...typeData, status: CommonStatus.ENABLED },
    });
    createdTypes.push(type);
  }
  console.log(`✅ 完成字典类型初始化，共 ${createdTypes.length} 条`);

  // 字典项数据
  const dictionaryItems = [
    {
      typeCode: 'user_status',
      items: [
        { value: 'enabled', label: '启用', sort: 0 },
        { value: 'disabled', label: '禁用', sort: 1 },
        { value: 'pending', label: '审核中', sort: 2 },
        { value: 'banned', label: '封禁', sort: 3 },
      ],
    },
    {
      typeCode: 'user_gender',
      items: [
        { value: 'unknown', label: '未知', sort: 0 },
        { value: 'male', label: '男', sort: 1 },
        { value: 'female', label: '女', sort: 2 },
        { value: 'other', label: '其他', sort: 3 },
      ],
    },
    {
      typeCode: 'role_status',
      items: [
        { value: 'enabled', label: '启用', sort: 0 },
        { value: 'disabled', label: '禁用', sort: 1 },
      ],
    },
    {
      typeCode: 'data_scope',
      items: [
        { value: '1', label: '仅本人', sort: 0 },
        { value: '2', label: '本部门', sort: 1 },
        { value: '3', label: '本部门及以下', sort: 2 },
        { value: '4', label: '自定义', sort: 3 },
        { value: '5', label: '全部', sort: 4 },
      ],
    },
    {
      typeCode: 'department_status',
      items: [
        { value: 'enabled', label: '启用', sort: 0 },
        { value: 'disabled', label: '禁用', sort: 1 },
      ],
    },
    {
      typeCode: 'position_status',
      items: [
        { value: 'enabled', label: '启用', sort: 0 },
        { value: 'disabled', label: '禁用', sort: 1 },
      ],
    },
    {
      typeCode: 'permission_type',
      items: [
        { value: 'DIRECTORY', label: '目录', sort: 0 },
        { value: 'MENU', label: '菜单', sort: 1 },
        { value: 'BUTTON', label: '按钮', sort: 2 },
        { value: 'API', label: '接口', sort: 3 },
      ],
    },
    {
      typeCode: 'permission_action',
      items: [
        { value: 'access', label: '访问', sort: 0 },
        { value: 'view', label: '查看', sort: 1 },
        { value: 'create', label: '创建', sort: 2 },
        { value: 'update', label: '更新', sort: 3 },
        { value: 'delete', label: '删除', sort: 4 },
        { value: 'export', label: '导出', sort: 5 },
        { value: 'import', label: '导入', sort: 6 },
      ],
    },
    {
      typeCode: 'menu_hidden',
      items: [
        { value: '0', label: '显示', sort: 0 },
        { value: '1', label: '隐藏', sort: 1 },
      ],
    },
    {
      typeCode: 'login_status',
      items: [
        { value: 'success', label: '成功', sort: 0 },
        { value: 'failure', label: '失败', sort: 1 },
      ],
    },
    {
      typeCode: 'login_type',
      items: [
        { value: 'username', label: '用户名', sort: 0 },
        { value: 'email', label: '邮箱', sort: 1 },
        { value: 'phone', label: '手机号', sort: 2 },
        { value: 'wechat', label: '微信', sort: 3 },
        { value: 'qq', label: 'QQ', sort: 4 },
        { value: 'alipay', label: '支付宝', sort: 5 },
        { value: 'github', label: 'GitHub', sort: 6 },
        { value: 'google', label: 'Google', sort: 7 },
      ],
    },
    {
      typeCode: 'operation_status',
      items: [
        { value: 'success', label: '成功', sort: 0 },
        { value: 'failure', label: '失败', sort: 1 },
      ],
    },
    {
      typeCode: 'operation_action',
      items: [
        { value: 'create', label: '创建', sort: 0 },
        { value: 'update', label: '更新', sort: 1 },
        { value: 'delete', label: '删除', sort: 2 },
        { value: 'view', label: '查看', sort: 3 },
        { value: 'export', label: '导出', sort: 4 },
        { value: 'import', label: '导入', sort: 5 },
      ],
    },
    // config_group 完整四大类
    {
      typeCode: 'config_group',
      items: [
        { value: 'uiDefaults', label: 'UI 默认配置', sort: 0 },
        { value: 'securityPolicy', label: '安全策略', sort: 1 },
        { value: 'features', label: '功能开关', sort: 2 },
        { value: 'user', label: '用户默认值', sort: 3 },
      ],
    },
  ];

  // 批量准备字典项
  const allItems: any[] = [];
  for (const group of dictionaryItems) {
    const type = createdTypes.find((t) => t.code === group.typeCode);
    if (!type) continue;
    for (const item of group.items) {
      allItems.push({ ...item, typeCode: type.code, status: CommonStatus.ENABLED });
    }
  }

  // 批量插入字典项
  await prisma.dictionaryItem.createMany({
    data: allItems,
    skipDuplicates: true, // 避免重复插入
  });

  console.log(`✅ 完成字典项初始化，共 ${allItems.length} 条`);
  console.log('✅ 全部系统字典数据创建完成（批量优化）');
}
