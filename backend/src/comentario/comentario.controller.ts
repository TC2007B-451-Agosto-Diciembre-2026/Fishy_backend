import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt';
import { ComentarioService } from './comentario.service';
import { CreateComentarioDto } from './dto/create-comentario.dto';
import { UpdateComentarioDto } from './dto/update-comentario.dto';
import { ComentarioResponseDto } from './dto/comentario-response.dto';

@ApiTags('comentarios')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Falta el token, es inválido o expiró',
})
@UseGuards(AuthGuard)
@Controller('reportes/:reporteId/comentarios')
export class ComentarioController {
  constructor(private readonly service: ComentarioService) {}

  @Post()
  @ApiOperation({ summary: 'Comentar un reporte aprobado' })
  @ApiResponse({ status: 201, type: ComentarioResponseDto })
  @ApiResponse({ status: 400, description: 'Texto inválido o el reporte no está aprobado' })
  @ApiResponse({ status: 403, description: 'El reporte no es tuyo y no está aprobado' })
  @ApiResponse({ status: 404, description: 'No existe un reporte con ese id' })
  create(@CurrentUser() user: JwtPayload, @Param('reporteId') reporteId: string, @Body() dto: CreateComentarioDto): Promise<ComentarioResponseDto> {
    return this.service.create(user.sub, user.rolNombre, reporteId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar los comentarios de un reporte (más antiguos primero)' })
  @ApiResponse({ status: 200, type: [ComentarioResponseDto] })
  @ApiResponse({ status: 403, description: 'El reporte no es tuyo y no está aprobado' })
  @ApiResponse({ status: 404, description: 'No existe un reporte con ese id' })
  findAll(@CurrentUser() user: JwtPayload, @Param('reporteId') reporteId: string): Promise<ComentarioResponseDto[]> {
    return this.service.findByReporte(user.sub, user.rolNombre, reporteId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar un comentario propio' })
  @ApiResponse({ status: 200, type: ComentarioResponseDto })
  @ApiResponse({ status: 400, description: 'Texto inválido' })
  @ApiResponse({ status: 403, description: 'El comentario no es tuyo' })
  @ApiResponse({ status: 404, description: 'No existe el comentario en ese reporte' })
  update( @CurrentUser() user: JwtPayload, @Param('reporteId') reporteId: string, @Param('id') id: string, @Body() dto: UpdateComentarioDto): Promise<ComentarioResponseDto> {
    return this.service.update(user.sub, reporteId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar un comentario propio (el admin puede borrar cualquiera)' })
  @ApiResponse({ status: 204, description: 'Borrado; sin cuerpo' })
  @ApiResponse({ status: 403, description: 'No eres el autor ni admin' })
  @ApiResponse({ status: 404, description: 'No existe el comentario en ese reporte' })
  remove(@CurrentUser() user: JwtPayload, @Param('reporteId') reporteId: string, @Param('id') id: string): Promise<void> {
    return this.service.remove(user.sub, user.rolNombre, reporteId, id);
  }
}