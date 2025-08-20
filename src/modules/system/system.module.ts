import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ResourcesModule } from './resources/resources.module';
import { DepartmentsModule } from './departments/departments.module';
import { PositionsModule } from './positions/positions.module';
import { DictionariesModule } from './dictionaries/dictionaries.module';
import { ConfigsModule } from './configs/configs.module';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    ResourcesModule,
    DepartmentsModule,
    PositionsModule,
    DictionariesModule,
    ConfigsModule,
  ],
  exports: [
    UsersModule,
    RolesModule,
    PermissionsModule,
    ResourcesModule,
    DepartmentsModule,
    PositionsModule,
    DictionariesModule,
    ConfigsModule,
  ],
})
export class SystemModule {} 