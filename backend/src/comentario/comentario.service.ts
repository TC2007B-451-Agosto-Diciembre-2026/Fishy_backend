import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ReporteRepository } from '../reporte/reporte.repository';
import { Reporte } from '../reporte/entities/reporte.entity';
import { EstadoRepository } from '../estado/estado.repository';
import { ComentarioRepository } from './comentario.repository';
import { Comentario } from './entities/comentario.entity';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { ComentarioResponseDto } from './dto/comentario-response.dto';

/** Solo los reportes en este estado admiten comentarios. */
const ESTADO_COMENTABLE = 'aprobado';

/**
 * Reglas de negocio de los comentarios de un reporte.
 *
 * - Ver: quien puede ver el reporte (admin y dueño en cualquier estado; los
 *   demás, solo si está `aprobado`), misma regla que `ReporteService.findOne`.
 * - Comentar: cualquier usuario autenticado, solo en reportes `aprobado`.
 * - Editar: solo el autor.
 * - Borrar: el autor o un admin (moderación).
 */
@Injectable()
export class ComentarioService {
  constructor(
    private readonly repository: ComentarioRepository,
    private readonly reporteRepository: ReporteRepository,
    private readonly estadoRepository: EstadoRepository,
  ) {}

  /**
   * Publica un comentario a nombre de quien lo pide.
   * @param userID - `sub` del token; queda como autor (`perteneceA`).
   * @param rolNombre - `rolNombre` del token.
   * @param reporteId - UUID del reporte.
   * @throws BadRequestException si el texto es solo espacios o el reporte no está aprobado.
   * @throws NotFoundException si no existe el reporte o no puedes verlo (mismo 404).
   */
  async create(userID: string, rolNombre: string, reporteId: string, dto: CreateComentarioDto): Promise<ComentarioResponseDto> {
    const contenido = this.limpiarContenido(dto.contenido);
    const reporte = await this.obtenerReporteVisible(userID, rolNombre, reporteId);
    if (!(await this.estaAprobado(reporte))) {
      throw new BadRequestException('Solo se puede comentar en reportes aprobados');
    }
    const comentario = await this.repository.save({
      contenido,
      perteneceA: userID,
      perteneceAReporte: reporteId,
    });
    return ComentarioResponseDto.fromEntity(comentario, userID);
  }

  /**
   * Lista los comentarios de un reporte, más antiguos primero.
   * @throws NotFoundException si no existe el reporte o no puedes verlo (mismo 404).
   */
  async findByReporte(userID: string, rolNombre: string, reporteId: string): Promise<ComentarioResponseDto[]> {
    await this.obtenerReporteVisible(userID, rolNombre, reporteId);
    const comentarios = await this.repository.findByReporte(reporteId);
    return comentarios.map((c) => ComentarioResponseDto.fromEntity(c, userID));
  }

  /**
   * Edita el texto de un comentario propio. Ni un admin edita comentarios ajenos.
   * @throws NotFoundException si el comentario no existe o no es de ese reporte.
   * @throws ForbiddenException si el comentario no es tuyo.
   * @throws BadRequestException si el texto es solo espacios.
   */
  async update(userID: string, reporteId: string, id: string, dto: UpdateComentarioDto): Promise<ComentarioResponseDto> {
    const contenido = this.limpiarContenido(dto.contenido);
    const comentario = await this.obtenerComentario(reporteId, id);
    if (comentario.perteneceA !== userID) {
      throw new ForbiddenException('No puedes modificar un comentario que no es tuyo');
    }
    const actualizado = (await this.repository.update(id, contenido))!;
    return ComentarioResponseDto.fromEntity(actualizado, userID);
  }

  /**
   * Borra un comentario. Definitivo: no hay papelera.
   * @throws NotFoundException si el comentario no existe o no es de ese reporte.
   * @throws ForbiddenException si no eres el autor ni admin.
   */
  async remove(userID: string, rolNombre: string, reporteId: string, id: string): Promise<void> {
    const comentario = await this.obtenerComentario(reporteId, id);
    const esAutor = comentario.perteneceA === userID;
    if (!esAutor && rolNombre !== 'admin') {
      throw new ForbiddenException('No puedes borrar un comentario que no es tuyo');
    }
    await this.repository.delete(id);
  }

  private limpiarContenido(contenido: string): string {
    const limpio = contenido.trim();
    if (!limpio) {
      throw new BadRequestException('El comentario no puede estar vacío');
    }
    return limpio;
  }

  private async obtenerReporteVisible(userID: string, rolNombre: string, reporteId: string): Promise<Reporte> {
    const reporte = await this.reporteRepository.findById(reporteId);
    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }
    const esAdmin = rolNombre === 'admin';
    const esDueno = reporte.perteneceA === userID;
    // 404 y no 403: un 403 confirmaría que el reporte existe.
    if (!esAdmin && !esDueno && !(await this.estaAprobado(reporte))) {
      throw new NotFoundException('Reporte no encontrado');
    }
    return reporte;
  }

  private async estaAprobado(reporte: Reporte): Promise<boolean> {
    const estado = await this.estadoRepository.findByNombre(ESTADO_COMENTABLE);
    if (!estado) {
      throw new InternalServerErrorException('Error de configuración del servidor');
    }
    return reporte.tieneEstado === estado.id;
  }

  private async obtenerComentario(reporteId: string, id: string): Promise<Comentario> {
    const comentario = await this.repository.findById(id);
    if (!comentario || comentario.perteneceAReporte !== reporteId) {
      throw new NotFoundException('Comentario no encontrado');
    }
    return comentario;
  }
}