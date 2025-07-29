/**
 * 用户状态枚举
 */
export enum UserStatus {
  /** 禁用 */
  DISABLED = 0,
  /** 启用 */
  ENABLED = 1,
  /** 审核中 */
  PENDING = 2,
  /** 封禁 */
  BANNED = 3,
}

/**
 * 用户状态描述映射
 */
export const UserStatusMap = {
  [UserStatus.DISABLED]: '禁用',
  [UserStatus.ENABLED]: '启用',
  [UserStatus.PENDING]: '审核中',
  [UserStatus.BANNED]: '封禁',
} as const;

/**
 * 用户状态选项
 */
export const UserStatusOptions = [
  { value: UserStatus.DISABLED, label: UserStatusMap[UserStatus.DISABLED] },
  { value: UserStatus.ENABLED, label: UserStatusMap[UserStatus.ENABLED] },
  { value: UserStatus.PENDING, label: UserStatusMap[UserStatus.PENDING] },
  { value: UserStatus.BANNED, label: UserStatusMap[UserStatus.BANNED] },
];
