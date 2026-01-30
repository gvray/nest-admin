import { Module } from '@nestjs/common';
import { LoginLogsService } from './login-logs.service';
import { LoginLogsController } from './login-logs.controller';
import { PrismaService } from '@/prisma/prisma.service';

@Module({
  controllers: [LoginLogsController],
  providers: [LoginLogsService, PrismaService],
  exports: [LoginLogsService],
})
export class LoginLogsModule {}
