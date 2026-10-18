import { ApiProperty } from '@nestjs/swagger';

export class EstadisticaCategoriaDto {
  @ApiProperty({ example: 'SMS' })
  categoria: string;

  @ApiProperty({ example: 5 })
  total: number;
}