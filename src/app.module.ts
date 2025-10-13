import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';
import { AuthModule } from '@/modules/auth/auth.module';
import { SystemModule } from '@/modules/system/system.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import configuration from '@/config/configuration';
import { ResponseInterceptor } from '@/core/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@/core/filters/http-exception.filter';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
      load: [configuration],
      expandVariables: true,
      cache: true,
      ignoreEnvFile: false,
    }),
    PrismaModule,
    AuthModule,
    SystemModule,
    DashboardModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
