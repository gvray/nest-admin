import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}`,
        '.env',
        '.env.example'
      ],
      load: [appConfig, databaseConfig, jwtConfig],
      expandVariables: true,
      cache: true,
      ignoreEnvFile: false,
    }),
    PrismaModule,
  ],
})
export class AppModule {}
