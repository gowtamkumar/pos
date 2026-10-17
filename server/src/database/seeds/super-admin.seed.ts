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
import { ProductEntity } from '../../modules/product/entities/product.entity'

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

type SeedProduct = {
  name: string
  categorySlug: string
  sku: string
  barcode: string
  retailPrice: number
  costPrice: number
  stockQuantity: number
  lowStockThreshold: number
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
): Promise<CategoryEntity> {
  let category = await categoryRepo.findOne({
    where: [{ name: data.name }, { slug: data.slug }],
  })

  if (category) {
    console.log(`⏭  Category "${data.name}" already exists — skipping.`)
    return category
  }

  category = categoryRepo.create({
    name: data.name,
    slug: data.slug,
    description: data.description,
    isActive: true,
  })

  const saved = await categoryRepo.save(category)
  console.log(`✅  Seeded Category: ${data.name}`)
  return saved
}

async function upsertProduct(
  productRepo: Repository<ProductEntity>,
  data: SeedProduct,
  categoryMap: Map<string, CategoryEntity>,
): Promise<'created' | 'skipped'> {
  const existing = await productRepo.findOne({
    where: [{ sku: data.sku }, { barcode: data.barcode }],
  })

  if (existing) {
    console.log(`⏭  Product "${data.name}" (${data.sku}) already exists — skipping.`)
    return 'skipped'
  }

  const category = categoryMap.get(data.categorySlug) || null

  const product = productRepo.create({
    name: data.name,
    sku: data.sku,
    barcode: data.barcode,
    retailPrice: data.retailPrice,
    costPrice: data.costPrice,
    stockQuantity: data.stockQuantity,
    lowStockThreshold: data.lowStockThreshold,
    category,
    isActive: true,
  })

  await productRepo.save(product)
  console.log(
    `✅  Seeded Product: ${data.name} [Barcode: ${data.barcode}, Stock: ${data.stockQuantity}]`,
  )
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
  const productRepo = app.get<Repository<ProductEntity>>(getRepositoryToken(ProductEntity))

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

  const seedProducts: SeedProduct[] = [
    {
      name: 'Coca-Cola 500ml Can',
      categorySlug: 'beverages',
      sku: 'BEV-COCA-500',
      barcode: '890103000001',
      retailPrice: 45.0,
      costPrice: 35.0,
      stockQuantity: 80,
      lowStockThreshold: 10,
    },
    {
      name: 'Pepsi 500ml Bottle',
      categorySlug: 'beverages',
      sku: 'BEV-PEPSI-500',
      barcode: '890103000002',
      retailPrice: 45.0,
      costPrice: 35.0,
      stockQuantity: 60,
      lowStockThreshold: 10,
    },
    {
      name: 'Mineral Water 1L',
      categorySlug: 'beverages',
      sku: 'BEV-WATER-1000',
      barcode: '890103000003',
      retailPrice: 25.0,
      costPrice: 18.0,
      stockQuantity: 120,
      lowStockThreshold: 15,
    },
    {
      name: 'Lays Classic Salted 50g',
      categorySlug: 'snacks-bakery',
      sku: 'SNK-LAYS-50',
      barcode: '890103000004',
      retailPrice: 30.0,
      costPrice: 22.0,
      stockQuantity: 50,
      lowStockThreshold: 10,
    },
    {
      name: 'Oreo Chocolate Cookies 120g',
      categorySlug: 'snacks-bakery',
      sku: 'SNK-OREO-120',
      barcode: '890103000005',
      retailPrice: 55.0,
      costPrice: 42.0,
      stockQuantity: 40,
      lowStockThreshold: 8,
    },
    {
      name: 'Basmati Rice Premium 1kg',
      categorySlug: 'grocery-staples',
      sku: 'GRC-RICE-1KG',
      barcode: '890103000006',
      retailPrice: 180.0,
      costPrice: 145.0,
      stockQuantity: 30,
      lowStockThreshold: 5,
    },
    {
      name: 'Pure Sunflower Oil 1L',
      categorySlug: 'grocery-staples',
      sku: 'GRC-OIL-1L',
      barcode: '890103000007',
      retailPrice: 195.0,
      costPrice: 165.0,
      stockQuantity: 25,
      lowStockThreshold: 5,
    },
    {
      name: 'Fresh Whole Milk 1L',
      categorySlug: 'dairy-eggs',
      sku: 'DRY-MILK-1L',
      barcode: '890103000008',
      retailPrice: 90.0,
      costPrice: 75.0,
      stockQuantity: 4, // Intentionally low stock
      lowStockThreshold: 10,
    },
    {
      name: 'Farm Fresh Brown Eggs (Dozen)',
      categorySlug: 'dairy-eggs',
      sku: 'DRY-EGGS-12',
      barcode: '890103000009',
      retailPrice: 155.0,
      costPrice: 130.0,
      stockQuantity: 3, // Intentionally low stock
      lowStockThreshold: 8,
    },
    {
      name: 'Dove Deep Moisture Soap 100g',
      categorySlug: 'personal-care',
      sku: 'PRC-DOVE-100',
      barcode: '890103000010',
      retailPrice: 75.0,
      costPrice: 58.0,
      stockQuantity: 45,
      lowStockThreshold: 10,
    },
  ]

  console.log('\n🌱  Seeding Admin and Cashier users for POS...')
  for (const user of seedUsers) {
    await upsertUser(userRepo, user)
  }

  console.log('\n🌱  Seeding Retail Categories for POS...')
  const categoryMap = new Map<string, CategoryEntity>()
  for (const cat of seedCategories) {
    const saved = await upsertCategory(categoryRepo, cat)
    categoryMap.set(saved.slug, saved)
  }

  console.log('\n🌱  Seeding Retail Products with Barcodes & Stock for POS...')
  for (const prod of seedProducts) {
    await upsertProduct(productRepo, prod, categoryMap)
  }

  printCredentials(seedUsers)
  await app.close()
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err)
  process.exit(1)
})
