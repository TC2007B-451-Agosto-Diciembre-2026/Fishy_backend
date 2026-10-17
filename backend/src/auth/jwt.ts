/**
 * JWT firmado con HMAC-SHA256 (`HS256`), construido a mano con `node:crypto`.
 *
 * Formato: `base64url(header).base64url(payload).base64url(firma)`.
 * Sin estado: el servidor no guarda tokens; los verifica recalculando la
 * firma con la misma llave. Quien no tenga la llave no puede firmar.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * La llave sale del `.env` (`JWT_SECRET`), nunca del código.
 * Se lee al usarla y no al importar el archivo: así ConfigModule ya cargó el `.env`.
 * Si falta, la app falla a propósito en vez de firmar con un valor por default.
 */
function getSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('Falta JWT_SECRET');
    }
    return secret;
}

/** Lo que viaja dentro del token. `sub` es el id del usuario. */
export interface JwtPayload {
    sub: string;
    correo: string;
    /** Id del rol en la tabla `rol`; `RolesGuard` lo vuelve a buscar en la BD. */
    tieneRol: string;
    /**
     * Nombre del rol (`admin` o `usuario`) al momento del login. Si el rol cambia
     * en la BD, el token viejo sigue diciendo el anterior hasta que expira.
     */
    rolNombre: string;
    /** Un access token no sirve para refrescar, ni un refresh para pedir recursos. */
    type: 'access' | 'refresh';
    /** Emitido en (segundos Unix). */
    iat: number;
    /** Expira en (segundos Unix). */
    exp: number;
}

function now(): number {
    return Math.floor(Date.now() / 1000);
}

function b64url(json: object): string {
    return Buffer.from(JSON.stringify(json)).toString('base64url');
}

function hmac(data: string): string {
    return createHmac('sha256',getSecret()).update(data).digest('base64url');
}

/**
 * Firma un payload y regresa el token.
 * @param payload - Claims sin `iat` ni `exp`; se agregan aquí.
 * @param ttlSeconds - Vida del token en segundos, contada desde ahora.
 * @returns El JWT como `header.payload.firma`.
 */
export function sign(payload: Omit<JwtPayload, 'iat' | 'exp'>, ttlSeconds: number): string {
    const header = b64url({ alg: 'HS256', typ: 'JWT' });
    const body = b64url({...payload, iat: now(), exp: now() + ttlSeconds}); 
    const signature = hmac(`${header}.${body}`);
    return `${header}.${body}.${signature}`;
}

/**
 * Verifica un token y regresa su payload.
 * @param token - El JWT sin `Bearer ` (del header, o el `refreshToken` del body).
 * @returns El payload si la firma cuadra y no ha expirado; `null` en
 *   cualquier otro caso (mal formado, firma distinta, expirado).
 */
export function verify(token: string): JwtPayload | null {
    const [header, body, signature] = token.split('.');
    if (!header || !body || !signature) {
        return null;
    }
    
    const esperada = Buffer.from(hmac(`${header}.${body}`));
    const recibida = Buffer.from(signature);

    // timingSafeEqual tarda lo mismo sin importar en qué byte difieran.
    // Con !== se podría adivinar la firma byte por byte midiendo tiempos.
    if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) {
        return null;
    }
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as JwtPayload;
    if (payload.exp < now()) {
        return null;
    }
    return payload;
}
