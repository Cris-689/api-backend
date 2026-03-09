import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { Repository } from 'typeorm';
import sharp from 'sharp';
import * as crypto from 'crypto'; // Módulo nativo para generar IDs aleatorios

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);

  constructor(
    @InjectRepository(Image)
    private readonly repository: Repository<Image>,
  ) { }

  async save(
    filename: string,
    mimetype: string,
    data: Buffer,
    nombre: string,
    descripcion?: string
  ): Promise<Image> {
    try {
      // 1. Procesamiento con Sharp
      const processedBuffer = await sharp(data)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

      // 2. Nombre de archivo aleatorio (UUID)
      // Generamos un nombre único para evitar duplicados y anonimizar
      const randomId = crypto.randomUUID();
      const newFilename = `${randomId}.webp`;

      // 3. Creación y guardado usando la entidad.
      const imageEntity = this.repository.create({
        filename: newFilename,
        mimetype: 'image/webp',
        data: processedBuffer,
        nombre,
        descripcion
      });

      return await this.repository.save(imageEntity);

    } catch (error) {
      this.logger.error(`Error procesando imagen ${filename}: ${error.message}`);
      throw new BadRequestException('El archivo no se pudo procesar como imagen.');
    }
  }

  async findOne(id: number): Promise<Image> {
    const image = await this.repository.findOneBy({ id });
    if (!image) throw new NotFoundException('La imagen no existe');
    return image;
  }
}