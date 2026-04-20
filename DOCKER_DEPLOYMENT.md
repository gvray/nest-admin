# Docker 部署指南

## 🐳 概述

本项目提供完整的 Docker 容器化部署方案，支持两种部署模式：
- **独立部署** - 使用 `docker/scripts/deploy.sh` 脚本，适合生产环境
- **组合部署** - 使用 `docker-compose.yml`，适合开发测试环境

## 📋 前置要求

- Docker 20.10+
- Docker BuildKit (多架构构建)
- Git

## 🚀 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd nest-admin
```

### 2. 配置环境变量
```bash
cp .env.example .env.production
# 编辑 .env.production 配置数据库连接等信息
```

## 📦 部署方式

### 方式一：独立部署（推荐生产环境）

#### 构建镜像
```bash
# 单架构构建（快速）
./docker/scripts/build.sh

# 多架构构建（支持 amd64/arm64）
./docker/scripts/build.sh -m

# 指定版本标签
./docker/scripts/build.sh -v 1.0.0

# 推送到镜像仓库
./docker/scripts/build.sh -p

# 安全扫描
./docker/scripts/build.sh -s

# 清理缓存重建
./docker/scripts/build.sh -c
```

#### 部署应用
```bash
# 标准部署（自动拉取镜像）
./docker/scripts/deploy.sh

# 使用本地镜像部署
./docker/scripts/deploy.sh -n

# 指定镜像标签
./docker/scripts/deploy.sh -v v1.0.0
```

#### 部署脚本功能
```bash
# 完整重置（删除所有数据和容器）
./docker/scripts/deploy.sh reset

# 数据库种子数据
./docker/scripts/deploy.sh seed

# 回滚到上一版本
./docker/scripts/deploy.sh rollback

# 查看运行状态
./docker/scripts/deploy.sh status

# 查看容器日志
./docker/scripts/deploy.sh logs

# 停止应用
./docker/scripts/deploy.sh stop

# 重启应用
./docker/scripts/deploy.sh restart
```

### 方式二：组合部署（推荐开发环境）

#### 启动完整环境
```bash
# 启动 MySQL + 应用
docker compose up -d

# 重新构建并启动
docker compose up -d --build
```

#### 管理服务
```bash
# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f app

# 停止服务
docker compose down

# 停止并删除数据卷
docker compose down -v --remove-orphans
```

## ⚙️ 环境配置

### 必需环境变量
```bash
# 数据库连接
DATABASE_URL="mysql://root:password@host.docker.internal:3306/nest_admin"

# JWT 配置
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# 应用配置
PORT=8001
NODE_ENV="production"
ENABLE_CORS=false
```

### 可选环境变量
```bash
# Docker 配置
CONTAINER_NAME="nest_admin_app"
MYSQL_CONTAINER="nest_admin_mysql"
MYSQL_DATABASE="nest_admin"
PLATFORM="linux/amd64"

# 注册表配置
DOCKER_REGISTRY="docker.io"
DOCKER_NAMESPACE="gvray"
```

## 🗂️ 目录结构

```
docker/
├── Dockerfile              # 主应用镜像构建文件
├── entrypoint.sh          # 容器启动脚本
├── scripts/
│   ├── build.sh          # 镜像构建脚本
│   └── deploy.sh         # 部署管理脚本
├── mysql/
│   ├── my.cnf           # MySQL 配置文件
│   └── init.sql         # 数据库初始化脚本
└── nginx/
    ├── nginx.conf        # Nginx 配置
    └── ssl/            # SSL 证书目录
```

## 🏥 健康检查

### 应用健康检查
- **端点**: `GET /health`
- **响应**: 
  ```json
  {
    "status": "ok",
    "timestamp": "2024-01-01T00:00:00.000Z",
    "uptime": 3600.5,
    "version": "1.0.0"
  }
  ```

### 数据库健康检查
- **检查**: MySQL 连接和响应时间
- **超时**: 5秒
- **重试**: 最多12次（60秒）

## 🔄 数据库管理

### 自动迁移
容器启动时自动执行：
1. 检测 `prisma/migrations/` 目录
2. 有迁移文件 → `prisma migrate deploy`
3. 无迁移文件 → `prisma db push`
4. 检测用户表为空 → 自动运行种子数据

### 手动操作
```bash
# 生成迁移文件
pnpm prisma migrate dev --name migration_name

# 重置数据库
pnpm db:reset

# 运行种子数据
pnpm prisma db seed
```

## 📊 监控和日志

### 容器监控
```bash
# 查看容器状态
docker ps

