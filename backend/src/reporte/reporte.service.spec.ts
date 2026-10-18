
import { jest } from '@jest/globals';
import { ReporteService } from './reporte.service';
import { ReporteRepository } from './reporte.repository';
import { EstadoRepository } from '../estado/estado.repository';
import { RiesgoRepository } from '../riesgo/riesgo.repository';
import { CategoriaRepository } from '../categoria/categoria.repository';
import { ReporteCategoriaRepository } from './reporte-categoria.repository';
import { ReporteLikeRepository } from './reporte-like.repository';
import { UsuarioRepository } from '../usuario/usuario.repository';
import { EvidenciaRepository } from '../evidencia/evidencia.repository';
import { EvidenciaResponseDto } from '../evidencia/dto/evidencia-response.dto';

describe('HU07 - Ver mis reportes', () => {
  let service: ReporteService;

  const repository = {
    findAllByUsuario: jest.fn<(...args: any[]) => Promise<any>>(),
    findById: jest.fn<(...args: any[]) => Promise<any>>(),
    findByNombre: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const estadoRepository = {
    findAll: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const riesgoRepository = {
    findById: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const categoriaRepository = {};

  const reporteCategoriaRepository = {
    findCategorias: jest.fn<(...args: any[]) => Promise<any>>(),
  };
  //HOLAAA
  const likeRepository = {
    contarPorUsuarioEnOtros: jest.fn<(...args: any[]) => Promise<any>>(),
    contar: jest.fn<(...args: any[]) => Promise<any>>(),
    existe: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const usuarioRepository = {
    findById: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const evidenciaRepository = {
    findByReporteId: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ReporteService(
      repository as unknown as ReporteRepository,
      estadoRepository as unknown as EstadoRepository,
      riesgoRepository as unknown as RiesgoRepository,
      categoriaRepository as unknown as CategoriaRepository,
      reporteCategoriaRepository as unknown as ReporteCategoriaRepository,
      likeRepository as unknown as ReporteLikeRepository,
      usuarioRepository as unknown as UsuarioRepository,
      evidenciaRepository as unknown as EvidenciaRepository,
    );
  });

  it('test_cp01_lista_los_reportes_del_usuario', async () => {
    repository.findAllByUsuario.mockResolvedValue([
      {
        id: 'REP-001',
        titulo: 'Mensaje sospechoso',
        perteneceA: 'U-001',
        tieneEstado: 'EST-001',
        tieneRiesgo: null,
        fecha_pub: new Date('2024-06-14T10:00:00Z'),
        fecha_update: new Date('2024-06-14T10:00:00Z'),
        fecha_aprob: null,
      },
    ]);

    estadoRepository.findAll.mockResolvedValue([
      { id: 'EST-001', nombre: 'pendiente' },
    ]);

    likeRepository.contarPorUsuarioEnOtros.mockResolvedValue(3);
    reporteCategoriaRepository.findCategorias.mockResolvedValue(['SMS']);
    evidenciaRepository.findByReporteId.mockResolvedValue([]);
    usuarioRepository.findById.mockResolvedValue({
      id: 'U-001',
      nombre: 'Ana',
    });
    likeRepository.contar.mockResolvedValue(2);
    likeRepository.existe.mockResolvedValue(false);

    const resultado = await service.listarMios('U-001');

    expect(resultado.totalReportes).toBe(1);
    expect(resultado.aportes).toBe(3);
    expect(resultado.reportes).toHaveLength(1);
    expect(resultado.reportes[0].titulo).toBe('Mensaje sospechoso');
    expect(resultado.reportes[0].estado).toBe('pendiente');

    expect(repository.findAllByUsuario).toHaveBeenCalledWith('U-001');
    expect(likeRepository.contarPorUsuarioEnOtros).toHaveBeenCalledWith('U-001');
  });

  it('test_cp02_usuario_sin_reportes', async () => {
    repository.findAllByUsuario.mockResolvedValue([]);
    estadoRepository.findAll.mockResolvedValue([]);
    likeRepository.contarPorUsuarioEnOtros.mockResolvedValue(0);

    const resultado = await service.listarMios('U-002');

    expect(resultado.totalReportes).toBe(0);
    expect(resultado.aportes).toBe(0);
    expect(resultado.reportes).toEqual([]);
    expect(repository.findAllByUsuario).toHaveBeenCalledWith('U-002');
  });
});

describe('HU08 - Consultar detalle de un reporte', () => {
  let service: ReporteService;

  const repository = {
    findById: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const estadoRepository = {
    findByNombre: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const riesgoRepository = {
    findById: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const categoriaRepository = {};

  const reporteCategoriaRepository = {
    findCategorias: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const likeRepository = {
    contarPorUsuarioEnOtros: jest.fn<(...args: any[]) => Promise<any>>(),
    contar: jest.fn<(...args: any[]) => Promise<any>>(),
    existe: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const usuarioRepository = {
    findById: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  const evidenciaRepository = {
    findByReporteId: jest.fn<(...args: any[]) => Promise<any>>(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new ReporteService(
      repository as unknown as ReporteRepository,
      estadoRepository as unknown as EstadoRepository,
      riesgoRepository as unknown as RiesgoRepository,
      categoriaRepository as unknown as CategoriaRepository,
      reporteCategoriaRepository as unknown as ReporteCategoriaRepository,
      likeRepository as unknown as ReporteLikeRepository,
      usuarioRepository as unknown as UsuarioRepository,
      evidenciaRepository as unknown as EvidenciaRepository,
    );
  });

  it('test_cp01_consulta_detalle_de_reporte_aprobado', async () => {
    repository.findById.mockResolvedValue({
      id: 'REP-001',
      titulo: 'Mensaje sospechoso',
      perteneceA: 'U-002',
      tieneEstado: 'EST-APROBADO',
      tieneRiesgo: null,
      fecha_pub: new Date('2026-10-14T10:00:00Z'),
      fecha_update: new Date('2026-10-14T10:00:00Z'),
      fecha_aprob: new Date('2026-10-14T10:30:00Z'),
    });

    estadoRepository.findByNombre.mockResolvedValue({
      id: 'EST-APROBADO',
      nombre: 'aprobado',
    });

    reporteCategoriaRepository.findCategorias.mockResolvedValue(['SMS']);
    evidenciaRepository.findByReporteId.mockResolvedValue([]);
    usuarioRepository.findById.mockResolvedValue({
      id: 'U-002',
      nombre: 'Ana',
    });
    likeRepository.contar.mockResolvedValue(2);
    likeRepository.existe.mockResolvedValue(false);

    const resultado = await service.findOne(
      'U-001',
      'usuario',
      'REP-001',
    );

    expect(resultado.id).toBe('REP-001');
    expect(resultado.titulo).toBe('Mensaje sospechoso');
    expect(resultado.categorias).toEqual(['SMS']);
    expect(repository.findById).toHaveBeenCalledWith('REP-001');
    expect(estadoRepository.findByNombre).toHaveBeenCalledWith('aprobado');
  });

  it('test_cp02_reporte_inexistente', async () => {
    repository.findById.mockResolvedValue(null);

    await expect(
      service.findOne('U-001', 'usuario', 'REP-999'),
    ).rejects.toThrow('Reporte REP-999 no encontrado');

    expect(repository.findById).toHaveBeenCalledWith('REP-999');
  });

  it('test_cp03_usuario_no_puede_ver_reporte_pendiente_de_otra_persona', async () => {
    repository.findById.mockResolvedValue({
      id: 'REP-002',
      titulo: 'Reporte pendiente',
      perteneceA: 'U-002',
      tieneEstado: 'EST-PENDIENTE',
      tieneRiesgo: null,
      fecha_pub: new Date('2026-10-14T10:00:00Z'),
      fecha_update: new Date('2026-10-14T10:00:00Z'),
      fecha_aprob: null,
    });

    estadoRepository.findByNombre.mockResolvedValue({
      id: 'EST-APROBADO',
      nombre: 'aprobado',
    });

    await expect(
      service.findOne('U-001', 'usuario', 'REP-002'),
    ).rejects.toThrow(
      'No puedes ver un reporte que no es tuyo y que no está aprobado',
    );
  });
});

