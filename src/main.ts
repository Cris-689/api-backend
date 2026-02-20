import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitar CORS
  // Esto permite que el frontend (uzbuzbiz.es) pueda hacer peticiones a la API
  app.enableCors({
    // Solo permitimos peticiones desde el dominio hacia la api
    origin: [
      'https://uzbuzbiz.es',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Permitir envío de cookies o headers de auth si fuera necesario
  });

  // Validación Global
  // Esto hace que los DTOs funcionen automáticamente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: true,
      exceptionFactory: (errors) => {
        // Buscamos el primer error que tenga mensajes (constraints)
        const firstError = errors[0];

        // Extraemos el mensaje de forma segura
        // Usamos el operador '|| {}' para que Object.values nunca reciba undefined
        const message = firstError.constraints
          ? Object.values(firstError.constraints)[0]
          : 'Error de validación desconocido';

        // Devolvemos la excepción con el string limpio
        return new BadRequestException(message);
      },
    }),
  );

  // Puerto dinámico
  // Usamos el puerto que nos dé el entorno o el 3000 por defecto
  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`API corriendo en: http://localhost:${port}`);
}
bootstrap();