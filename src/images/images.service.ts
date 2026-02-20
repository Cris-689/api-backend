import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Image } from './entities/image.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ImagesService {
  constructor(
    @InjectRepository(Image)
    private readonly repository: Repository<Image>,
  ) {}

  async save(filename: string, mimetype: string, data: Buffer): Promise<Image> {
    return this.repository.save({ filename, mimetype, data });
  }

  async findOne(id: number): Promise<Image> {
    const image = await this.repository.findOneBy({ id });
    if (!image) throw new NotFoundException('La imagen no existe');
    return image;
  }
}