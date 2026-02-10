import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { EmptyStringTransformPipe } from './core/pipes/empty-string-transform.pipe';
import { AuditInterceptor } from './core/interceptors/audit.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 测试环境变量
  console.log('Environment Variables:');
  console.log('DATABASE_URL:', process.env.DATABASE_URL);
  console.log('PORT:', process.env.PORT);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('JWT_SECRET:', process.env.JWT_SECRET);
  console.log('ENABLE_CORS:', process.env.ENABLE_CORS);

  // CORS 配置 - 仅在开发环境启用
  if (process.env.NODE_ENV === 'development') {
    const corsOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://localhost:9000',
      'http://localhost:9527',
      'http://localhost:9528',
      'http://localhost:9529',
    ];

    app.enableCors({
      origin: (origin, callback) => {
        // 允许没有 origin 的请求（如 Postman、Swagger）
        if (!origin) return callback(null, true);

        // 检查是否在允许的源列表中
        if (corsOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`🚫 CORS blocked origin: ${origin}`);
          callback(null, false);
        }
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Access-Token',
        'Cache-Control',
      ],
      credentials: true,
      maxAge: 3600, // 开发环境1小时缓存预检请求
    });

    console.log('🌐 CORS enabled for development environment');
    console.log('📍 Allowed origins:', corsOrigins);
  } else {
    // 生产环境提示：CORS应在反向代理层处理
    console.log(
      '🔒 Production mode: CORS should be handled by reverse proxy (Nginx/Apache)',
    );
    console.log('💡 Tip: Configure CORS in your nginx.conf or apache.conf');
  }

  // 全局拦截器：审计拦截器
  app.useGlobalInterceptors(new AuditInterceptor(app.get(Reflector)));

  // 全局管道：先转换空字符串，再进行验证
  app.useGlobalPipes(
    new EmptyStringTransformPipe(),
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Swagger 配置
  const config = new DocumentBuilder()
    .setTitle('NestAdmin 企业级后台管理系统')
    .setDescription(
      '企业级后台管理系统 API 文档，基于 NestJS + Prisma + MySQL。\n\n' +
        '### 功能\n' +
        '- JWT 身份认证\n' +
        '- 用户、角色、权限管理\n' +
        '- 部门与岗位管理\n' +
        '- RBAC 权限控制\n\n' +
        '### 快速开始\n' +
        '1. 管理员登录获取 token\n' +
        '2. 点击 "Authorize" 并输入 Bearer token\n' +
        '3. 调用 API\n\n' +
        '### 默认管理员\n' +
        '- 邮箱: admin@example.com\n' +
        '- 用户名: admin\n' +
        '- 密码: admin123',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: '输入 Bearer JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
    customSiteTitle: 'NestAdmin API 文档',
  });

  // 启动应用
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 应用启动成功: http://localhost:${port}`);
  console.log(`📚 API 文档地址: http://localhost:${port}/api`);
  console.log(`🔐 默认管理员账户: admin@example.com / admin123`);
}

bootstrap();
