import { Controller, Get, Param, Res, HttpStatus, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Get(':id')
  async getImage(@Param('id') id: string, @Res() res: Response) {
    const image = await this.imagesService.findOne(+id);
    
    if (!image) return res.status(404).send('No existe');

    res.setHeader('Content-Type', image.mimetype);
    res.send(image.data);
  }
}