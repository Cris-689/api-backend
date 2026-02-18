import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  // En producción, esto vendrá de una variable de entorno
  private readonly VALID_KEY = process.env.UPLOAD_API_KEY;

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key']; // Buscamos la llave en esta cabecera

    if (apiKey !== this.VALID_KEY) {
      throw new UnauthorizedException('No tienes permiso para subir archivos aquí 🚫');
    }
    return true;
  }
}