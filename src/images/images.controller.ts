import {
  Controller, Get, Post, Param, UseInterceptors, UploadedFile,
  ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, UseGuards,
  Body, InternalServerErrorException, Logger, NotFoundException,
  StreamableFile, ParseIntPipe, Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express'; // Ahora solo para tipos, sin dramas
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
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }),
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
        url: `https://api.uzbuzbiz.es/images/${savedImage.id}`, // URL directa para el front
        message: '¡Perrito guardado con éxito!',
      };
    } catch (error) {
      this.logger.error(`Error subiendo imagen: ${error.message}`, error.stack);
      throw new InternalServerErrorException({
        message: 'No se pudo guardar la imagen del perrito.',
        error: 'DATABASE_ERROR',
      });
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

      this.logger.error(`Error recuperando imagen ${id}: ${error.message}`);
      throw new InternalServerErrorException('Error al obtener la imagen');
    }
  }
}