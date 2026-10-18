import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt';
import { ReporteService } from './reporte.service';
import { ReporteResponseDto } from './dto/reporte-response.dto';
import { CreateReporteDto } from './dto/create-reporte.dto';
import { UpdateReporteDto } from './dto/update-reporte.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';
import { ModerarReporteDto } from './dto/admin-reporte.dto';
import { MisReportesResponseDto } from './dto/mis-reportes-response.dto';
import {EstadisticaCategoriaDto} from './dto/estadistica-categoria.dto';

@ApiTags('reportes')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Falta el token, es inválido o expiró',
})
@UseGuards(AuthGuard)
@Controller('reportes')
export class ReporteController{
  constructor(private readonly service: ReporteService) {}

  @Post()
  // Límite de tamaño: sin él, un archivo enorme se queda en memoria.
  @UseInterceptors(FileInterceptor('foto', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Crear un reporte (nace pendiente)' })
  @ApiResponse({ status: 201, description: 'Reporte creado', type: ReporteResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'Alguna categoría no existe' })
  create(@CurrentUser() user: JwtPayload, @Body() dto:CreateReporteDto, @UploadedFile() foto: Express.Multer.File):Promise<ReporteResponseDto> {

    return this.service.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar reportes (admin: todos; usuario: solo aprobados)' })
  @ApiResponse({ status: 200, type: [ReporteResponseDto] })
  findAll(@CurrentUser() user: JwtPayload): Promise<ReporteResponseDto[]> {
    return this.service.findAll(user.sub, user.rolNombre);
  }

  @Get('pendientes')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Cola de moderación: reportes pendientes (solo admin)' })
  @ApiResponse({ status: 200, type: [ReporteResponseDto] })
  @ApiResponse({ status: 403, description: 'Requiere rol admin' })
  listarPendientes(): Promise<ReporteResponseDto[]> {
    return this.service.listarPendientes()
  }
  
  @Get('mios')
  @ApiOperation({ summary: 'Mis reportes (todos los estados) y mis estadísticas' })
  @ApiResponse({ status: 200, type: MisReportesResponseDto })
  listarMios(@CurrentUser() user: JwtPayload): Promise<MisReportesResponseDto> {
    return this.service.listarMios(user.sub);
  }
  
  @Get('estadisticas')
  estadisticas(): Promise<EstadisticaCategoriaDto[]> {
    return this.service.estadisticas();
  } 

  @Get(':id')
  @ApiOperation({ summary: 'Ver un reporte' })
  @ApiResponse({ status: 200, type: ReporteResponseDto })
  @ApiResponse({ status: 404, description: 'No existe el reporte (o no puedes verlo: mismo 404)' })
  findOne(@Param('id') id:string, @CurrentUser() user: JwtPayload): Promise<ReporteResponseDto> {
    return this.service.findOne(user.sub, user.rolNombre, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar título o categorías de un reporte propio pendiente' })
  @ApiResponse({ status: 200, type: ReporteResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o el reporte ya fue moderado' })
  @ApiResponse({ status: 404, description: 'No existe el reporte o alguna categoría' })
  update(@CurrentUser() user: JwtPayload, @Param('id') id:string, @Body() dto: UpdateReporteDto,
  ): Promise<ReporteResponseDto> {
    return this.service.update(user.sub, id,dto);
  }

  @Patch(':id/moderar')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Moderar un reporte pendiente: aprobar o rechazar (solo admin)' })
  @ApiResponse({ status: 200, type: ReporteResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos o el reporte ya fue moderado' })
  @ApiResponse({ status: 403, description: 'Requiere rol admin' })
  @ApiResponse({ status: 404, description: 'No existe el reporte o el estado' })
  moderar(@Param('id') id:string, @Body() dto: ModerarReporteDto): Promise<ReporteResponseDto> {
    return this.service.moderar(id,dto);
  }

    @Post(':id/like')
  @HttpCode(200)
  @ApiOperation({ summary: 'Marcar "me pasó igual"' })
  @ApiResponse({ status: 200, schema: { example: { mePasoIgualCount: 4, yaDiLike: true } } })
  @ApiResponse({ status: 404, description: 'No existe el reporte (o no puedes verlo: mismo 404)' })
  darLike(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.darLike(user.sub, id);
  }
 
  @Delete(':id/like')
  @HttpCode(200)
  @ApiOperation({ summary: 'Quitar "me pasó igual"' })
  @ApiResponse({ status: 200, schema: { example: { mePasoIgualCount: 3, yaDiLike: false } } })
  @ApiResponse({ status: 404, description: 'No existe el reporte (o no puedes verlo: mismo 404)' })
  quitarLike(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.service.quitarLike(user.sub, id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar un reporte propio pendiente' })
  @ApiResponse({ status: 204, description: 'Borrado; sin cuerpo' })
  @ApiResponse({ status: 400, description: 'El reporte ya fue moderado' })
  @ApiResponse({ status: 404, description: 'No existe el reporte (o no puedes verlo: mismo 404)' })
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string):Promise<void> {
    return this.service.remove(user.sub, id);
  }
}