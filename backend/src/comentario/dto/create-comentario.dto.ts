import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateComentarioDto {
  @ApiProperty({
    description: 'Texto del comentario',
    maxLength: 500,
    example: 'A mí también me llegó ese mensaje',
  })

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  contenido: string;
}