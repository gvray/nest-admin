/**
 * 通用状态枚举（用于 Role, Department, Position, Config, Dictionary 等）
 * 对应字典类型: role_status, department_status, position_status 等
 */
export enum CommonStatus {
  /** 禁用 */
  DISABLED = 'disabled',
  /** 启用 */
  ENABLED = 'enabled',
}
