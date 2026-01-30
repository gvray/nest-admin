import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { OperationLogsService } from './operation-logs.service';
import { OperationLogsController } from './operation-logs.controller';

@Module({
  imports: [PrismaModule],
  providers: [OperationLogsService],
  controllers: [OperationLogsController],
  exports: [OperationLogsService],
})
export class OperationLogsModule {}
