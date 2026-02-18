import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Image } from './entities/image.entity'; // IMPORTA TU ENTIDAD

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private imagesRepository: Repository<Image>,
  ) {}

  // AÑADE EL TIPO DE RETORNO : Promise<Image> 
  async findOne(id: number): Promise<Image | null> {
    return await this.imagesRepository.findOneBy({ id });
  }
}