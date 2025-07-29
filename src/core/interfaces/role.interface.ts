export interface IRole {
  id: number;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: IPermission[];
}

export interface IPermission {
  id: number;
  name: string;
  code: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}
