import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Usuario } from './entities/usuario.entity';

const COLUMNS = 'id, correo, nombre, nombreUsuario, contrasenaHash, fecha_creado, tieneRol';

/** Fila tal como la regresa MySQL, tipada en lugar de `any`. */
interface UsuarioRow extends RowDataPacket {
    id: string;
    correo: string;
    nombre: string;
    nombreUsuario: string;
    contrasenaHash: string;
    tieneRol: string;
    fecha_creado: Date;
}

// Lista blanca de columnas: para nombres de columna no existe `?`, así que solo pasan estas.
const ALLOWED_COLUMNS = new Set(['nombre', 'correo', 'nombreUsuario', 'contrasenaHash']);

@Injectable()
export class UsuarioRepository {
    constructor(@Inject(DB_POOL) private readonly pool: Pool) { }

    async findAll(): Promise<Usuario[]>{
        const [rows] = await this.pool.query<UsuarioRow[]>(
            `SELECT ${COLUMNS} FROM usuario ORDER BY fecha_creado DESC`
        );
        return rows.map(toEntity);
    }
    async findById(id: string): Promise<Usuario | undefined> {
        const [rows] = await this.pool.query<UsuarioRow[]>(
            `SELECT ${COLUMNS} FROM usuario WHERE id = ?`, [id]
        );
        return rows[0] && toEntity(rows[0]);
    }
    async findByCorreo(correo: string): Promise<Usuario | undefined>{
        const [rows] = await this.pool.query<UsuarioRow[]>(
            `SELECT ${COLUMNS} FROM usuario WHERE correo = ?`, [correo]
        );
        return rows[0] && toEntity(rows[0]);
    }
    async findByNombreUsuario(nombreUsuario: string): Promise<Usuario | undefined>{
        const [rows] = await this.pool.query<UsuarioRow[]>(
            `SELECT ${COLUMNS} FROM usuario WHERE nombreUsuario = ?`, [nombreUsuario]
        );
        return rows[0] && toEntity(rows[0]);
    }
    async save(usuario: Omit<Usuario, 'id' | 'fecha_creado'>): Promise<Usuario> {
        const id = randomUUID();
        await this.pool.query(
            `INSERT INTO usuario (id, nombre, correo, nombreUsuario, contrasenaHash, tieneRol) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, usuario.nombre, usuario.correo, usuario.nombreUsuario, usuario.contrasenaHash, usuario.tieneRol]
        );
        return (await this.findById(id))!;
    }
    async update(id: string, changes: Partial<Usuario>): Promise<Usuario | undefined> {
        const entries = Object.entries(changes).filter(([column, value]) => ALLOWED_COLUMNS.has(column) && value !== undefined);
        if (entries.length === 0) return this.findById(id);

        const sets = entries.map(([column]) => `${column} = ?`).join(', ');
        const values = entries.map(([, value]) => value);

        await this.pool.query(`UPDATE usuario SET ${sets} WHERE id = ?`, [...values, id]);
        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const [result] = await this.pool.query<ResultSetHeader> (
            `DELETE FROM usuario WHERE id = ?`,
            [id],
        );
        return result.affectedRows > 0;
    }
}

function toEntity(row: UsuarioRow): Usuario {
    const usuario = new Usuario();
    usuario.id = row.id;
    usuario.nombre = row.nombre;
    usuario.nombreUsuario = row.nombreUsuario;
    usuario.correo = row.correo;
    usuario.contrasenaHash = row.contrasenaHash;
    usuario.fecha_creado = row.fecha_creado;
    usuario.tieneRol = row.tieneRol;
    return usuario;
}