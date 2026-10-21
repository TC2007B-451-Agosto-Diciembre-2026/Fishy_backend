import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { networkInterfaces } from 'node:os';
import { join } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

   app.disable('x-powered-by');
  // forbidNonWhitelisted: en lugar de quitar en silencio los campos extra, responde 400 y avisa.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // CORS solo para el origen del frontend; con enableCors() sin opciones cualquier página podía llamar a la API.
  const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());

  // Headers de seguridad (nosniff, CSP, HSTS...). nosniff es la segunda capa contra subir HTML como "foto".
  // crossOriginResourcePolicy: el frontend (otro puerto) necesita poder mostrar las fotos de /uploads.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads'});
  app.enableCors({
    origin: (origin, callback) => {
      // Permite herramientas sin Origin (Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Origen no permitido por CORS'), false);
    },
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 600,
  });
  // Documentación OpenAPI. Se genera a partir de los decoradores de los
  // controllers y DTOs: Swagger UI en /docs, el documento crudo en /docs-json.
  const config = new DocumentBuilder()
    .setTitle('Proyecto Fishy')
    .setDescription(
      'API REST de Fishy: reportes de fraudes y estafas digitales. ' +
        'Todo, salvo /auth/register, /auth/login y /auth/refresh, requiere un ' +
        'access token: obténlo en POST /auth/login y pégalo en el botón Authorize.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000, '0.0.0.0');
  new Logger('Bootstrap').log('API en http://localhost:3000 y en ' + lanUrls().join(', '));
}

function lanUrls(): string[] {
  return Object.values(networkInterfaces())
    .flat()
    .filter((i) => i?.family === 'IPv4' && !i.internal)
    .map((i) => 'http://' + i!.address + ':3000');
}
// void: la promesa se ignora a propósito (no-floating-promises).
void bootstrap();