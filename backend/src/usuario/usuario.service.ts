import { ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
const bcrypt = require('bcrypt') as typeof import('bcrypt');
import { UsuarioRepository } from './usuario.repository';
import { RolRepository } from '../rol/rol.repository';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { UsuarioResponseDto } from './dto/usuario-response.dto';
import { Usuario } from './entities/usuario.entity';

const ROL_DEFAULT = 'usuario';
@Injectable()
export class UsuarioService {
    constructor(private readonly usuarioRepository: UsuarioRepository, private readonly rolRepository: RolRepository) {}

    async crear(dto: CreateUsuarioDto): Promise<UsuarioResponseDto> {
        const yaExiste = await this.usuarioRepository.findByCorreo(dto.correo);
        if (yaExiste) throw new ConflictException('No se puede completar el registro.');
        
        if (await this.usuarioRepository.findByNombreUsuario(dto.nombreUsuario)) {
            throw new ConflictException('Ese nombre de usuario ya esta registrado');
        }
        const rolDefault = await this.rolRepository.findByNombre(ROL_DEFAULT);
            if (!rolDefault) {
                throw new InternalServerErrorException('Error de configuración del servidor');
            }

        const contrasenaHash = await bcrypt.hash(dto.contrasena, 10)
        const creado = await this.usuarioRepository.save({
            nombre: dto.nombre,
            correo: dto.correo,
            nombreUsuario: dto.nombreUsuario,
            contrasenaHash,
            tieneRol: rolDefault.id,
        });
        return new UsuarioResponseDto(creado);
    }

    async obtener(id: string): Promise<UsuarioResponseDto> {
        // Antes: findAll().find() traía la tabla entera (con hashes) para hallar una fila.
        const usuario = await this.usuarioRepository.findById(id);
        if (!usuario) throw new NotFoundException('Usuario no encontrado');
        return new UsuarioResponseDto(usuario);
    }

    async listar(): Promise<UsuarioResponseDto[]> {
        const usuarios = await this.usuarioRepository.findAll();
        return usuarios.map((u) => new UsuarioResponseDto(u));

    }

    async actualizar(id: string, dto: UpdateUsuarioDto): Promise<UsuarioResponseDto> {

        const { contrasena, ...resto } = dto;
        const cambios: Partial<Usuario> = { ...resto };
        if (contrasena) {
            cambios.contrasenaHash = await bcrypt.hash(contrasena, 10);
        }
        
        if (dto.contrasena && dto.contrasena.length < 10) {
            throw new ConflictException('La contraseña debe tener al menos 10 caracteres');
        }
        if (dto.nombreUsuario) {
            const nombreUsuario = dto.nombreUsuario.trim().toLowerCase();
            const existente = await this.usuarioRepository.findByNombreUsuario(nombreUsuario);
            if (existente && existente.id !== id) {
                throw new ConflictException('Ese nombre de usuario ya esta registrado');
            }
            cambios.nombreUsuario = nombreUsuario;
        }
        await this.obtener(id);

        const actualizado = await this.usuarioRepository.update(id, cambios);
        return new UsuarioResponseDto(actualizado!);
    }


    async eliminar(id: string) {
        try {
            const eliminado = await this.usuarioRepository.delete(id);
            if (!eliminado) throw new NotFoundException('No existe un usuario con ese id');
        } catch (e: unknown) {
            if (e instanceof Error && 'code' in e && e.code === 'ER_ROW_IS_REFERENCED_2') {
                throw new ConflictException('No se puede eliminar el usuario porque tiene registros asociados.');
            }
            throw e;
        }
    }
}
