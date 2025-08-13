import { PrismaClient } from '@prisma/client';

export async function seedDictionaries(prisma: PrismaClient) {
  console.log('🌐 开始创建字典数据...');

  // 创建字典类型
  const dictionaryTypes = [
    {
      code: 'user_status',
      name: '用户状态',
      description: '用户状态字典类型',
      status: 1,
      sort: 0,
      remark: '用户状态字典类型备注',
    },
    {
      code: 'user_gender',
      name: '用户性别',
      description: '用户性别字典类型',
      status: 1,
      sort: 1,
      remark: '用户性别字典类型备注',
    },
    {
      code: 'role_status',
      name: '角色状态',
      description: '角色状态字典类型',
      status: 1,
      sort: 2,
      remark: '角色状态字典类型备注',
    },
    {
      code: 'department_status',
      name: '部门状态',
      description: '部门状态字典类型',
      status: 1,
      sort: 3,
      remark: '部门状态字典类型备注',
    },
    {
      code: 'position_status',
      name: '岗位状态',
      description: '岗位状态字典类型',
      status: 1,
      sort: 4,
      remark: '岗位状态字典类型备注',
    },
  ];

  const createdTypes: any[] = [];
  for (const typeData of dictionaryTypes) {
    const type = await prisma.dictionaryType.upsert({
      where: { code: typeData.code },
      update: {},
      create: typeData,
    });
    createdTypes.push(type);
    console.log(`✅ 创建字典类型: ${type.name}`);
  }

  // 创建字典项
  const dictionaryItems = [
    // 用户状态
    {
      typeCode: 'user_status',
      items: [
        { code: 'enabled', name: '启用', value: '1', label: '启用', sort: 0 },
        { code: 'disabled', name: '禁用', value: '0', label: '禁用', sort: 1 },
        { code: 'pending', name: '审核中', value: '2', label: '审核中', sort: 2 },
        { code: 'banned', name: '封禁', value: '3', label: '封禁', sort: 3 },
      ],
    },
    // 用户性别
    {
      typeCode: 'user_gender',
      items: [
        { code: 'unknown', name: '未知', value: '0', label: '未知', sort: 0 },
        { code: 'male', name: '男', value: '1', label: '男', sort: 1 },
        { code: 'female', name: '女', value: '2', label: '女', sort: 2 },
        { code: 'other', name: '其他', value: '3', label: '其他', sort: 3 },
      ],
    },
    // 角色状态
    {
      typeCode: 'role_status',
      items: [
        { code: 'enabled', name: '启用', value: '1', label: '启用', sort: 0 },
        { code: 'disabled', name: '禁用', value: '0', label: '禁用', sort: 1 },
      ],
    },
    // 部门状态
    {
      typeCode: 'department_status',
      items: [
        { code: 'enabled', name: '启用', value: '1', label: '启用', sort: 0 },
        { code: 'disabled', name: '禁用', value: '0', label: '禁用', sort: 1 },
      ],
    },
    // 岗位状态
    {
      typeCode: 'position_status',
      items: [
        { code: 'enabled', name: '启用', value: '1', label: '启用', sort: 0 },
        { code: 'disabled', name: '禁用', value: '0', label: '禁用', sort: 1 },
      ],
    },
  ];

  for (const itemGroup of dictionaryItems) {
    const type = createdTypes.find(t => t.code === itemGroup.typeCode);
    if (!type) continue;

    for (const itemData of itemGroup.items) {
      await prisma.dictionaryItem.upsert({
        where: {
          typeId_code: {
            typeId: type.typeId,
            code: itemData.code,
          },
        },
        update: {},
        create: {
          ...itemData,
          typeId: type.typeId,
        },
      });
      console.log(`✅ 创建字典项: ${itemData.name} (${type.name})`);
    }
  }

  console.log('✅ 字典数据创建完成');
} 