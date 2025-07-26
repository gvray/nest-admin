# 统一响应格式使用指南

本指南详细介绍了如何在 NestJS 项目中使用统一的响应格式系统。

## 📋 目录

- [概述](#概述)
- [响应格式](#响应格式)
- [核心组件](#核心组件)
- [使用方法](#使用方法)
- [示例代码](#示例代码)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 🎯 概述

统一响应格式系统提供了以下功能：

- ✅ **统一响应格式**：所有 API 返回统一的数据结构
- ✅ **自动格式化**：通过拦截器自动包装响应数据
- ✅ **异常处理**：统一的错误响应格式
- ✅ **分页支持**：内置分页响应格式
- ✅ **类型安全**：完整的 TypeScript 类型定义
- ✅ **灵活配置**：支持跳过格式化的特殊场景

## 📊 响应格式

### 成功响应格式

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 实际数据
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

### 分页响应格式

```json
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "items": [
      // 数据列表
    ],
    "total": 100,
    "page": 1,
    "pageSize": 10,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

### 错误响应格式

```json
{
  "code": 400,
  "message": "请求参数错误",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/users"
}
```

## 🔧 核心组件

### 1. 响应接口定义

**文件位置**: `src/shared/interfaces/response.interface.ts`

- `ApiResponse<T>`: 基础响应接口
- `PaginationResponse<T>`: 分页响应接口
- `ResponseCode`: 响应状态码枚举
- `ResponseMessage`: 响应消息枚举

### 2. 响应工具类

**文件位置**: `src/shared/utils/response.util.ts`

提供便捷的响应构建方法：

```typescript
// 成功响应
ResponseUtil.success(data, message, code, path)
ResponseUtil.created(data, message, path)
ResponseUtil.updated(data, message, path)
ResponseUtil.deleted(data, message, path)
ResponseUtil.found(data, message, path)

// 分页响应
ResponseUtil.paginated(items, total, page, pageSize, message, path)

// 错误响应
ResponseUtil.error(message, code, data, path)
ResponseUtil.badRequest(message, data, path)
ResponseUtil.unauthorized(message, data, path)
ResponseUtil.forbidden(message, data, path)
ResponseUtil.notFound(message, data, path)
```

### 3. 响应拦截器

**文件位置**: `src/core/interceptors/response.interceptor.ts`

自动包装控制器返回的数据为统一格式。

### 4. 异常过滤器

**文件位置**: `src/core/filters/http-exception.filter.ts`

统一处理异常并返回统一格式的错误响应。

### 5. 分页DTO

**文件位置**: `src/shared/dtos/pagination.dto.ts`

- `PaginationDto`: 基础分页参数
- `PaginationSortDto`: 带排序的分页参数

### 6. 基础服务类

**文件位置**: `src/shared/services/base.service.ts`

提供通用的分页查询方法。

## 🚀 使用方法

### 1. 在服务中使用

#### 方式一：继承基础服务类（推荐）

```typescript
import { BaseService } from '../../shared/services/base.service';
import { ResponseUtil } from '../../shared/utils/response.util';

@Injectable()
export class UsersService extends BaseService {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findAll(pagination: PaginationSortDto) {
    return this.paginateWithSortAndResponse(
      this.prisma.user,
      pagination,
      undefined, // where条件
      { roles: true }, // include关联
      'createdAt', // 默认排序字段
      '用户列表查询成功',
    );
  }

  async create(createUserDto: CreateUserDto) {
    const user = await this.prisma.user.create({
      data: createUserDto,
    });
    return ResponseUtil.created(user, '用户创建成功');
  }
}
```

#### 方式二：直接使用工具类

```typescript
import { ResponseUtil } from '../../shared/utils/response.util';

@Injectable()
export class UsersService {
  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return ResponseUtil.found(user, '用户查询成功');
  }
}
```

### 2. 在控制器中使用

#### 自动格式化（推荐）

```typescript
@Controller('users')
export class UsersController {
  @Get()
  findAll(@Query() pagination: PaginationSortDto) {
    // 直接返回数据，拦截器会自动格式化
    return this.usersService.findAll(pagination);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    // 直接返回数据，拦截器会自动格式化
    return this.usersService.create(createUserDto);
  }
}
```

#### 手动格式化

```typescript
@Controller('users')
export class UsersController {
  @Get(':id')
  async findOne(@Param('id') id: number) {
    const user = await this.usersService.findOne(id);
    return ResponseUtil.found(user, '用户查询成功');
  }
}
```

#### 跳过格式化

```typescript
@Controller('users')
export class UsersController {
  @Get('export')
  @SkipResponseFormat() // 跳过响应格式化
  export() {
    // 返回文件流或其他特殊格式
    return fileStream;
  }
}
```

### 3. 分页查询

```typescript
// DTO
export class QueryUsersDto extends PaginationSortDto {
  @IsOptional()
  keyword?: string;

  @IsOptional()
  status?: string;
}

// 服务
async findAll(query: QueryUsersDto) {
  const where = {
    AND: [
      query.keyword ? {
        OR: [
          { username: { contains: query.keyword } },
          { email: { contains: query.keyword } },
        ],
      } : {},
      query.status ? { status: query.status } : {},
    ].filter(Boolean),
  };

  return this.paginateWithSortAndResponse(
    this.prisma.user,
    query,
    where,
    { roles: true },
    'createdAt',
    '用户列表查询成功',
  );
}

// 控制器
@Get()
findAll(@Query() query: QueryUsersDto) {
  return this.usersService.findAll(query);
}
```

## 📝 示例代码

完整的示例代码请参考：

- **服务示例**: `src/modules/permissions/permissions.service.example.ts`
- **控制器示例**: `src/modules/permissions/permissions.controller.example.ts`

## 🎯 最佳实践

### 1. 响应消息规范

```typescript
// ✅ 推荐：使用具体的业务消息
ResponseUtil.created(user, '用户创建成功');
ResponseUtil.updated(user, '用户信息更新成功');
ResponseUtil.deleted(user, '用户删除成功');

// ❌ 不推荐：使用通用消息
ResponseUtil.created(user, '操作成功');
```

### 2. 错误处理

```typescript
// ✅ 推荐：抛出具体的异常
if (!user) {
  throw new NotFoundException('用户不存在');
}

// ✅ 推荐：使用业务相关的错误消息
if (user.status === 'inactive') {
  throw new BadRequestException('用户已被禁用，无法执行此操作');
}
```

### 3. 分页查询

```typescript
// ✅ 推荐：使用基础服务类的分页方法
return this.paginateWithSortAndResponse(
  this.prisma.user,
  pagination,
  where,
  include,
  'createdAt',
  '查询成功',
);

// ✅ 推荐：提供默认排序字段
const orderBy = pagination.getOrderBy('createdAt');
```

### 4. 类型安全

```typescript
// ✅ 推荐：使用泛型确保类型安全
async findOne(id: number): Promise<ApiResponse<User>> {
  const user = await this.prisma.user.findUnique({ where: { id } });
  return ResponseUtil.found(user, '用户查询成功');
}

// ✅ 推荐：为分页响应指定类型
async findAll(pagination: PaginationSortDto): Promise<PaginationResponse<User>> {
  return this.paginateWithSortAndResponse<User>(
    this.prisma.user,
    pagination,
  );
}
```

## ❓ 常见问题

### Q1: 如何跳过某个接口的响应格式化？

**A**: 使用 `@SkipResponseFormat()` 装饰器：

```typescript
@Get('download')
@SkipResponseFormat()
downloadFile() {
  return fileStream; // 不会被格式化
}
```

### Q2: 如何自定义响应状态码？

**A**: 使用 `ResponseUtil` 的方法并传入自定义状态码：

```typescript
return ResponseUtil.success(data, '操作成功', 201);
```

### Q3: 如何处理文件上传/下载？

**A**: 对于文件操作，建议跳过响应格式化：

```typescript
@Post('upload')
@SkipResponseFormat()
uploadFile(@UploadedFile() file: Express.Multer.File) {
  // 处理文件上传
  return { filename: file.filename };
}
```

### Q4: 如何在现有项目中迁移？

**A**: 建议分步骤迁移：

1. 先部署统一响应格式系统
2. 新接口直接使用新格式
3. 逐步重构现有接口
4. 使用 `@SkipResponseFormat()` 处理特殊情况

### Q5: 如何自定义分页参数？

**A**: 继承 `PaginationSortDto` 并添加自定义字段：

```typescript
export class CustomPaginationDto extends PaginationSortDto {
  @IsOptional()
  keyword?: string;

  @IsOptional()
  status?: 'active' | 'inactive';
}
```

## 🔗 相关文件

- [响应接口定义](./src/shared/interfaces/response.interface.ts)
- [响应工具类](./src/shared/utils/response.util.ts)
- [响应拦截器](./src/core/interceptors/response.interceptor.ts)
- [异常过滤器](./src/core/filters/http-exception.filter.ts)
- [分页DTO](./src/shared/dtos/pagination.dto.ts)
- [基础服务类](./src/shared/services/base.service.ts)
- [服务示例](./src/modules/permissions/permissions.service.example.ts)
- [控制器示例](./src/modules/permissions/permissions.controller.example.ts)

---

**注意**: 统一响应格式系统已经在 `app.module.ts` 中全局注册，无需额外配置即可使用。