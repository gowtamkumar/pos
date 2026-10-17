import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

const defaultConnection = (
  configService: ConfigService,
): TypeOrmModuleOptions => {
  return {
    type: 'postgres',
    host: configService.get('DB_HOST'),
    port: +configService.get('DB_PORT'),
    username: configService.get('DB_USERNAME'),
    password: configService.get('DB_PASSWORD'),
    database: configService.get('DB_DATABASE'),
    autoLoadEntities: true,
    migrations: [join(__dirname, './migrations/*{.ts,.js}')],
    migrationsTableName: 'migrations',
    migrationsRun:
      configService.get<string>('DB_MIGRATIONS_RUN', 'true') === 'true',
    synchronize:
      configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
    logging: configService.get<string>('ENABLE_ORM_LOGS', 'false') === 'true',
  };
};

export const databaseProvider = [
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: defaultConnection,
  }),
];
