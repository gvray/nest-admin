/**
 * 日志状态枚举（用于 LoginLog, OperationLog）
 * 对应字典类型: login_status, operation_status
 */
export enum LogStatus {
  /** 失败 */
  FAILURE = 'failure',
  /** 成功 */
  SUCCESS = 'success',
}
