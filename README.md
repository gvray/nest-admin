# NestAdmin

✨ **NestAdmin** 是一个企业级后台管理系统，基于 [NestJS](https://nestjs.com/)、[Prisma](https://www.prisma.io/)、MySQL 和 RESTful API 架构设计，适用于中后台权限管理、用户系统与通用业务开发。

## 💫 特性亮点

- 🎯 **TypeScript** - 严格的类型检查，提供完整的类型定义
- 🏗️ **模块化架构** - 基于 NestJS 模块化设计，支持按需加载
- 🔐 **RBAC 权限** - 基于角色的访问控制，灵活的权限管理
- 📝 **Swagger** - 自动生成 OpenAPI 规范的接口文档
- 🎨 **代码规范** - 遵循 TypeScript 最佳实践，统一的代码风格
- 🔄 **数据迁移** - 基于 Prisma 的数据库版本控制和迁移
- 🛡️ **安全防护** - JWT 认证，请求加密，CORS 配置等
- 🔑 **灵活登录** - 支持用户名或邮箱登录
- 🏢 **组织架构** - 完整的部门和岗位管理体系

## 🚀 技术栈

### 后端技术
- **[NestJS](https://nestjs.com/)** - 渐进式 Node.js 框架，支持完整的依赖注入
- **[Prisma](https://www.prisma.io/)** - 下一代 ORM，类型安全且高性能
- **[MySQL](https://www.mysql.com/)** - 企业级关系型数据库
- **[TypeScript](https://www.typescriptlang.org/)** - JavaScript 的超集，提供类型系统
- **[JWT](https://jwt.io/)** - JSON Web Token 认证机制
- **[Swagger](https://swagger.io/)** - API 文档生成与测试工具

### 开发工具
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **Jest** - 单元测试框架
- **Docker** - 容器化部署支持

## ✨ 功能特性

### 🔐 认证与授权
- [x] 完整的注册登录流程
- [x] JWT 令牌认证机制
- [x] 支持用户名或邮箱登录
- [x] 权限验证守卫
- [x] 角色权限管理
- [ ] 刷新令牌机制（Access Token + Refresh Token）
- [ ] 登录日志记录与分析
- [ ] 单点登录（SSO）集成
- [ ] OAuth2 第三方登录（GitHub、Google）
- [ ] 双因素认证（2FA）
- [ ] 登录失败限制与封禁

### 👥 用户管理
- [x] 用户基础管理（CRUD）
- [x] 灵活的角色分配
- [x] 部门岗位关联
- [ ] 批量用户操作
- [ ] 用户数据导入导出（Excel、CSV）
- [ ] 用户状态管理（在线、离线、禁用）
- [ ] 头像上传管理（本地/云存储）
- [ ] 用户操作日志
- [ ] 用户登录设备管理

### 👑 角色权限
- [x] 角色基础管理（CRUD）
- [x] 角色权限管理
- [x] RBAC 权限控制
- [x] 权限代码管理
- [x] 权限分配机制
- [x] 25个基础权限预设
- [ ] 批量角色操作
- [ ] 数据权限控制（行级、列级）
- [ ] 菜单权限管理
- [ ] 权限缓存优化（Redis）
- [ ] 权限树形结构
- [ ] 动态权限加载
- [ ] 临时权限分配
- [ ] 权限继承机制

### 🏢 组织架构
- [x] 部门管理（CRUD）
- [x] 岗位管理（CRUD）
- [x] 部门岗位关联
- [x] 组织架构树形展示
- [ ] 多级部门支持
- [ ] 部门权限继承
- [ ] 岗位权限模板

### ⚙️ 系统管理
- [x] 系统参数配置（环境变量）
- [x] 数据字典维护（权限、角色、部门、岗位）
- [ ] 菜单动态管理
- [ ] 系统通知公告
- [ ] 综合日志管理
  - [ ] 操作行为日志（审计日志）
  - [ ] 登录记录日志
  - [ ] 系统运行日志
- [ ] 系统备份还原
- [ ] 敏感数据加密

### 📚 接口文档
- [x] Swagger 接口文档（OpenAPI 3.0）
- [x] 详细的API描述和示例
- [x] Bearer Token 认证支持
- [ ] 接口版本管理
- [ ] 接口访问控制（限流、黑白名单）
- [ ] 接口性能监控
- [ ] 接口调试工具
- [ ] Mock 数据支持

### 🔍 系统监控
- [ ] 在线用户监控（实时统计）
- [ ] 服务器状态监控（CPU、内存、磁盘）
- [ ] 数据库性能监控
- [ ] 缓存系统监控
- [ ] 定时任务管理（任务调度）
- [ ] 服务健康检查
- [ ] 性能分析工具
- [ ] 告警通知机制

### 🛠️ 开发支持
- [x] 数据库迁移工具（Prisma Migrate）
- [x] 数据填充脚本（Seed）
- [x] 完整的种子数据（管理员、角色、权限、部门、岗位）
- [ ] 代码自动生成（CRUD）
- [ ] 表单在线构建
- [ ] 开发技术文档
- [ ] 单元测试覆盖
- [ ] API 自动化测试
- [ ] 持续集成/持续部署（CI/CD）

## 🚀 快速开始

### 环境要求
- Node.js >= 16
- MySQL >= 8.0
- pnpm >= 8.0

### 开发环境设置
```bash
# 克隆项目
git clone https://github.com/gvray/nest-admin.git

# 进入项目目录
cd nest-admin

# 安装依赖
pnpm install

# 配置环境变量
cp .env.example .env

# 执行数据库迁移
pnpm prisma migrate dev

# 初始化基础数据
pnpm prisma db seed

# 启动开发服务
pnpm start:dev
```

### 生产环境部署
```bash
# 构建项目
pnpm build

# 启动服务
pnpm start:prod
```

## 👤 默认账户

- 管理员账号：admin@example.com 或 admin
- 初始密码：admin123

## 🔧 API 测试

### 登录测试
```bash
# 用户名登录
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account": "admin", "password": "admin123"}'

# 邮箱登录
curl -X POST http://localhost:8001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"account": "admin@example.com", "password": "admin123"}'
```

### 获取用户列表
```bash
# 使用登录返回的 token
curl -X GET http://localhost:8001/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📁 项目结构

```
src
├── config                # 配置文件目录
│   ├── app.config.ts     # 应用配置
│   ├── auth.config.ts    # 认证配置
│   └── database.config.ts# 数据库配置
├── core                  # 核心功能模块
│   ├── decorators       # 自定义装饰器
│   │   ├── permissions.decorator.ts  # 权限装饰器
│   │   └── roles.decorator.ts        # 角色装饰器
│   ├── guards          # 权限守卫
│   │   ├── jwt-auth.guard.ts         # JWT认证守卫
│   │   ├── permissions.guard.ts      # 权限守卫
│   │   └── roles.guard.ts            # 角色守卫
│   ├── interceptors    # 拦截器
│   ├── filters         # 异常过滤器
│   └── strategies      # 认证策略
│       └── jwt.strategy.ts           # JWT策略
├── modules              # 业务功能模块
│   ├── auth            # 认证授权模块
│   │   ├── auth.controller.ts        # 认证控制器
│   │   ├── auth.service.ts           # 认证服务
│   │   └── dto                        # 数据传输对象
│   │       ├── login.dto.ts          # 登录DTO
│   │       └── register.dto.ts       # 注册DTO
│   ├── users           # 用户管理模块
│   │   ├── users.controller.ts       # 用户控制器
│   │   ├── users.service.ts          # 用户服务
│   │   └── dto                        # 数据传输对象
│   ├── roles           # 角色管理模块
│   │   ├── roles.controller.ts       # 角色控制器
│   │   ├── roles.service.ts          # 角色服务
│   │   └── dto                        # 数据传输对象
│   ├── permissions     # 权限管理模块
│   │   ├── permissions.controller.ts # 权限控制器
│   │   ├── permissions.service.ts    # 权限服务
│   │   └── dto                        # 数据传输对象
│   ├── departments     # 部门管理模块
│   │   ├── departments.controller.ts # 部门控制器
│   │   └── departments.service.ts    # 部门服务
│   ├── positions       # 岗位管理模块
│   │   ├── positions.controller.ts   # 岗位控制器
│   │   └── positions.service.ts      # 岗位服务
│   └── auth            # 认证授权模块
│       └── dto            # 数据传输对象
├── shared              # 共享模块
│   ├── constants       # 常量定义
│   ├── dto            # 数据传输对象
│   └── utils          # 工具函数
└── prisma              # Prisma 配置
    ├── migrations      # 数据库迁移
    ├── seeds          # 数据填充
    │   └── permissions.ts            # 权限种子数据
    └── seed.ts                       # 主种子脚本
```

## 📄 开源协议

本项目采用 [MIT 许可证](LICENSE) 开源。

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request 贡献代码。详情请参阅 [贡献指南](CONTRIBUTING.md)。

## 📚 相关文档

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 官方文档](https://www.prisma.io/docs/)
- [TypeScript 官方文档](https://www.typescriptlang.org/docs/)
