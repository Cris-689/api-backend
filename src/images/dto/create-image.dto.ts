import { IsString, IsNotEmpty, MinLength, MaxLength, IsOptional } from 'class-validator';

export class CreateImageDto {
  @IsString({ message: 'El nombre debe ser un texto' })
  @IsNotEmpty({ message: 'El nombre del perrito es obligatorio' })
  @MinLength(3, { message: 'El nombre es muy corto' })
  @MaxLength(30, { message: 'El nombre es muy largo' })
  nombre: string;

  @IsString()
  @IsOptional() // La descripción no es obligatoria
  @MaxLength(100)
  descripcion?: string;
}