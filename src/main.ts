import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. Habilitar CORS
  // Esto permite que tu frontend (uzbuzbiz.es) pueda hacer peticiones a la API
  app.enableCors();

  // 2. Validación Global
  // Esto hace que los DTOs que creamos antes funcionen automáticamente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina datos que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si envían datos extra
      transform: true, // Convierte tipos automáticamente (ej: string a número)
    }),
  );

  // 3. Puerto dinámico
  // Usamos el puerto que nos dé el entorno o el 3000 por defecto
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`API corriendo en: http://localhost:${port}`);
}
bootstrap();