import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CategoriaResponseDto } from './dto/categoria-response.dto';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CategoriaService } from './categoria.service';
import { CreateCategoriaDto } from './dto/create-categoria.dto';
import { UpdateCategoriaDto } from './dto/update-categoria.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { Roles } from 'src/auth/roles.decorator';

@ApiTags('categorias')
@ApiBearerAuth()
@ApiResponse({
  status: 401,
  description: 'Falta el token, es inválido o expiró',
})
@UseGuards(AuthGuard)
@Controller('categorias')
export class CategoriaController {
    constructor(private readonly categoriaService: CategoriaService) {}

    @Get()
    @ApiOperation({ summary: 'Listar categorías' })
    @ApiResponse({ status: 200, type: [CategoriaResponseDto] })
    listar() {
        return this.categoriaService.listar();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Ver una categoría' })
    @ApiResponse({ status: 200, type: CategoriaResponseDto })
    @ApiResponse({ status: 404, description: 'No existe una categoría con ese id' })
    obtener(@Param('id') id: string) {
        return this.categoriaService.obtener(id);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Post()
    @ApiOperation({ summary: 'Crear una categoría (solo admin)' })
    @ApiResponse({ status: 201, type: CategoriaResponseDto })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 403, description: 'Requiere rol admin' })
    @ApiResponse({ status: 409, description: 'Ya existe una categoría con ese nombre' })
    crear(@Body() dto: CreateCategoriaDto) {
        return this.categoriaService.crear(dto);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Patch(':id')
    @ApiOperation({ summary: 'Renombrar una categoría (solo admin)' })
    @ApiResponse({ status: 200, type: CategoriaResponseDto })
    @ApiResponse({ status: 400, description: 'Datos inválidos' })
    @ApiResponse({ status: 403, description: 'Requiere rol admin' })
    @ApiResponse({ status: 404, description: 'No existe una categoría con ese id' })
    @ApiResponse({ status: 409, description: 'Ya existe una categoría con ese nombre' })
    actualizar(@Param('id') id: string, @Body() dto: UpdateCategoriaDto) {
        return this.categoriaService.actualizar(id, dto);
    }

    @UseGuards(RolesGuard)
    @Roles('admin')
    @Delete(':id')
    @HttpCode(204)
    @ApiOperation({ summary: 'Borrar una categoría (solo admin)' })
    @ApiResponse({ status: 204, description: 'Borrada; sin cuerpo' })
    @ApiResponse({ status: 403, description: 'Requiere rol admin' })
    @ApiResponse({ status: 404, description: 'No existe una categoría con ese id' })
    eliminar(@Param('id') id: string) {
        return this.categoriaService.eliminar(id);
    }
}