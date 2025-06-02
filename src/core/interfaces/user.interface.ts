import { IRole } from './role.interface';

export interface IUser {
  id: number;
  email: string;
  username: string;
  password?: string;
  avatar: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles: IRole[];
} 