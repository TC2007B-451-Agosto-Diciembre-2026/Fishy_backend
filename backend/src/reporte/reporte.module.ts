import { Module, forwardRef } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { ReporteController } from './reporte.controller';
import { ReporteRepository } from './reporte.repository';
import { ReporteService } from './reporte.service';
import { RiesgoModule } from 'src/riesgo/riesgo.module';
import { EstadoModule } from 'src/estado/estado.module';
import { AuthModule } from '../auth/auth.module';
import { RolModule } from 'src/rol/rol.module';
import { ReporteCategoriaRepository } from './reporte-categoria.repository';
import { ReporteLikeRepository } from './reporte-like.repository';
import { CategoriaModule } from 'src/categoria/categoria.module';
import { UsuarioModule } from '../usuario/usuario.module';
import { EvidenciaModule } from '../evidencia/evidencia.module';

@Module({
  imports: [
    DatabaseModule,
    EstadoModule,
    RiesgoModule,
    AuthModule,
    RolModule,
    CategoriaModule,
    UsuarioModule,
    forwardRef(() => EvidenciaModule),
  ],
  controllers: [ReporteController],
  providers: [ReporteService, ReporteRepository, ReporteCategoriaRepository, ReporteLikeRepository],
  exports: [ReporteRepository, ReporteLikeRepository],
})
export class ReporteModule {}