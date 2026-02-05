import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR, APP_FILTER, Reflector, DiscoveryModule } from '@nestjs/core';
import { AuthModule } from '@/modules/auth/auth.module';
import { SystemModule } from '@/modules/system/system.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { DashboardModule } from '@/modules/dashboard/dashboard.module';
import { OperationLogsModule } from '@/modules/system/operation-logs/operation-logs.module';
import configuration from '@/config/configuration';
import { ResponseInterceptor } from '@/core/interceptors/response.interceptor';
import { HttpExceptionFilter } from '@/core/filters/http-exception.filter';
import { OperationLogInterceptor } from '@/core/interceptors/operation-log.interceptor';
import { ApiPermissionSyncService } from '@/core/services/api-permission-sync.service';

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
    OperationLogsModule,
    DiscoveryModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    ApiPermissionSyncService,
    Reflector,
  ],
})
export class AppModule {}
