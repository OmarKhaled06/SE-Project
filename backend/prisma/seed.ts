import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
const db = new PrismaClient();

async function makeUser(email: string, fullName: string, role: Role) {
  const passwordHash = await bcrypt.hash('Password1!', 10);
  const u = await db.user.upsert({
    where: { email },
    update: {},
    create: { email, fullName, passwordHash, roles: { create: { role } } },
  });
  return u;
}

async function main() {
  await makeUser('admin@campuscare.dev', 'Ada Admin', 'ADMIN');
  await makeUser('manager@campuscare.dev', 'Mona Manager', 'MANAGER');
  await makeUser('worker@campuscare.dev', 'Walter Worker', 'WORKER');
  const member = await makeUser('member@campuscare.dev', 'Mia Member', 'MEMBER');

  await db.issue.create({
    data: {
      title: 'Broken light in Library 2F',
      description: 'The overhead light by the window flickers and then turns off.',
      location: 'Library, Floor 2, Aisle B',
      category: 'ELECTRICAL', priority: 'MEDIUM',
      reporterId: member.id,
    },
  });
  console.log('Seeded ✓');
}
main().finally(() => db.$disconnect());
