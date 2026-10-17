import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { ReporteRepository } from './reporte.repository';
import { ReporteResponseDto } from './dto/reporte-response.dto';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { UpdateReporteDto } from './dto/update-reporte.dto';
import { EstadoRepository } from '../estado/estado.repository';
import { RiesgoRepository } from '../riesgo/riesgo.repository';
import { Reporte } from './entities/reporte.entity';
import { ModerarReporteDto } from './dto/admin-reporte.dto';
import { CategoriaRepository } from '../categoria/categoria.repository';
import { ReporteCategoriaRepository } from './reporte-categoria.repository';
import { ReporteLikeRepository } from './reporte-like.repository';
import { UsuarioRepository } from '../usuario/usuario.repository';
import { unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { EvidenciaRepository } from '../evidencia/evidencia.repository';
import { EvidenciaResponseDto } from 'src/evidencia/dto/evidencia-response.dto';
import { MisReportesResponseDto } from './dto/mis-reportes-response.dto';

/** Todo reporte nace en este estado y espera a que un admin lo modere. */
const ESTADO_INICIAL = 'pendiente';

/**
 * Reglas de negocio de los reportes de fraude.
 *
 * No sabe de HTTP ni de SQL: recibe DTOs ya validados, habla con los
 * repositories y regresa `ReporteResponseDto`. Los errores de negocio se
 * expresan como excepciones de Nest para que el controller no tenga que
 * traducirlas.
 *
 * Ciclo de vida: un reporte nace `pendiente`; mientras lo está, solo su dueño
 * puede editarlo o borrarlo. Un admin lo modera (`aprobado` o `rechazado`) y
 * desde ahí queda congelado. En las listas, un usuario normal solo ve reportes
 * `aprobado`; sus propios pendientes solo los ve pidiéndolos por id.
 */
@Injectable()
export class ReporteService {
  constructor(
    private readonly repository: ReporteRepository,
    private readonly estadoRepository: EstadoRepository,
    private readonly riesgoRepository: RiesgoRepository,
    private readonly categoriaRepository: CategoriaRepository,
    private readonly reporteCategoriaRepository: ReporteCategoriaRepository,
    private readonly likeRepository: ReporteLikeRepository,
    private readonly usuarioRepository: UsuarioRepository,
    @Inject(forwardRef(() => EvidenciaRepository))
    private readonly evidenciaRepository: EvidenciaRepository,
  ) {}

  /**
   * Crea un reporte en estado `pendiente` a nombre de quien lo pide.
   * @param userID - `sub` del token; queda como dueño (`perteneceA`).
   * @param dto - Título e ids de categorías, ya validados por el `ValidationPipe`.
   * @returns El reporte guardado, sin `perteneceA`. Aquí `categorias` trae los
   *   ids que se mandaron; en las lecturas trae nombres.
   * @throws NotFoundException si alguna categoría no existe.
   * @throws InternalServerErrorException si en la BD falta el estado `pendiente` (corre `db/seed.sql`).
   */
  async create(userID: string, dto: CreateReporteDto): Promise<ReporteResponseDto> {
    // Antes estaba dentro de un try/catch vacío que se tragaba el error.
    this.checkReporte(dto);

    const estadoInicial = await this.estadoRepository.findByNombre(ESTADO_INICIAL);
    if (!estadoInicial) {
      throw new InternalServerErrorException('Error de configuración del servidor');
    }
    await this.validarCategorias(dto.categorias);

    const reporte = await this.repository.save({
      titulo: dto.titulo,
      perteneceA: userID,
      tieneEstado: estadoInicial.id,
    });
    await this.reporteCategoriaRepository.agregarVarias(reporte.id, dto.categorias);
    const response = ReporteResponseDto.fromEntity(reporte, { incluirDueno: false });
    response.categorias = dto.categorias;

    return response;
  }


  /**
   * Lista reportes según el rol de quien pregunta.
   * @param userID - `sub` del token; se usa para calcular `yaDiLike`.
   * @param rolNombre - `rolNombre` del token.
   * @returns Admin: todos, más recientes primero y con `perteneceA`.
   *   Cualquier otro rol: solo los `aprobado`, más viejos primero y sin `perteneceA`.
   */
  async findAll(userID: string, rolNombre: string): Promise<ReporteResponseDto[]> {
    let reportes: Reporte[];

    if (rolNombre === 'admin') {
      reportes = await this.repository.findAll();
    } else {
      const aprobado = await this.estadoRepository.findByNombre('aprobado');
      if (!aprobado) {
        throw new InternalServerErrorException('Error de configuración del servidor');
      }
      reportes = await this.repository.findAllByEstado(aprobado.id);
    }

    return Promise.all(
      reportes.map((reporte) => this.completarDto(reporte, rolNombre === 'admin', userID)),
    );
  }

  /**
   * Busca un reporte por id. Admin y dueño lo ven en cualquier estado; los
   * demás, solo si está `aprobado`.
   * @param userID - `sub` del token.
   * @param rolNombre - `rolNombre` del token.
   * @param id - UUID del reporte.
   * @throws NotFoundException si no hay reporte con ese id.
   * @throws NotFoundException si no es tuyo y no está aprobado (igual que si no existiera).
   */
  async findOne(userID: string, rolNombre: string, id: string): Promise<ReporteResponseDto> {
    const reporte = await this.obtenerReporte(id);
    const esAdmin = rolNombre === 'admin';
    const esDueno = reporte.perteneceA === userID;
    if (!esAdmin && !esDueno) {
      const aprobado = await this.estadoRepository.findByNombre('aprobado');
      if (!aprobado) {
        throw new InternalServerErrorException('Error de configuración del servidor');
      }
      // 404 y no 403: un 403 confirmaría que el reporte existe.
      if (reporte.tieneEstado !== aprobado.id) {
        throw new NotFoundException('Reporte no encontrado');
      }
    }
    return this.completarDto(reporte, esAdmin, userID);
  }

  /**
   * Edita título y/o categorías de un reporte propio que siga `pendiente`.
   * Si vienen `categorias`, reemplazan a todas las anteriores; lo que no venga
   * se conserva.
   * @param userID - `sub` del token; debe ser el dueño.
   * @param id - UUID del reporte.
   * @param changes - `titulo` y/o `categorias` (ids).
   * @returns El reporte actualizado, sin `perteneceA`. `categorias` trae los ids
   *   si se mandaron; si no, los nombres actuales.
   * @throws NotFoundException si no existe el reporte, no es tuyo o alguna categoría no existe.
   * @throws BadRequestException si el reporte ya fue moderado.
   */
  async update(userID: string, id: string, changes: UpdateReporteDto): Promise<ReporteResponseDto> {
    // Valida que sea tuyo y que siga en "pendiente"
    await this.obtenerReportePropio(userID, id);

    if (changes.categorias) {
      await this.validarCategorias(changes.categorias);
      await this.reporteCategoriaRepository.eliminarTodas(id);
      await this.reporteCategoriaRepository.agregarVarias(id, changes.categorias);
    }

    if (changes.titulo) {
      await this.repository.update(id, { titulo: changes.titulo });
    }

    // Descripción y número/enlace viven en la evidencia
    if (changes.descripcion !== undefined || changes.url !== undefined) {
      const [evidencia] = await this.evidenciaRepository.findByReporteId(id);
      if (evidencia) {
        await this.evidenciaRepository.actualizarTexto(evidencia.id, {
          descripcion: changes.descripcion,
          url: changes.url,
        });
      }
    }

    const actualizado = (await this.repository.findById(id))!;
    return this.completarDto(actualizado, true, userID);
  }

  /**
   * Borra un reporte propio que siga `pendiente`. Es definitivo: no hay papelera.
   * La BD borra en cascada sus evidencias, likes y categorías; aquí además se
   * borran del disco (`uploads/`) las fotos de sus evidencias.
   * @param userID - `sub` del token; debe ser el dueño.
   * @param id - UUID del reporte.
   * @throws NotFoundException si no hay reporte con ese id o no es tuyo.
   * @throws BadRequestException si el reporte ya fue moderado.
   */
  async remove(userID: string, id: string): Promise<void> {
    await this.obtenerReportePropio(userID, id);
    // Se leen antes de borrar: la cascada se lleva las filas y ya no sabríamos qué fotos quitar del disco.
    const evidencias = await this.evidenciaRepository.findByReporteId(id);
    await this.repository.delete(id);
    await Promise.all(evidencias.filter((e) => e.foto).map((e) => unlink(join('uploads', e.foto)).catch(() => undefined)));
  }

  /**
   * Cola de moderación: reportes en `pendiente`, más viejos primero y con
   * `perteneceA`. El controller la protege con `@Roles('admin')`.
   */
  async listarPendientes(): Promise<ReporteResponseDto[]> {
    const pendiente = await this.estadoRepository.findByNombre(ESTADO_INICIAL);
    if (!pendiente) {
      throw new InternalServerErrorException('Error de configuración del servidor');
    }
    const reportes = await this.repository.findAllByEstado(pendiente.id);

    return Promise.all(reportes.map((r) => this.completarDto(r, true)));
  }


  /**
   * Modera un reporte `pendiente`: le pone el estado que mande el admin
   * (normalmente `aprobado` o `rechazado`). Si es `aprobado`, guarda `fecha_aprob`.
   *
   * Ojo: `dto.tieneRiesgo` se valida en el DTO, pero hoy **no se guarda**.
   * @param id - UUID del reporte.
   * @param dto - Ids del nuevo estado y del nivel de riesgo.
   * @returns El reporte actualizado, con `perteneceA`; `categorias`,
   *   `evidencias` y likes vienen vacíos.
   * @throws NotFoundException si no existe el reporte o el estado.
   * @throws BadRequestException si el reporte ya fue moderado.
   */
  async moderar(id: string, dto: ModerarReporteDto): Promise<ReporteResponseDto> {
    const reporte = await this.obtenerReporte(id);

    const pendiente = await this.estadoRepository.findByNombre('pendiente');
    if (reporte.tieneEstado !== pendiente?.id) {
      throw new BadRequestException('Este reporte ya fue moderado');
    }

    const nuevoEstado = await this.estadoRepository.findById(dto.tieneEstado);
    if (!nuevoEstado) throw new NotFoundException('El estado no existe.');
    await this.validarRiesgo(dto.tieneRiesgo);

    const cambios: Partial<Reporte> = { tieneEstado: dto.tieneEstado, tieneRiesgo: dto.tieneRiesgo };
    if (nuevoEstado.nombre === 'aprobado') {
      cambios.fecha_aprob = new Date(); 
    }

    const updated = (await this.repository.update(id, cambios))!;
    return ReporteResponseDto.fromEntity(updated, { incluirDueno: true });
  }

  /**
   * Marca "me pasó igual" de un usuario en un reporte. Dar like dos veces
   * cuenta como uno: la tabla `reporte_like` tiene llave primaria usuario + reporte.
   * @param userID - `sub` del token.
   * @param id - UUID del reporte.
   * @returns El total de likes del reporte y `yaDiLike: true`.
   * @throws NotFoundException si no hay reporte con ese id.
   */
  async darLike(userID: string, id: string): Promise<{ mePasoIgualCount: number; yaDiLike: boolean }> {
    const reporte = await this.obtenerReporte(id);
    if (reporte.perteneceA === userID) {
      throw new ForbiddenException('No puedes marcar "me pasó igual" en tu propio reporte');
    }
    await this.likeRepository.agregar(userID, id);
    return {
      mePasoIgualCount: await this.likeRepository.contar(id),
      yaDiLike: true,
    };
  }
 
  /**
   * Quita el "me pasó igual". Si el usuario no había dado like, no pasa nada.
   * @param userID - `sub` del token.
   * @param id - UUID del reporte.
   * @returns El total de likes del reporte y `yaDiLike: false`.
   * @throws NotFoundException si no hay reporte con ese id.
   */
  async quitarLike(userID: string, id: string): Promise<{ mePasoIgualCount: number; yaDiLike: boolean }> {
    await this.obtenerReporte(id);
    await this.likeRepository.eliminar(userID, id);
    return {
      mePasoIgualCount: await this.likeRepository.contar(id),
      yaDiLike: false,
    };
  }
 
    async listarMios(userID: string): Promise<MisReportesResponseDto> {
    const reportes = await this.repository.findAllByUsuario(userID);
    const estados = await this.estadoRepository.findAll();
    const nombreEstado = new Map(estados.map((e) => [e.id, e.nombre]));

    const lista = await Promise.all(
      reportes.map(async (r) => {
        const dto = await this.completarDto(r, false, userID);
        dto.estado = nombreEstado.get(r.tieneEstado);
        return dto;
      }),
    );

    return {
      totalReportes: lista.length,
      aportes: await this.likeRepository.contarPorUsuarioEnOtros(userID),
      reportes: lista,
    };
  }
  
  /**
   * Arma el DTO completo de lectura: categorías (por nombre), evidencias,
   * nombre del autor, total de likes y si `userID` ya dio like.
   * @param incluirDueno - Solo los admins reciben `perteneceA`.
   * @param userID - Sin él, `yaDiLike` siempre es `false`.
   */
  private async completarDto(
    reporte: Reporte,
    incluirDueno: boolean,
    userID?: string,
  ): Promise<ReporteResponseDto> {
    const dto = ReporteResponseDto.fromEntity(reporte, { incluirDueno });
 
    dto.categorias = await this.reporteCategoriaRepository.findCategorias(reporte.id);
 
    const evidencias = await this.evidenciaRepository.findByReporteId(reporte.id);
    dto.evidencias = evidencias.map((e) => EvidenciaResponseDto.fromEntity(e));
 
    dto.autor = reporte.perteneceA ? ((await this.usuarioRepository.findById(reporte.perteneceA))?.nombre ?? 'Anónimo')
    : 'Usuario eliminado';
 
    dto.mePasoIgualCount = await this.likeRepository.contar(reporte.id);
    dto.yaDiLike = userID ? await this.likeRepository.existe(userID, reporte.id) : false;
    dto.esMio = userID ? reporte.perteneceA === userID : false;
    
    if (reporte.tieneRiesgo) {
      const riesgo = await this.riesgoRepository.findById(reporte.tieneRiesgo);
      dto.riesgo = riesgo?.nombre ?? null;
    }

    return dto;
  }

  /** Regla de negocio: un reporte necesita al menos una categoría (400, no 500). */
  private checkReporte(data: CreateReporteDto | undefined): void {
    if (!data) {
      throw new BadRequestException('Faltan los datos del reporte');
    }
    if (!Array.isArray(data.categorias) || data.categorias.length === 0) {
      throw new BadRequestException('El reporte necesita al menos una categoría');
    }
  }

  /** Revisa todas las categorías en paralelo en lugar de un await por cada una. */
  private async validarCategorias(categoriaIds: string[]): Promise<void> {
    const categorias = await Promise.all(
      categoriaIds.map((categoriaId) => this.categoriaRepository.findById(categoriaId)),
    );
    if (categorias.some((categoria) => !categoria)) {
      throw new NotFoundException('La categoría no existe');
    }
  }

  /** @throws NotFoundException si no hay reporte con ese id. */
  private async obtenerReporte(id: string): Promise<Reporte> {
    const reporte = await this.repository.findById(id);
    if (!reporte) {
      throw new NotFoundException(`Reporte ${id} no encontrado`);
    }
    return reporte;
  }

  /**
   * Regla de edición: solo el dueño, y solo mientras el reporte sigue
   * `pendiente`; ya moderado queda congelado.
   * La base decide si es tuyo (`WHERE id = ? AND perteneceA = ?`).
   * @throws NotFoundException si no existe o no es de `userID` (mismo 404 para los dos).
   * @throws BadRequestException si ya fue moderado.
   */
  private async obtenerReportePropio(userID: string, id: string): Promise<Reporte> {
    const reporte = await this.repository.findByIdAndOwner(id, userID);
    if (!reporte) {
      throw new NotFoundException('Reporte no encontrado');
    }
    const pendiente = await this.estadoRepository.findByNombre('pendiente');
    if (reporte.tieneEstado !== pendiente?.id) {
      throw new BadRequestException('No puedes modificar un reporte que ya fue moderado');
    }
    return reporte;
  }

  private async validarRiesgo(riesgoId: string): Promise<void> {
    const riesgo = await this.riesgoRepository.findById(riesgoId);
    if (!riesgo) {
      throw new NotFoundException('El riesgo no existe.');
    }
  }
}