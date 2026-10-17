import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import { unlink } from 'node:fs/promises';
import { extname } from 'node:path';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { JwtPayload } from '../auth/jwt';
import { EvidenciaService } from './evidencia.service';
import { EvidenciaResponseDto } from './dto/evidencia-response.dto';
import { CreateEvidenciaDto } from './dto/create-evidencia.dto';
import { UpdateEvidenciaDto } from './dto/update-evidencia.dto';

const EXTENSIONES_PERMITIDAS = ['.png', '.jpg', '.jpeg', '.webp'];
const limitSize = 5 * 1024 * 1024; 

@ApiTags('evidencias')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Falta el token, es inválido o expiró',
})
@UseGuards(AuthGuard)
@Controller('evidencias')
export class EvidenciaController {
  constructor(private readonly service: EvidenciaService) {}

  @Post()
  @ApiOperation({ summary: 'Agregar una evidencia a un reporte propio' })
  @ApiResponse({ status: 201, type: EvidenciaResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'No existe el reporte' })
  crear(@CurrentUser() user: JwtPayload, @Body() dto: CreateEvidenciaDto): Promise<EvidenciaResponseDto> {
    return this.service.crear(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar evidencias (admin: todas; usuario: solo de reportes aprobados)' })
  @ApiResponse({ status: 200, type: [EvidenciaResponseDto] })
  listar(@CurrentUser() user: JwtPayload): Promise<EvidenciaResponseDto[]> {
    return this.service.listar(user.rolNombre);
  }

  @Get('consultar-enlace')
  @ApiOperation({ summary: 'Consultar si un enlace aparece en evidencias de reportes aprobados' })
  @ApiResponse({ status: 200, type: EvidenciaResponseDto, description: 'Evidencia encontrada o null si no hay coincidencias' })
  buscarEnlace(@Query('url') url: string): Promise<EvidenciaResponseDto | null> {
    if (!url?.trim()) {
      throw new BadRequestException('Debes proporcionar una URL');
    }

    return this.service.buscaEnlaceAprobado(url);
  }


  @Get(':id')
  @ApiOperation({ summary: 'Ver una evidencia' })
  @ApiResponse({ status: 200, type: EvidenciaResponseDto })
  @ApiResponse({ status: 404, description: 'No existe una evidencia con ese id' })
  obtener(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<EvidenciaResponseDto> {
    return this.service.obtener(user.sub, user.rolNombre, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Editar url o descripción de una evidencia propia' })
  @ApiResponse({ status: 200, type: EvidenciaResponseDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 404, description: 'No existe una evidencia con ese id' })
  actualizar(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdateEvidenciaDto,
  ): Promise<EvidenciaResponseDto> {
    return this.service.actualizar(user.sub, id, dto);
  }
  @Post(':id/photo')
  @UseInterceptors(
  FileInterceptor('photo', {
    storage: diskStorage({
      destination: 'uploads',
      // Nombre aleatorio: dos "foto.png" ya no se sobrescriben y el nombre no se puede adivinar.
      filename: (_req, file, cb) => cb(null, randomUUID() + extname(file.originalname).toLowerCase()),
    }),
    // Sin límite, un archivo enorme llena el disco.
    limits: { fileSize: limitSize },
    // Solo imágenes: el mimetype lo manda el cliente, así que también se revisa la extensión.
    // Así un hola.html ya no se puede subir y servir como página (XSS almacenado).
    fileFilter: (_req, file, cb) => {
      const extension = extname(file.originalname).toLowerCase();
      const esImagen = file.mimetype.startsWith('image/') && EXTENSIONES_PERMITIDAS.includes(extension);
      if (esImagen) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Solo se permiten imágenes png, jpg, jpeg o webp'), false);
      }
    },
  }),
  )
  
  @ApiOperation({ summary: 'Subir o reemplazar la foto de una evidencia' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { photo: { type: 'string', format: 'binary' } },
      required: ['photo'],
    },
  })
  @ApiResponse({ status: 201, type: EvidenciaResponseDto })
  @ApiResponse({ status: 400, description: 'No vino el campo photo' })
  @ApiResponse({ status: 404, description: 'No existe una evidencia con ese id' })
  async uploadPhoto(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<EvidenciaResponseDto> {
    if (!file) throw new BadRequestException('Falta el campo photo');
    try {
      return await this.service.setPhoto(user.sub, id, file);
    } catch (error) {
      await unlink(file.path).catch(() => undefined);
      throw error;
    }
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Borrar una evidencia propia (y su foto)' })
  @ApiResponse({ status: 204, description: 'Borrada; sin cuerpo' })
  @ApiResponse({ status: 404, description: 'No existe una evidencia con ese id' })
  eliminar(@CurrentUser() user: JwtPayload, @Param('id') id: string): Promise<void> {
    return this.service.eliminar(user.sub, id);
  }
}