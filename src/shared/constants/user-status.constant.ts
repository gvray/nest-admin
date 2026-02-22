/**
 * 用户状态枚举
 * 对应字典类型: user_status
 */
export enum UserStatus {
  /** 禁用 */
  DISABLED = 'disabled',
  /** 启用 */
  ENABLED = 'enabled',
  /** 审核中 */
  PENDING = 'pending',
  /** 封禁 */
  BANNED = 'banned',
}
