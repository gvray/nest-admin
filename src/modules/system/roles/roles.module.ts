import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { DataScopeService } from './services/data-scope.service';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [RolesController],
  providers: [RolesService, DataScopeService],
  exports: [RolesService, DataScopeService],
})
export class RolesModule {}
