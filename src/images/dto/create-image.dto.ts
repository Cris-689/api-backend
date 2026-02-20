import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';
export class CreateImageDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @MaxLength(20, { message: 'El nombre no puede tener más de 20 caracteres' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  @IsNotEmpty({ message: 'El nombre del perrito es obligatorio' }) // <-- Ahora se ejecuta primero
  nombre: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  descripcion?: string;
}