import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './jwt';
import { CurrentUser } from './current-user.decorator';
import { AuthGuard } from './auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
    constructor(private readonly service: AuthService) {}

    @Post('register')
    @ApiOperation({ summary: 'Registrar un usuario (rol usuario)' })
    @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente', schema: { example: { id: '123e4567-e89b-12d3-a456-426614174000', correo: 'ana@example.com' } } })
    @ApiResponse({ status: 400, description: 'Nombre vacío, correo inválido o contraseña menor a 8 caracteres', schema: { example: { statusCode: 400, message: ['correo must be an email'], error: 'Bad Request' } } })
    @ApiResponse({ status: 409, description: 'Ya hay un usuario con ese correo' })
    async register(@Body() dto: RegisterDto) {
        return this.service.register(dto);
    }

    @Post('login')
    @HttpCode(200)
    @ApiOperation({ summary: 'Entrar: correo + contraseña → tokens' })
    @ApiResponse({ status: 200, description: 'accessToken vive 15 min; refreshToken, 7 días', schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } } })
    @ApiResponse({ status: 400, description: 'Correo inválido o falta la contraseña' })
    @ApiResponse({ status: 401, description: 'Credenciales inválidas (mismo mensaje si el correo no existe o la contraseña es incorrecta)' })
    @ApiResponse({ status: 429, description: 'Demasiados intentos: máximo 5 por minuto' })
    // Límite de intentos contra fuerza bruta: 5 logins por minuto por IP.
    @UseGuards(ThrottlerGuard)
    @Throttle({ default: { limit: 5, ttl: 60000 } })
    async login(@Body() dto: LoginDto) {
        return this.service.login(dto);
    }

    @Post('refresh')
    @HttpCode(200)
    @ApiOperation({ summary: 'Access token nuevo a partir del refresh token' })
    @ApiResponse({ status: 200, description: 'Token refrescado exitosamente', schema: { example: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' } } })
    @ApiResponse({ status: 401, description: 'Refresh token inválido o expirado' })
    refresh(@Body() dto: RefreshDto) {
        return this.service.refresh(dto);
    }
    @Get('me')
    @UseGuards(AuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Quién soy: datos del usuario logueado' })
    @ApiResponse({ status: 200, schema: { example: { id: '3f1c2e7a-9b4d-4e6f-8a1b-2c3d4e5f6a7b', nombreUsuario: 'ana', correo: 'ana@example.com', rol: 'usuario' } } })
    @ApiResponse({ status: 401, description: 'Falta el token, es inválido o expiró' })
    me(@CurrentUser() user: JwtPayload) {
        return this.service.perfil(user.sub);
    }
}