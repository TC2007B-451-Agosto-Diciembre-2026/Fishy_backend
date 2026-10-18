import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { RolModule } from './rol/rol.module';
import { UsuarioModule } from './usuario/usuario.module';
import { CategoriaModule } from './categoria/categoria.module';
import { EstadoModule } from './estado/estado.module';
import { ReporteModule } from './reporte/reporte.module';
import { RiesgoModule } from './riesgo/riesgo.module';
import { EvidenciaModule } from './evidencia/evidencia.module';
import { LecturaModule } from './lecturas/lectura.module';
import { ComentarioModule } from './comentario/comentario.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Configuración base del límite de peticiones; el login la endurece con @Throttle.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    EstadoModule,
    CategoriaModule,
    DatabaseModule,
    RolModule,
    UsuarioModule,
    ReporteModule,
    RiesgoModule,
    EvidenciaModule,
    LecturaModule,
    ComentarioModule,
  ],
})
export class AppModule {}