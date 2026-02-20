import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilitar CORS
  // Esto permite que el frontend (uzbuzbiz.es) pueda hacer peticiones a la API
  app.enableCors({
    // Solo permitimos peticiones desde el dominio hacia la api
    origin: [
      'https://uzbuzbiz.es',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Permitir envío de cookies o headers de auth si fuera necesario
  });

  // 2. Validación Global
  // Esto hace que los DTOs funcionen automáticamente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina datos que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían datos extra
      transform: true, // Convierte tipos automáticamente (ej: string a número)
      stopAtFirstError: true,
    }),
  );

  // 3. Puerto dinámico
  // Usamos el puerto que nos dé el entorno o el 3000 por defecto
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`API corriendo en: http://localhost:${port}`);
}
bootstrap();