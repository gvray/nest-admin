export interface IRole {
  roleId: string;
  name: string;
  roleKey: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: IPermission[];
}

export interface IPermission {
  permissionId: string;
  name: string;
  code: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
