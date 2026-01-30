import { Module } from '@nestjs/common';
import { PrismaModule } from '@/prisma/prisma.module';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';

@Module({
  imports: [PrismaModule],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class DashboardModule {}