# 查看容器资源使用
docker stats

# 查看容器详情
docker inspect nest_admin_app
```

### 日志管理
```bash
# 实时日志
docker logs -f nest_admin_app

# 最近100行日志
docker logs --tail 100 nest_admin_app

# 应用特定日志
docker logs nest_admin_app 2>&1 | grep ERROR
```

## 🔧 故障排除

### 常见问题

#### 1. 健康检查失败
```bash
# 检查端口占用
lsof -i :8001

# 检查容器日志
docker logs nest_admin_app

# 手动健康检查
curl http://localhost:8001/health
```

#### 2. 数据库连接失败
```bash
# 检查 MySQL 容器
docker ps | grep mysql

# 测试数据库连接
docker exec nest_admin_mysql mysql -u root -p

# 检查网络连接
docker network ls
```

#### 3. 镜像构建失败
```bash
# 清理构建缓存
docker builder prune -f

# 强制重建
./docker/scripts/build.sh -c
```

## 🔒 安全配置

### 生产环境建议
1. **更改默认密码**
   ```bash
   # 生成强密码
   openssl rand -base64 32
   ```

2. **使用 HTTPS**
   ```nginx
   server {
       listen 443 ssl;
       ssl_certificate /etc/nginx/ssl/cert.pem;
       ssl_certificate_key /etc/nginx/ssl/key.pem;
   }
   ```

3. **网络隔离**
   ```bash
   # 创建专用网络
   docker network create --driver bridge nest-admin-network
   ```

4. **资源限制**
   ```bash
   # 限制内存使用
   docker run --memory=512m --cpus=1.0
   ```

## � 性能优化

### 数据库优化
```ini
# docker/mysql/my.cnf
[mysqld]
innodb_buffer_pool_size = 256M
innodb_redo_log_capacity = 128M
max_connections = 200
query_cache_size = 64M
```

### 应用优化
```bash
# 使用多阶段构建减少镜像大小
# 生产环境禁用调试信息
NODE_ENV=production
```

## 🚀 CI/CD 集成

### GitHub Actions 示例
```yaml
name: Deploy
on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and Push
        run: |
          ./docker/scripts/build.sh -p
      - name: Deploy
        run: |
          ./docker/scripts/deploy.sh
```

## � 维护操作

### 备份策略
```bash
# 数据库备份
docker exec nest_admin_mysql mysqldump -u root -p nest_admin > backup.sql

# 容器备份
docker commit nest_admin_app nest_admin_backup:$(date +%Y%m%d)
```

### 更新流程
```bash
# 1. 备份当前版本
./docker/scripts/deploy.sh

# 2. 更新代码
git pull origin main

# 3. 重新构建
./docker/scripts/build.sh

# 4. 部署新版本
./docker/scripts/deploy.sh

# 5. 验证部署
curl http://localhost:8001/health
```

## 🏷️ 镜像标签策略

### 自动标签
- **Git SHA**: 自动标记为 `<git-sha>`
- **Latest**: 始终标记为 `latest`
- **版本**: 使用 `-v <version>` 标记为版本号

### 标签使用
```bash
# 部署特定版本
./docker/scripts/deploy.sh -v v1.2.3

# 查看可用标签
docker images gvray/nest-admin
```

---

## 📞 支持

如遇问题，请检查：
1. 容器日志：`docker logs nest_admin_app`
2. 健康检查：`curl http://localhost:8001/health`
3. 数据库连接：`docker exec nest_admin_mysql mysql -u root -p`

更多详细信息请参考项目文档或提交 Issue。

### 2. 配置环境变量
```bash
# 复制环境配置文件
cp .env.example .env.production

# 编辑配置文件
nano .env.production
```

**重要配置项：**
```env
# 数据库连接
DATABASE_URL="mysql://nest_admin:password@mysql:3306/nest_admin"

# JWT 密钥（生产环境必须修改）
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# 应用域名
CORS_ORIGIN="https://yourdomain.com"
```

### 3. 一键部署
```bash
# 开发环境
npm run deploy:dev

# 生产环境
npm run deploy:prod

# 预发布环境
npm run deploy:staging
```

## 🛠️ 手动部署

### 构建镜像
```bash
# 构建应用镜像
npm run docker:build

# 或使用 Docker 直接构建
docker build -t nest-admin .
```

### 启动服务
```bash
# 开发环境（前台运行）
npm run docker:dev

# 生产环境（后台运行）
npm run docker:prod

# 停止服务
npm run docker:stop

# 查看日志
npm run docker:logs
```

## 📁 目录结构

