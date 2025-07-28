import { IRole } from './role.interface';

export interface IUser {
  id: number;
  email?: string | null;
  username: string;
  nickname: string;
  password?: string;
  avatar: string | null;
  status: number;
  createdAt: Date;
  updatedAt: Date;
  roles: IRole[];
}