import { ConflictException, Injectable, InternalServerErrorException, Logger, UnauthorizedException } from '@nestjs/common';
import { UsuarioRepository } from '../usuario/usuario.repository';
import { RolRepository } from '../rol/rol.repository';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { sign, verify } from './jwt';
import * as bcrypt from 'bcrypt';
import { PerfilResponseDto } from './dto/perfil-response.dto';

const ACCESS_TTL = 15 * 60;
const REFRESH_TTL = 7 * 24 * 60 * 60;
const ROL_DEFAULT = 'usuario';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usuarioRepository: UsuarioRepository,
    private readonly rolRepository: RolRepository,
  ) {}

  async register(dto: RegisterDto): Promise<{ id: string; correo: string; nombreUsuario: string }> {
    if (await this.usuarioRepository.findByCorreo(dto.correo)) {
      throw new ConflictException('Ese correo ya esta registrado');
    }

    if (await this.usuarioRepository.findByNombreUsuario(dto.nombreUsuario)) {
      throw new ConflictException('Ese nombre de usuario ya esta registrado');
    }
    
    const rolDefault = await this.rolRepository.findByNombre(ROL_DEFAULT);
    if (!rolDefault) {
      throw new InternalServerErrorException('Error de configuración del servidor');
    }
    const usuario = await this.usuarioRepository.save({
      nombre: dto.nombre,
      correo: dto.correo,
      nombreUsuario: dto.nombreUsuario,
      contrasenaHash: await bcrypt.hash(dto.contrasena, 10),
      tieneRol: rolDefault.id,
    });
    return { id: usuario.id, correo: usuario.correo, nombreUsuario: usuario.nombreUsuario };
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const usuario = await this.usuarioRepository.findByCorreo(dto.correo);

    // Un solo mensaje para "no existe" y "contraseña incorrecta": con dos mensajes
    // distintos se puede saber qué correos tienen cuenta (enumeración de usuarios).
    // Si el usuario no existe igual se calcula un hash, para que el tiempo de
    // respuesta tampoco lo delate.
    const ok = usuario
      ? await bcrypt.compare(dto.contrasena, usuario.contrasenaHash)
      : (await bcrypt.hash(dto.contrasena, 10), false);
    if (!usuario || !ok) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const rol = await this.rolRepository.findById(usuario.tieneRol);
    if (!rol) {
      throw new InternalServerErrorException('Error de configuración del servidor');
    }

    const claims = {
      sub: usuario.id,
      correo: usuario.correo,
      tieneRol: usuario.tieneRol,
      rolNombre: rol.nombre,
    };
    const accessToken = sign({ ...claims, type: 'access' }, ACCESS_TTL);
    const refreshToken = sign({ ...claims, type: 'refresh' }, REFRESH_TTL);
    // Se registra el evento, nunca el token: un token en los logs es una sesión válida.
    this.logger.log(`Login de ${usuario.correo}`);
    return { accessToken, refreshToken };
  }

  refresh(dto: RefreshDto): { accessToken: string } {
    const payload = verify(dto.refreshToken);
    if (payload?.type !== 'refresh') {
      throw new UnauthorizedException('Refresh token invalido');
    }
    const accessToken = sign(
      {
        sub: payload.sub,
        correo: payload.correo,
        tieneRol: payload.tieneRol,
        rolNombre: payload.rolNombre,
        type: 'access',
      },
      ACCESS_TTL,
    );
    return { accessToken };
  }

  async perfil(usuarioId: string): Promise<PerfilResponseDto> {
    const usuario = await this.usuarioRepository.findById(usuarioId);
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
    const rol = await this.rolRepository.findById(usuario.tieneRol);
    if (!rol) {
      throw new InternalServerErrorException('Error de configuración del servidor');
    }
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      nombreUsuario: usuario.nombreUsuario,
      correo: usuario.correo,
      rol: rol.nombre,
    };
  }
}