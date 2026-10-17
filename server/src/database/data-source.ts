import * as dotenv from 'dotenv'
import * as fs from 'fs'
import { join } from 'path'
import { DataSource, DataSourceOptions } from 'typeorm'

const envFiles = ['.env.development.local', '.env.development', '.env.production', '.env']

for (const envFile of envFiles) {
  const fullPath = join(process.cwd(), envFile)
  if (fs.existsSync(fullPath)) {
    dotenv.config({ path: fullPath })
  }
}

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || '127.0.0.1',
  port: +(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'lms',
  entities: [join(__dirname, '../**/*.entity{.ts,.js}')],
  migrations: [join(__dirname, './migrations/*{.ts,.js}')],
  migrationsTableName: 'migrations',
  migrationsRun: process.env.DB_MIGRATIONS_RUN !== 'false',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.ENABLE_ORM_LOGS === 'true',
}

const AppDataSource = new DataSource(dataSourceOptions)

export default AppDataSource
