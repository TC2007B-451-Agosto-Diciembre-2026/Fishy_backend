import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvidenciaResponseDto } from 'src/evidencia/dto/evidencia-response.dto';
import { Reporte } from '../entities/reporte.entity';
 
export class ReporteResponseDto {
  @ApiProperty({ format: 'uuid', example: '3f1c2e7a-9b4d-4e6f-8a1b-2c3d4e5f6a7b' })
  id: string;

  @ApiProperty({ example: 'SMS falso del banco pidiendo actualizar datos' })
  titulo: string;

  @ApiProperty({ type: String, nullable: true, format: 'uuid', example: null, description: 'Id del nivel de riesgo; null si no tiene' })
  tieneRiesgo: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Alto', description: 'Nombre del nivel de riesgo (Bajo, Medio, Alto); null si no tiene' })
  riesgo: string | null = null;

  @ApiProperty({ example: '2026-10-09T15:00:00.000Z', description: 'ISO 8601' })
  fecha_pub: string;

  @ApiProperty({ example: '2026-10-09T15:00:00.000Z', description: 'ISO 8601' })
  fecha_update: string;

  @ApiProperty({ type: String, nullable: true, example: null, description: 'ISO 8601; null hasta que se aprueba' })
  fecha_aprob: string | null;

  @ApiPropertyOptional({ format: 'uuid', example: '3f1c2e7a-9b4d-4e6f-8a1b-2c3d4e5f6a7b', description: 'Id del dueño; solo viene en respuestas para admin' })
  perteneceA: string | null;

  @ApiProperty({ format: 'uuid', example: '3f1c2e7a-9b4d-4e6f-8a1b-2c3d4e5f6a7b', description: 'Id del estado (GET /estados)' })
  tieneEstado: string;

  @ApiPropertyOptional({ example: 'pendiente', description: 'Nombre del estado (solo viene en GET /reportes/mios)' })
  estado?: string;

  @ApiProperty({ type: [String], example: ['SMS', 'URL'], description: 'Nombres de categorías (al crear o editar: los ids que se mandaron)' })
  categorias: string[] = [];

  @ApiProperty({ type: () => [EvidenciaResponseDto] })
  evidencias: EvidenciaResponseDto[] = [];

  @ApiProperty({ example: 'Ana López', description: 'Nombre de quien publicó' })
  autor: string = 'Anónimo';

  @ApiProperty({ example: 3, description: 'Cuántos usuarios marcaron "me pasó igual"' })
  mePasoIgualCount: number = 0;

  @ApiProperty({ example: false, description: 'Si el reporte es de quien pregunta' })
  esMio: boolean = false;

  @ApiProperty({ example: false, description: 'Si quien pregunta ya marcó "me pasó igual"' })
  yaDiLike: boolean = false;

  @ApiProperty({ example: 3 })
  comentariosCount: number = 0;
 
  static fromEntity(reporte: Reporte, opts: { incluirDueno: boolean }): ReporteResponseDto {
    const dto = new ReporteResponseDto();
    dto.id = reporte.id;
    dto.titulo = reporte.titulo;
    dto.tieneRiesgo = reporte.tieneRiesgo;
    dto.fecha_pub = reporte.fecha_pub.toISOString();
    dto.fecha_update = reporte.fecha_update.toISOString();
    dto.fecha_aprob = reporte.fecha_aprob ? reporte.fecha_aprob.toISOString() : null;
    if (opts.incluirDueno) {
      dto.perteneceA = reporte.perteneceA;
    }
    dto.tieneEstado = reporte.tieneEstado;
    return dto;
  }
}