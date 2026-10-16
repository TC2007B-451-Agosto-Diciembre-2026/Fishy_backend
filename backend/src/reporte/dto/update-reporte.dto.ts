import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class UpdateReporteDto {
  @ApiPropertyOptional({
    description: 'Ids de categorías; si viene, reemplaza a todas las anteriores',
    type: [String],
    format: 'uuid',
    example: ['3f1c2e7a-9b4d-4e6f-8a1b-2c3d4e5f6a7b'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categorias?: string[];

  @ApiPropertyOptional({ example: 'SMS falso del banco pidiendo actualizar datos' })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  titulo?: string;

  @ApiPropertyOptional({
    description: 'Descripción de lo que pasó (se guarda en la evidencia)',
    example: 'Me llegó un SMS diciendo que mi paquete estaba retenido en aduana...',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  descripcion?: string;

  @ApiPropertyOptional({
    description: 'Número o enlace sospechoso (se guarda en la evidencia)',
    example: 'www.comprasfalsas.com',
  })
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @MaxLength(500)
  url?: string;
}