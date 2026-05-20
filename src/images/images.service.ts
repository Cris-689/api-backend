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
      // 1. Verificamos si es un Error real; si no, lo convertimos a string.
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      this.logger.error(`Error procesando imagen ${filename}: ${errorMessage}`);
      throw new BadRequestException('El archivo no se pudo procesar como imagen.');
    }
  }

  async findOne(id: number): Promise<Image> {
    const image = await this.repository.findOneBy({ id });
    if (!image) throw new NotFoundException('La imagen no existe');
    return image;
  }

  async findAll() {
    return await this.repository.find({
      select: ['id', 'nombre', 'descripcion', 'filename', 'mimetype'],
      order: {
        id: 'DESC', // Mostrar las más nuevas primero
      },
    });
  }
  async remove(id: number): Promise<void> {
    try {
      const result = await this.repository.delete(id);
      
      if (result.affected === 0) {
        throw new NotFoundException(`La imagen con ID ${id} no existe.`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error eliminando imagen ${id} en BD: ${errorMessage}`);
      throw new BadRequestException('No se pudo eliminar la imagen de la base de datos.');
    }
  }
}