```
docker/
├── nginx/
│   ├── nginx.conf      # Nginx 配置
│   └── ssl/           # SSL 证书目录
├── mysql/
│   ├── my.cnf         # MySQL 配置
│   └── init.sql        # 初始化脚本
└── redis/
    └── redis.conf      # Redis 配置
```

## 🔧 配置说明

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `DATABASE_URL` | 数据库连接字符串 | - |
| `JWT_SECRET` | JWT 签名密钥 | - |
| `JWT_EXPIRES_IN` | JWT 过期时间 | `24h` |
| `REDIS_HOST` | Redis 主机 | `localhost` |
| `REDIS_PORT` | Redis 端口 | `6379` |
| `CORS_ORIGIN` | 允许的跨域域名 | - |
| `RATE_LIMIT_TTL` | 限流时间窗口 | `60` |
| `RATE_LIMIT_MAX` | 限流最大请求数 | `100` |

### 端口映射

| 服务 | 内部端口 | 外部端口 | 说明 |
|------|----------|----------|------|
| NestJS | 3000 | 3000 | 应用服务 |
| MySQL | 3306 | 3306 | 数据库 |
| Redis | 6379 | 6379 | 缓存 |
| Nginx HTTP | 80 | 80 | Web 服务器 |
| Nginx HTTPS | 443 | 443 | SSL |

## 🔍 健康检查

所有服务都配置了健康检查：

- **NestJS**: `GET /health`
- **MySQL**: `mysqladmin ping`
- **Redis**: `redis-cli ping`
- **Nginx**: `nginx -t`

## 📊 监控和日志

### 查看服务状态
```bash
docker-compose ps
```

### 查看实时日志
```bash
# 查看所有服务日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f nest-admin
docker-compose logs -f mysql
docker-compose logs -f redis
docker-compose logs -f nginx
```

### 日志文件位置
- **应用日志**: `./logs/app.log`
- **Nginx 日志**: `./logs/nginx/`
- **Docker 日志**: `docker-compose logs`

## 🔒 安全配置

### SSL 证书
将 SSL 证书放置在 `docker/nginx/ssl/` 目录：
```bash
# 证书文件
docker/nginx/ssl/cert.pem
docker/nginx/ssl/key.pem
```

### 数据库安全
- 默认用户：`nest_admin`
- 生产环境请修改密码
- 启用了字符集 `utf8mb4`

### 网络安全
- 所有服务在自定义网络中运行
- 仅暴露必要端口
- Nginx 配置了安全头

## 🚨 故障排除

### 常见问题

**1. 应用无法启动**
```bash
# 检查日志
docker-compose logs nest-admin

# 检查环境变量
docker-compose exec nest-admin env | grep NODE_ENV
```

**2. 数据库连接失败**
```bash
# 检查 MySQL 状态
docker-compose exec mysql mysql -u root -p

# 测试连接
docker-compose exec nest-admin npx prisma db pull
```

**3. 权限错误**
```bash
# 检查文件权限
ls -la logs/
ls -la uploads/

# 修复权限
sudo chown -R 1001:1001 logs/ uploads/
```

**4. 内存不足**
```bash
# 检查资源使用
docker stats

# 调整内存限制
# 在 docker-compose.yml 中添加 mem_limit
```

### 重置部署
```bash
# 完全重置（会删除数据）
docker-compose down -v
docker system prune -f

# 重新部署
npm run deploy:prod
```

## 🔄 CI/CD 集成

### GitHub Actions 示例
```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Deploy
        run: |
          echo "${{ secrets.DOT_ENV }}" > .env.production
          npm run deploy:prod
```

## 📈 性能优化

### 生产环境优化
1. **数据库优化**
   - 调整 `innodb_buffer_pool_size`
   - 启用查询缓存
   - 配置慢查询日志

2. **Redis 优化**
   - 设置合适的内存限制
   - 配置持久化策略
   - 启用压缩

3. **Nginx 优化**
   - 启用 Gzip 压缩
   - 配置静态文件缓存
   - 调整 worker 连接数

### 监控指标
- CPU 使用率
- 内存使用量
- 数据库连接数
- 请求响应时间
- 错误率

## 📞 支持

如果遇到部署问题，请：
1. 检查日志文件
2. 查看本文档的故障排除部分
3. 提交 Issue 并附上：
   - 环境信息
   - 错误日志
   - 配置文件（脱敏后）

---

**注意**: 生产环境部署前请务必：
- 修改所有默认密码
- 配置 SSL 证书
- 设置正确的域名
- 配置防火墙规则
