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
  status: 'created' | 'exists' | 'skipped';
};

async function main() {
  const prisma = new PrismaClient();
  const file = path.join(process.cwd(), 'reports', 'api-permissions.json');
  const content = await fs.readFile(file, 'utf8');
  const items: ReportItem[] = JSON.parse(content);
  const menus = await prisma.permission.findMany({
    where: { code: { startsWith: 'menu:' } },
    select: { permissionId: true, code: true },
  });
  const menuMap: Record<string, string> = {};
  for (const m of menus) {
    const mc = m.code.split(':')[1];
    if (mc) menuMap[mc] = m.permissionId;
  }
  let created = 0;
  let updated = 0;
  for (const item of items) {
    const parentId = menuMap[item.menuCode];
    if (!parentId) continue;
    const createData: any = {
      name: `${item.menuCode} ${item.action} API`,
      code: item.code,
      type: 'API',
      action: item.action,
      description: `${item.controller}.${item.method} ${item.httpMethod} ${item.route}`,
      parent: { connect: { permissionId: parentId } },
    };
    const updateData: any = {
      type: 'API',
      action: item.action,
      parent: { connect: { permissionId: parentId } },
    };
    const before = await prisma.permission.findUnique({
      where: { code: item.code },
      select: { permissionId: true },
    });
    await prisma.permission.upsert({
      where: { code: item.code },
      update: updateData,
      create: createData,
    });
    if (before) updated++;
    else created++;
  }
  await prisma.$disconnect();
  process.stdout.write(JSON.stringify({ created, updated }, null, 2) + '\n');
}

main().catch((e) => {
  process.stderr.write(String(e) + '\n');
  process.exit(1);
});
