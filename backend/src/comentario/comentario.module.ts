import { Module } from '@nestjs/common';
import { ReporteModule } from '../reporte/reporte.module';
import { EstadoModule } from '../estado/estado.module';
import { ComentarioController } from './comentario.controller';
import { ComentarioService } from './comentario.service';
import { ComentarioRepository } from './comentario.repository';

@Module({
  imports: [ReporteModule, EstadoModule],
  controllers: [ComentarioController],
  providers: [ComentarioService, ComentarioRepository],
})
export class ComentarioModule {}