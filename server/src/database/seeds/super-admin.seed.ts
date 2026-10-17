import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { UserEntity } from '../../modules/admin/user/entities/user.entity';
import { UserRole } from '../../modules/admin/user/enums/user-role.enum';
import { UserStatus } from '../../modules/admin/user/enums/user-status.enum';

type SeedUser = {
  name: string;
  email: string;
  username: string;
  password: string;
  roles: UserRole[];
  isAdmin?: boolean;
};

async function upsertUser(
  userRepo: Repository<UserEntity>,
  data: SeedUser,
): Promise<'created' | 'skipped'> {
  const existing = await userRepo.findOne({
    where: [{ username: data.username }, { email: data.email }],
  });

  if (existing) {
    console.log(`⏭  "${data.username}" already exists — skipping.`);
    return 'skipped';
  }

  const hashedPassword = await bcrypt.hash(data.password, 10);
  const user = userRepo.create({
    name: data.name,
    email: data.email,
    username: data.username,
    password: hashedPassword,
    isAdmin: data.isAdmin ?? false,
    roles: data.roles,
    status: UserStatus.Active,
  });

  await userRepo.save(user);
  console.log(`✅  Seeded ${data.roles.join(', ')}: ${data.username}`);
  return 'created';
}

function printCredentials(users: SeedUser[]) {
  console.log('\n┌────────────────────────────────────────────────┐');
  console.log('│          Seeded POS Login Accounts             │');
  console.log('├────────────────────────────────────────────────┤');
  for (const user of users) {
    console.log(`│  Role    : ${user.roles.join(', ').padEnd(35)} │`);
    console.log(`│  Name    : ${user.name.padEnd(35)} │`);
    console.log(`│  Username: ${user.username.padEnd(35)} │`);
    console.log(`│  Email   : ${user.email.padEnd(35)} │`);
    console.log(`│  Password: ${user.password.padEnd(35)} │`);
    console.log('├────────────────────────────────────────────────┤');
  }
  console.log('└────────────────────────────────────────────────┘');
  console.log('\n⚠️  Change passwords after first login in production.\n');
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const configService = app.get(ConfigService);
  const userRepo = app.get<Repository<UserEntity>>(
    getRepositoryToken(UserEntity),
  );

  const seedUsers: SeedUser[] = [
    {
      name: configService.get<string>('ADMIN_NAME') || 'Store Admin',
      email: configService.get<string>('ADMIN_EMAIL') || 'admin@pos.local',
      username: configService.get<string>('ADMIN_USERNAME') || 'admin',
      password: configService.get<string>('ADMIN_PASSWORD') || 'Admin@1234',
      roles: [UserRole.Admin],
      isAdmin: true,
    },
    {
      name: configService.get<string>('CASHIER_NAME') || 'Terminal Cashier',
      email: configService.get<string>('CASHIER_EMAIL') || 'cashier@pos.local',
      username: configService.get<string>('CASHIER_USERNAME') || 'cashier',
      password: configService.get<string>('CASHIER_PASSWORD') || 'Cashier@1234',
      roles: [UserRole.Cashier],
    },
  ];

  console.log('\n🌱  Seeding Admin and Cashier users for POS...\n');

  for (const user of seedUsers) {
    await upsertUser(userRepo, user);
  }

  printCredentials(seedUsers);
  await app.close();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
