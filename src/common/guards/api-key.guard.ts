// src/common/guards/api-key.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly VALID_KEY = process.env.UPLOAD_API_KEY;
  private readonly logger = new Logger(ApiKeyGuard.name);

  canActivate(context: ExecutionContext): boolean {
    // Protección proactiva: Si el servidor arrancó sin API Key, bloqueamos TODO por seguridad.
    if (!this.VALID_KEY) {
      this.logger.error('ATENCIÓN: UPLOAD_API_KEY no está configurada en el servidor.');
      throw new UnauthorizedException('Sistema bloqueado por falta de configuración de seguridad');
    }

    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (!apiKey || apiKey !== this.VALID_KEY) {
      throw new UnauthorizedException('No tienes permiso para subir archivos aquí');
    }
    
    return true;
  }
}