import { 
  Controller, Get, Post, Param, Res, 
  UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file')) // 'file' es el nombre del campo en el formulario
  async uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }), // Máximo 5MB
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg)' }), // Solo imágenes
        ],
      }),
    ) file: Express.Multer.File,
  ) {
    const savedImage = await this.imagesService.create(file);
    return {
      id: savedImage.id,
      message: 'Imagen subida con éxito a perritos_db',
    };
  }

  @Get(':id')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const image = await this.imagesService.findOne(+id);
    if (!image) return res.status(404).send('No existe');

    res.setHeader('Content-Type', image.mimetype);
    res.send(image.data);
  }
}