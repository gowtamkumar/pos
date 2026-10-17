import { Logger, ValidationPipe } from '@nestjs/common'
import { HttpAdapterHost, NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'
import { json } from 'express'
import { rateLimit } from 'express-rate-limit'
import { AppModule } from './app.module'
import { AllExceptionsFilter } from './common/exception/exception-filter'
import getLogLevels from './Logger/logger'

async function bootstrap() {
  const logger = new Logger('Bootstrap Logger')

  const app = await NestFactory.create(AppModule, {
    logger: getLogLevels(process.env.NODE_ENV === 'production'),
  })

  // Register global exception filter — prevents raw stack traces leaking to clients
  const httpAdapterHost = app.get(HttpAdapterHost)
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost))

  const API_PREFIX = 'api/v1' // You can customize this prefix
  app.setGlobalPrefix(API_PREFIX)

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, //we can whitelist the acceptable properties, and any property not included in the whitelist is automatically stripped from the resulting object. For example, if our handler expects email and password properties, but a request also includes an age property, this property can be automatically removed from the resulting DTO
      transform: true, //dto data transform to help
      skipUndefinedProperties: true, //If set to true then validator will skip validation of all properties that are undefined in the validating object.
    }),
  )

  // ── Swagger / OpenAPI Documentation Setup ─────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('LMS Studio REST API')
    .setDescription(
      'Full API documentation for Learning Management System platform endpoints, role-based controls, reports, and course player APIs.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'User authentication, registration, password resets')
    .addTag('Courses', 'Course catalog, syllabus, and module management')
    .addTag('Reports', 'Role-specific live workspace dashboard reports')
    .addTag('Certificates', 'PDF course completion certificate generation')
    .addTag('Search', 'Global platform search across courses, categories, and instructors')
    .build()

  const document = SwaggerModule.createDocument(app, swaggerConfig)
  SwaggerModule.setup('api/docs', app, document)
  logger.log('Swagger API documentation available at http://localhost:3900/api/docs')

  const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3001'
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (
        origin === allowedOrigin ||
        origin === 'http://localhost:3001' ||
        origin === 'http://localhost:3000' ||
        origin.endsWith('.ngrok-free.dev') ||
        origin.endsWith('.ngrok.app') ||
        origin.endsWith('.ngrok.io')
      ) {
        return callback(null, true)
      }
      return callback(null, true)
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'ngrok-skip-browser-warning'],
  })
  app.use(cookieParser())
  app.use(json({ limit: '20mb' }))
  // ── Tiered rate limiting ─────────────────────────────────────────────────
  const isDev = process.env.NODE_ENV !== 'production'

  // 1. Auth endpoints (login, register)
  app.use(
    '/api/v1/auth',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: isDev ? 500 : 30,
      message: 'Too many auth attempts, please try again in 15 minutes',
    }),
  )

  // 2. Standard API calls
  app.use(
    '/api/v1',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: isDev ? 2000 : 500,
      message: 'Too many requests from this IP, please try again later',
      skip: (req) =>
        req.path.startsWith('/products') ||
        req.path.startsWith('/categories') ||
        req.path.startsWith('/sales'),
    }),
  )

  // 3. Relaxed: High-frequency POS terminal operations (barcode lookup, category browsing)
  app.use(
    ['/api/v1/products', '/api/v1/categories', '/api/v1/sales'],
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: isDev ? 10000 : 2000,
      message: 'Too many POS requests, please try again later',
    }),
  )
  const PORT = process.env.API_PORT || 3900
  await app.listen(PORT, () => {
    logger.log(`Application listening on port mode. http://localhost:${PORT}`)
  })
}
bootstrap()
