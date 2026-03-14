# 权限配置使用指南

## 📚 概述

本项目采用**统一权限配置管理**方案，所有权限定义集中在 `src/shared/constants/permissions.constant.ts` 文件中。

## 🎯 权限体系

### 权限类型
- **MENU** - 菜单权限（前端路由）
- **BUTTON** - 按钮权限（前端按钮显示）
- **API** - API 权限（后端接口访问，自动扫描生成）

### 权限来源
- **USER** - 用户手动创建（菜单、按钮）
- **SYSTEM** - 系统自动扫描（API 权限）

## 🔧 后端使用

### 1. 在控制器中使用权限常量

```typescript
import { USER_PERMISSIONS } from '@/shared/constants/permissions.constant';

@Controller('system/users')
export class UsersController {
  
  // ✅ 使用常量，不会写错
  @Get()
  @RequirePermissions(USER_PERMISSIONS.API.LIST)
  async findAll() { ... }
  
  @Post()
  @RequirePermissions(USER_PERMISSIONS.API.CREATE)
  async create() { ... }
  
  @Patch(':id')
  @RequirePermissions(USER_PERMISSIONS.API.UPDATE)
  async update() { ... }
  
  @Delete(':id')
  @RequirePermissions(USER_PERMISSIONS.API.DELETE)
  async remove() { ... }
}
```

### 2. 权限装饰器自动处理

```typescript
// 控制器中写
@RequirePermissions(USER_PERMISSIONS.API.LIST)
// 等价于 'system:user:list'

// 装饰器自动添加 api: 前缀
// 实际检查: 'api:system:user:list'
```

### 3. 权限扫描

```bash
# 扫描所有控制器，自动生成 API 权限
POST /system/permissions/scan

# 返回
{
  "scanned": 79,   // 扫描到的权限数量
  "created": 10,   // 新增的权限
  "updated": 5,    // 更新的权限
  "deleted": 2     // 删除的权限
}
```

## 🎨 前端使用

### 1. 获取权限配置

```typescript
// 获取所有权限配置元数据
GET /permissions-config

// 返回
{
  "user": [
    {
      "code": "menu:system:user",
      "name": "用户管理",
      "type": "MENU"
    },
    {
      "code": "system:user:view",
      "name": "查看用户",
      "type": "BUTTON",
      "description": "查看用户列表和详情"
    },
    {
      "code": "system:user:create",
      "name": "创建用户",
      "type": "BUTTON",
      "description": "创建新用户"
    }
  ],
  "role": [...],
  "permission": [...]
}
```

### 2. 前端按钮权限控制

```vue
<template>
  <!-- 根据权限配置显示按钮 -->
  <a-button v-if="hasPermission('system:user:create')">
    创建用户
  </a-button>
  
  <a-button v-if="hasPermission('system:user:update')">
    编辑
  </a-button>
  
  <a-button v-if="hasPermission('system:user:delete')">
    删除
  </a-button>
</template>

<script setup>
// 从配置接口获取权限列表
const permissionConfig = await fetch('/permissions-config').then(r => r.json())

// 前端知道有哪些按钮权限可用
console.log(permissionConfig.data.user)
// [
//   { code: 'system:user:view', name: '查看用户', type: 'BUTTON' },
//   { code: 'system:user:create', name: '创建用户', type: 'BUTTON' },
//   ...
// ]
</script>
```

## 📝 添加新权限

### 1. 在权限常量文件中定义

```typescript
// src/shared/constants/permissions.constant.ts

export const USER_PERMISSIONS = {
  // 菜单
  MENU: 'menu:system:user',
  
  // 按钮权限
  VIEW: 'system:user:view',
  CREATE: 'system:user:create',
  IMPORT: 'system:user:import',  // ✅ 新增
  EXPORT: 'system:user:export',  // ✅ 新增
  
  // API 权限
  API: {
    LIST: 'system:user:list',
    CREATE: 'system:user:create',
    IMPORT: 'system:user:import',  // ✅ 新增
    EXPORT: 'system:user:export',  // ✅ 新增
  },
}

// 更新元数据（供前端使用）
export const PERMISSION_METADATA = {
  user: [
    // ...
    { 
      code: USER_PERMISSIONS.IMPORT, 
      name: '导入用户', 
      type: 'BUTTON', 
      description: '批量导入用户' 
    },
    { 
      code: USER_PERMISSIONS.EXPORT, 
      name: '导出用户', 
      type: 'BUTTON', 
      description: '导出用户数据' 
    },
  ]
}
```

### 2. 在控制器中使用

```typescript
@Post('import')
@RequirePermissions(USER_PERMISSIONS.API.IMPORT)
async importUsers() { ... }

@Get('export')
@RequirePermissions(USER_PERMISSIONS.API.EXPORT)
async exportUsers() { ... }
```

### 3. 扫描权限

```bash
# 调用扫描接口，自动同步到数据库
POST /system/permissions/scan
```

### 4. 在 seed 文件中添加按钮权限

```typescript
// prisma/seeds/permissions.ts

{
  type: 'BUTTON',
  name: '导入用户',
  code: USER_PERMISSIONS.IMPORT,  // ✅ 使用常量
  action: 'import',
}
```

## ✅ 优势

### 1. 类型安全
```typescript
// ✅ IDE 自动补全，不会写错
@RequirePermissions(USER_PERMISSIONS.API.CREATE)

// ❌ 容易写错
@RequirePermissions('system:user:creat')  // 少了 e
```

### 2. 统一管理
```typescript
// 所有权限定义在一个文件中
// 修改权限代码只需要改一个地方
export const USER_PERMISSIONS = {
  API: {
    LIST: 'system:user:list',  // 统一修改
  }
}
```

### 3. 前端可见
```typescript
// 前端开发者知道有哪些按钮权限可用
GET /permissions-config

// 不用猜测或查看后端代码
```

### 4. 自动同步
```typescript
// API 权限自动扫描生成
// 不需要手动维护 seed 文件中的 API 权限
POST /system/permissions/scan
```

## 🔄 工作流程

### 开发阶段
1. 在 `permissions.constant.ts` 中定义权限
2. 在控制器中使用权限常量
3. 调用扫描接口同步 API 权限
4. 前端通过配置接口获取权限列表

### 部署阶段
1. 运行 `pnpm prisma db seed` 创建菜单和按钮权限
2. 应用启动后调用 `POST /system/permissions/scan` 扫描 API 权限
3. 前端访问 `GET /permissions-config` 获取权限配置

## 📋 权限配置示例

```typescript
// 完整的权限配置结构
export const USER_PERMISSIONS = {
  // 菜单权限（前端路由）
  MENU: 'menu:system:user',
  
  // 按钮权限（前端按钮显示）
  VIEW: 'system:user:view',
  CREATE: 'system:user:create',
  UPDATE: 'system:user:update',
  DELETE: 'system:user:delete',
  
  // API 权限（后端接口访问）
  API: {
    LIST: 'system:user:list',
    DETAIL: 'system:user:detail',
    CREATE: 'system:user:create',
    UPDATE: 'system:user:update',
    DELETE: 'system:user:delete',
  },
}
```

## 🎯 最佳实践

1. **始终使用常量** - 不要硬编码权限字符串
2. **及时扫描** - 修改控制器后调用扫描接口
3. **保持一致** - 按钮权限和 API 权限命名保持一致
4. **添加描述** - 在元数据中添加清晰的描述供前端使用
