import { SetMetadata } from '@nestjs/common';

export const OPLOG_META = 'OPLOG_META';

export interface OperationLogOptions {
  module?: string;
  action?: string;
  resource?: string;
}

export const OperationLog = (options: OperationLogOptions = {}) =>
  SetMetadata(OPLOG_META, options);


