import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateReporteDto {
  @ApiProperty({ description: 'Qué pasó, en una línea', example: 'SMS falso del banco pidiendo actualizar datos' })
  @IsString()
  @IsNotEmpty()
  titulo: string;

  @ApiProperty({
    description: 'Ids de categorías (GET /categorias); al menos una',
    type: [String],
    format: 'uuid',
    example: ['3f1c2e7a-9b4d-4e6f-8a1b-2c3d4e5f6a7b'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true})
  categorias: string[];
}
