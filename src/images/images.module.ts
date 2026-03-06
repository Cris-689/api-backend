import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImagesService } from './images.service';
import { ImagesController } from './images.controller';
import { Image } from './entities/image.entity';

@Module({
  imports: [
    // Esto "registra" la entidad Image para que el Service pueda usarla
    TypeOrmModule.forFeature([Image])
  ],
  controllers: [ImagesController],
  providers: [ImagesService],
  exports: [ImagesService] 
})
export class ImagesModule {}