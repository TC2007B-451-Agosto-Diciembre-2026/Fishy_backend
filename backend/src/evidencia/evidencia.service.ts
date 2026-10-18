import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { EvidenciaRepository } from './evidencia.repository';
import { ReporteRepository } from '../reporte/reporte.repository';
import { EvidenciaResponseDto } from './dto/evidencia-response.dto';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto';
import { Evidencia } from './entities/evidencia.entity';
import { Reporte } from '../reporte/entities/reporte.entity';
import { EstadoRepository } from 'src/estado/estado.repository';

@Injectable()
export class EvidenciaService {
  constructor(
    private readonly repository: EvidenciaRepository,
    private readonly reporteRepository: ReporteRepository,
    private readonly estadoRepository: EstadoRepository,
  ) {}


async crear(userID: string, dto: CreateEvidenciaDto): Promise<EvidenciaResponseDto> {
  await this.getReportePropio(userID, dto.perteneceAReporte);

  const evidencia = await this.repository.save({
    url: dto.url,
    foto: '',
    descripcion: dto.descripcion,
    perteneceAReporte: dto.perteneceAReporte,
  });

  return EvidenciaResponseDto.fromEntity(evidencia);
}
  async listar(rolNombre: string): Promise<EvidenciaResponseDto[]> {
    if (rolNombre === 'admin') {
      return (await this.repository.findAll()).map(EvidenciaResponseDto.fromEntity);
    }
    const aprobado = await this.estadoRepository.findByNombre('aprobado');
    if (!aprobado) throw new InternalServerErrorException('Error de configuración del servidor');
    return (await this.repository.findAllAprobadas(aprobado.id)).map(EvidenciaResponseDto.fromEntity);
  }

  /**
   * Una evidencia se puede ver si eres admin, si es de un reporte tuyo o si su
   * reporte ya está aprobado. Si no, responde 404 igual que si no existiera:
   * un 403 confirmaría que el id existe.
   */
  async obtener(userID: string, rolNombre: string, id: string): Promise<EvidenciaResponseDto> {
    const evidencia = await this.getEvidencia(id);
    if (rolNombre !== 'admin') {
      const reporte = await this.reporteRepository.findById(evidencia.perteneceAReporte);
      const aprobado = await this.estadoRepository.findByNombre('aprobado');
      const esDueno = reporte?.perteneceA === userID;
      const estaAprobado = aprobado !== undefined && reporte?.tieneEstado === aprobado.id;
      if (!esDueno && !estaAprobado) {
        throw new NotFoundException('Evidencia no encontrada');
      }
    }
    return EvidenciaResponseDto.fromEntity(evidencia);
  }

  async findByReporte(reporteId: string): Promise<EvidenciaResponseDto[]> {
    const reporte = await this.reporteRepository.findById(reporteId);
    if (!reporte) {
      throw new NotFoundException(`Reporte ${reporteId} no encontrado`);
    }
    const evidencias = await this.repository.findByReporteId(reporteId);
    return evidencias.map(EvidenciaResponseDto.fromEntity);
  }


  async buscaEnlaceAprobado(url: string): Promise<EvidenciaResponseDto | null> {
    const urlNormalizada = url.trim();

    if (!urlNormalizada) {
      return null;
    }
    const aprobado = await this.estadoRepository.findByNombre('aprobado');
    if (!aprobado) {
      throw new InternalServerErrorException('Error de configuración del servidor');
    }

    const evidencia = await this.repository.buscaEnlaceAprobado(urlNormalizada, aprobado.id);
    if (!evidencia) {
      return null;
    }
    return EvidenciaResponseDto.fromEntity(evidencia);
  }


  async actualizar(userID: string, id: string, dto: UpdateEvidenciaDto): Promise<EvidenciaResponseDto> {
    await this.getEvidenciaPropia(userID, id);
    const actualizado = await this.repository.update(id, dto);
    return EvidenciaResponseDto.fromEntity(actualizado!);
  }

  async setPhoto(userID: string, id: string, file: Express.Multer.File): Promise<EvidenciaResponseDto> {
    // Solo el dueño del reporte puede cambiar la foto de su evidencia.
    const anterior = await this.getEvidenciaPropia(userID, id);
    const actualizado = (await this.repository.setPhoto(id, file.filename))!;
    await this.borrarArchivo(anterior.foto);
    return EvidenciaResponseDto.fromEntity(actualizado);
  }

  async eliminar(userID: string, id: string): Promise<void> {
    const evidencia = await this.getEvidenciaPropia(userID, id);
    await this.repository.delete(id);
    await this.borrarArchivo(evidencia.foto);
  }


  /**
   * La base decide si el reporte es tuyo (`WHERE id = ? AND perteneceA = ?`).
   * Uno ajeno responde 404, igual que uno inexistente.
   */
  private async getReportePropio(userId: string, reporteId: string): Promise<Reporte> {
    const reporte = await this.reporteRepository.findByIdAndOwner(reporteId, userId);
    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }
    return reporte;
  }

  private async getEvidencia(id: string): Promise<Evidencia> {
    const evidencia = await this.repository.findById(id);
    if (!evidencia) {
      throw new NotFoundException(`Evidencia ${id} no encontrada`);
    }
    return evidencia;
  }

  private async getEvidenciaPropia(userId: string, id: string): Promise<Evidencia> {
    const evidencia = await this.getEvidencia(id);
    await this.getReportePropio(userId, evidencia.perteneceAReporte);
    return evidencia;
  }

  private async borrarArchivo(nombre: string): Promise<void> {
    if (!nombre) return;
    await unlink(join('uploads', nombre)).catch(() => undefined);
  }
}