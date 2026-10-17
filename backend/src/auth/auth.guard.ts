import { CanActivate, ExecutionContext, Injectable, UnauthorizedException} from '@nestjs/common';
import type { Request } from 'express';
import { verify, JwtPayload } from './jwt';

/**
 * Protege rutas con un JWT de acceso.
 *
 * Lee `Authorization: Bearer <token>`, verifica firma y expiración con
 * {@link verify} y, si todo cuadra, deja el payload en `req.user` para que
 * `@CurrentUser()` y `RolesGuard` lo lean. Rechaza con 401 **antes** de
 * llegar al controller.
 *
 * Solo acepta tokens de tipo `access`: un refresh token válido también
 * recibe 401, porque no sirve para pedir recursos.
 *
 * Va siempre antes que `RolesGuard` (por eso se pone a nivel clase): ese
 * guard necesita `req.user` ya lleno.
 */
@Injectable()
export class AuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
        const header = req.headers.authorization ?? '';
        if (!header.startsWith('Bearer ')) {
            throw new UnauthorizedException('Falta token de autorización');
        }
        const payload = verify(header.slice('Bearer '.length));
        if (payload?.type !== 'access') {
            throw new UnauthorizedException('Token inválido o expirado');
        }
        req.user = payload;
        return true;
    }
}