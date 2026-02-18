import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private imagesRepository: Repository<Image>,
  ) {}

  // Método para guardar la imagen en la base de datos
  async create(file: Express.Multer.File): Promise<Image> {
    const newImage = this.imagesRepository.create({
      filename: file.originalname,
      mimetype: file.mimetype,
      data: file.buffer, // Aquí guardamos los bytes de la imagen
    });
    return await this.imagesRepository.save(newImage);
  }

  async findOne(id: number): Promise<Image | null> {
    return await this.imagesRepository.findOneBy({ id });
  }
}