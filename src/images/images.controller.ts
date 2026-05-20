import {
  Controller, Get, Post, Param, UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards,
  Body, InternalServerErrorException, Logger, NotFoundException,
  StreamableFile, ParseIntPipe, Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import 'multer';
import { ImagesService } from './images.service';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { CreateImageDto } from './dto/create-image.dto';

@Controller('images')
export class ImagesController {
  private readonly logger = new Logger(ImagesController.name);

  constructor(private readonly imagesService: ImagesService) { }

  @Post('upload')
  @UseGuards(ApiKeyGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp)' }),
        ],
      }),
    ) file: Express.Multer.File,
    @Body() createImageDto: CreateImageDto,
  ) { 
    try {
      const savedImage = await this.imagesService.save(
        file.originalname,
        file.mimetype,
        file.buffer,
        createImageDto.nombre,
        createImageDto.descripcion,
      );

      return {
        id: savedImage.id,
        nombre: savedImage.nombre,
        archivo: savedImage.filename,
        url: `https://api.uzbuzbiz.es/images/${savedImage.id}`, // URL directa para el front
        message: '¡Imagen guardado con éxito!',
      };
    } catch (error) {
      // Escudo protector:
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Error subiendo imagen: ${errorMessage}`, errorStack);
      throw new InternalServerErrorException({
        message: 'No se pudo guardar la imagen.',
        error: 'DATABASE_ERROR',
      });
    }
  }

  @Get()
  async getAllImages() {
    try {
      const images = await this.imagesService.findAll();
      
      return images.map(img => ({
        id: img.id,
        nombre: img.nombre,
        descripcion: img.descripcion,
        filename: img.filename,
        mimetype: img.mimetype,
      }));
    } catch (error) {
      // Escudo protector:
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Error recuperando listado de imágenes: ${errorMessage}`);
      throw new InternalServerErrorException('Error al obtener la galería');
    }
  }

  @Get(':id')
  async getImage(
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    try {
      const image = await this.imagesService.findOne(id);

      res.set({
        'Content-Type': image.mimetype,
        'Content-Disposition': `inline; filename="${image.filename}"`,
      });

      return new StreamableFile(image.data);

    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      // Escudo protector:
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.logger.error(`Error recuperando imagen ${id}: ${errorMessage}`);
      throw new InternalServerErrorException('Error al obtener la imagen');
    }
  }
}