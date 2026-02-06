import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import { promises as fs } from 'fs';

type ReportItem = {
  code: string;
  action: string;
  controller: string;
  method: string;
  httpMethod: string;
  route: string;
  menuCode: string;
  status: 'created' | 'exists' | 'reactivated' | 'skipped';
};

async function main() {
  const prisma = new PrismaClient();

  const file = path.join(process.cwd(), 'reports', 'api-permissions.json');
  const content = await fs.readFile(file, 'utf8');
  const items: ReportItem[] = JSON.parse(content);

  // 获取所有 menu 的 permissionId 映射
  const menus = await prisma.permission.findMany({
    where: { code: { startsWith: 'menu:' } },
    select: { permissionId: true, code: true },
  });
  const menuMap: Record<string, string> = {};
  for (const m of menus) menuMap[m.code] = m.permissionId;

  // 获取已有的 API code
  const existingAPIs = await prisma.permission.findMany({
    where: { code: { startsWith: 'api:' } },
    select: { code: true },
  });
  const existingSet = new Set(existingAPIs.map((p) => p.code));

  // 按 code 去重，合并同一 code 的多条路由描述
  const deduped = new Map<string, { item: ReportItem; parentId: string; descriptions: string[] }>();
  for (const item of items) {
    const parentId = menuMap[item.menuCode];
    if (!parentId) continue;
    const desc = `${item.controller}.${item.method} ${item.httpMethod} ${item.route}`;
    if (deduped.has(item.code)) {
      deduped.get(item.code)!.descriptions.push(desc);
    } else {
      deduped.set(item.code, { item, parentId, descriptions: [desc] });
    }
  }

  const toCreate: any[] = [];
  const toUpdate: any[] = [];
  const toReactivate: any[] = [];

  for (const [code, { item, parentId, descriptions }] of deduped) {
    const description = descriptions.join('; ');
    if (existingSet.has(code)) {
      if (item.status === 'reactivated') {
        toReactivate.push({
          code,
          description,
          parentPermissionId: parentId,
        });
      } else {
        toUpdate.push({
          code,
          type: 'API',
          action: item.action,
          description,
          parentPermissionId: parentId,
        });
      }
    } else {
      toCreate.push({
        name: `${code} API`,
        code,
        type: 'API',
        origin: 'SYSTEM',
        action: item.action,
        description,
        parentPermissionId: parentId,
      });
    }
  }

  // 批量创建
  if (toCreate.length > 0) {
    await prisma.permission.createMany({
      data: toCreate,
    });
  }

  // 批量更新
  for (const item of toUpdate) {
    const { code, ...data } = item;
    await prisma.permission.update({
      where: { code },
      data,
    });
  }

  // 激活已软删除的 API 权限（清除 deletedAt，更新 parentPermissionId）
  for (const item of toReactivate) {
    const { code, ...data } = item;
    await (prisma as any).permission.update({
      where: { code },
      data: { ...data, deletedAt: null },
    });
  }

  await prisma.$disconnect();

  process.stdout.write(
    JSON.stringify(
      { created: toCreate.length, updated: toUpdate.length, reactivated: toReactivate.length },
      null,
      2,
    ) + '\n',
  );
}

main().catch((e) => {
  process.stderr.write(String(e) + '\n');
  process.exit(1);
});
