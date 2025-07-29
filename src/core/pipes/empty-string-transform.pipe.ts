import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class EmptyStringTransformPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type === 'body' && value && typeof value === 'object') {
      return this.transformObject(value);
    }
    return value;
  }

  private transformObject(obj: unknown): unknown {
    if (Array.isArray(obj)) {
      return obj.map((item) => this.transformObject(item));
    }

    if (obj && typeof obj === 'object') {
      const transformed: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value === '') {
          // 将空字符串转换为 undefined，这样 class-validator 的 @IsOptional() 就会跳过验证
          transformed[key] = undefined;
        } else if (value && typeof value === 'object') {
          transformed[key] = this.transformObject(value);
        } else {
          transformed[key] = value;
        }
      }
      return transformed;
    }

    return obj;
  }
}