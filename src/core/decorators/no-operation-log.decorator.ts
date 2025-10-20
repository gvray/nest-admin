import { SetMetadata } from '@nestjs/common';

export const OPLOG_SKIP = 'OPLOG_SKIP';

export const NoOperationLog = () => SetMetadata(OPLOG_SKIP, true);


