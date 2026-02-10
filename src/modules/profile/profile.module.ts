import { Module } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProfileController],
  providers: [ProfileService],
})
export class ProfileModule {}
