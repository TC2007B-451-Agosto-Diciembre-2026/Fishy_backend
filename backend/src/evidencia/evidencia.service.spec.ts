import { jest } from '@jest/globals';
import { EvidenciaService } from './evidencia.service';
import { EvidenciaResponseDto } from './dto/evidencia-response.dto';

describe('HU04- Consultar enlace', () => {
  let service: EvidenciaService;

  const evidencia = {
    id: 'evidencia-123',
    url: 'https://example.com/scam',
    foto: '',
    fecha_creado: new Date('2026-09-29T21:07:12.000Z'),
    perteneceAReporte: 'reporte-123',
    descripcion: 'Enlace sospechoso',
  };
  const evidenciaRepository = {
    buscaEnlaceAprobado: jest.fn<
    (url: string, estadoAprobadoId: string) => Promise<typeof evidencia | undefined>
    >(),
  };
  const reporteRepository = {};

  const estadoRepository = { 
    findByNombre: jest.fn<
    (nombre: string) => Promise<{ id: string; nombre: string } | undefined>
    >(),
  };


  beforeEach(() => {
    jest.clearAllMocks();

    service = new EvidenciaService(
      evidenciaRepository as any,
      reporteRepository as any,
      estadoRepository as any,
    );
  });

  it('test_cp01_busqueda_exitosa', async () => {
    estadoRepository.findByNombre.mockResolvedValue({
      id: 'estado-aprobado',
      nombre: 'aprobado',
    });

    evidenciaRepository.buscaEnlaceAprobado.mockResolvedValue(evidencia);

    const resultado = await service.buscaEnlaceAprobado(
      '  https://example.com/scam  ',
    );

    expect(estadoRepository.findByNombre).toHaveBeenCalledWith('aprobado');
    expect(evidenciaRepository.buscaEnlaceAprobado).toHaveBeenCalledWith(
      'https://example.com/scam',
      'estado-aprobado',
    );
    expect(resultado).toEqual(EvidenciaResponseDto.fromEntity(evidencia));
  });

  it('test_cp02_busqueda_sin_resultados', async () => {
    estadoRepository.findByNombre.mockResolvedValue({
      id: 'estado-aprobado',
      nombre: 'aprobado',
    });

    evidenciaRepository.buscaEnlaceAprobado.mockResolvedValue(undefined);

    const resultado = await service.buscaEnlaceAprobado(
      'https://no-existe.example',
    );

    expect(resultado).toBeNull();
  });

  it('test_cp03_url_vacia', async () => {
    const resultado = await service.buscaEnlaceAprobado('   ');

    expect(resultado).toBeNull();
    expect(estadoRepository.findByNombre).not.toHaveBeenCalled();
    expect(evidenciaRepository.buscaEnlaceAprobado).not.toHaveBeenCalled();
  });

  it('test_cp04_estado_no_existe', async () => {
    estadoRepository.findByNombre.mockResolvedValue(undefined);

    await expect(
      service.buscaEnlaceAprobado('https://example.com/scam'),
    ).rejects.toThrow('Error de configuración del servidor');

    expect(evidenciaRepository.buscaEnlaceAprobado).not.toHaveBeenCalled();
  });
});
