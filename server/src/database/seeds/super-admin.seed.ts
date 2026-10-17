import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { getRepositoryToken } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { AppModule } from '../../app.module'
import { UserEntity } from '../../modules/admin/user/entities/user.entity'
import { UserRole } from '../../modules/admin/user/enums/user-role.enum'
import { UserStatus } from '../../modules/admin/user/enums/user-status.enum'
import { CategoryEntity } from '../../modules/category/entities/category.entity'

type SeedUser = {
  name: string
  email: string
  username: string
  password: string
  roles: UserRole[]
  isAdmin?: boolean
}

type SeedCategory = {
  name: string
  slug: string
  description: string
}

async function upsertUser(
  userRepo: Repository<UserEntity>,
  data: SeedUser,
): Promise<'created' | 'skipped'> {
  const existing = await userRepo.findOne({
    where: [{ username: data.username }, { email: data.email }],
  })

  if (existing) {
    console.log(`⏭  User "${data.username}" already exists — skipping.`)
    return 'skipped'
  }

  const hashedPassword = await bcrypt.hash(data.password, 10)
  const user = userRepo.create({
    name: data.name,
    email: data.email,
    username: data.username,
    password: hashedPassword,
    isAdmin: data.isAdmin ?? false,
    roles: data.roles,
    status: UserStatus.Active,
  })

  await userRepo.save(user)
  console.log(`✅  Seeded User [${data.roles.join(', ')}]: ${data.username}`)
  return 'created'
}

async function upsertCategory(
  categoryRepo: Repository<CategoryEntity>,
  data: SeedCategory,
): Promise<'created' | 'skipped'> {
  const existing = await categoryRepo.findOne({
    where: [{ name: data.name }, { slug: data.slug }],
  })

  if (existing) {
    console.log(`⏭  Category "${data.name}" already exists — skipping.`)
    return 'skipped'
  }

  const category = categoryRepo.create({
    name: data.name,
    slug: data.slug,
    description: data.description,
    isActive: true,
  })

  await categoryRepo.save(category)
  console.log(`✅  Seeded Category: ${data.name}`)
  return 'created'
}

function printCredentials(users: SeedUser[]) {
  console.log('\n┌────────────────────────────────────────────────┐')
  console.log('│          Seeded POS Login Accounts             │')
  console.log('├────────────────────────────────────────────────┤')
  for (const user of users) {
    console.log(`│  Role    : ${user.roles.join(', ').padEnd(35)} │`)
    console.log(`│  Name    : ${user.name.padEnd(35)} │`)
    console.log(`│  Username: ${user.username.padEnd(35)} │`)
    console.log(`│  Email   : ${user.email.padEnd(35)} │`)
    console.log(`│  Password: ${user.password.padEnd(35)} │`)
    console.log('├────────────────────────────────────────────────┤')
  }
  console.log('└────────────────────────────────────────────────┘')
}

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  })

  const configService = app.get(ConfigService)
  const userRepo = app.get<Repository<UserEntity>>(getRepositoryToken(UserEntity))
  const categoryRepo = app.get<Repository<CategoryEntity>>(getRepositoryToken(CategoryEntity))

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
  ]

  const seedCategories: SeedCategory[] = [
    {
      name: 'Beverages',
      slug: 'beverages',
      description: 'Cold drinks, sodas, mineral water & fresh juices',
    },
    {
      name: 'Snacks & Bakery',
      slug: 'snacks-bakery',
      description: 'Chips, biscuits, cookies, fresh bread & confectionery',
    },
    {
      name: 'Grocery & Staples',
      slug: 'grocery-staples',
      description: 'Rice, wheat flour, cooking oils, salt & spices',
    },
    {
      name: 'Dairy & Eggs',
      slug: 'dairy-eggs',
      description: 'Pasteurized milk, butter, cheese, yogurt & eggs',
    },
    {
      name: 'Personal Care',
      slug: 'personal-care',
      description: 'Bath soaps, shampoos, oral care & personal hygiene',
    },
  ]

  console.log('\n🌱  Seeding Admin and Cashier users for POS...')
  for (const user of seedUsers) {
    await upsertUser(userRepo, user)
  }

  console.log('\n🌱  Seeding Retail Categories for POS...')
  for (const cat of seedCategories) {
    await upsertCategory(categoryRepo, cat)
  }

  printCredentials(seedUsers)
  await app.close()
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
