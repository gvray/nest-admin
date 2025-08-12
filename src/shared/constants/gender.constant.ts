export enum Gender {
  UNKNOWN = 0, // 未知
  MALE = 1, // 男
  FEMALE = 2, // 女
  OTHER = 3, // 其他
}

export const GenderLabel = {
  [Gender.UNKNOWN]: '未知',
  [Gender.MALE]: '男',
  [Gender.FEMALE]: '女',
  [Gender.OTHER]: '其他',
} as const;

export const GenderOptions = [
  { value: Gender.UNKNOWN, label: '未知' },
  { value: Gender.MALE, label: '男' },
  { value: Gender.FEMALE, label: '女' },
  { value: Gender.OTHER, label: '其他' },
];
