import { ApiProperty } from '@nestjs/swagger';
import { Comentario } from '../entities/comentario.entity';

export class ComentarioResponseDto {
  @ApiProperty({ format: 'uuid', example: '3f1c2e7a-9b4d-4e6f-8a1b-2c3d4e5f6a7b' })
  id: string;

  @ApiProperty({ example: 'A mí también me llegó ese mensaje' })
  contenido: string;

  @ApiProperty({ example: 'Ana López', description: 'Nombre de quien comentó; "Usuario eliminado" si su cuenta ya no existe' })
  autor: string;

  @ApiProperty({ example: false, description: 'Si el comentario es de quien pregunta' })
  esMio: boolean;

  @ApiProperty({ example: '2026-10-09T15:00:00.000Z', description: 'ISO 8601' })
  fecha_creado: string;

  @ApiProperty({ example: '2026-10-09T15:00:00.000Z', description: 'ISO 8601; distinta de fecha_creado si se editó' })
  fecha_update: string;

  static fromEntity(comentario: Comentario, userID: string): ComentarioResponseDto {
    const dto = new ComentarioResponseDto();
    dto.id = comentario.id;
    dto.contenido = comentario.contenido;
    dto.autor = comentario.autor ?? 'Usuario eliminado';
    dto.esMio = comentario.perteneceA === userID;
    dto.fecha_creado = comentario.fecha_creado.toISOString();
    dto.fecha_update = comentario.fecha_update.toISOString();
    return dto;
  }
}