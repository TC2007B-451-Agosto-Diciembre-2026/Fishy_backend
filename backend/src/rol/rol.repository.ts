import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Rol } from './entities/rol.entity';

const COLUMNS = 'id, nombre, gatename';

// Lista blanca de columnas: para nombres de columna no existe `?`, así que solo pasan estas.
const ALLOWED_COLUMNS = new Set(['nombre', 'gatename']);

interface RolRow extends RowDataPacket {
    id: string;
    nombre: string;
    gatename: string;
}

@Injectable()
export class RolRepository {
    constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

    async findAll(): Promise<Rol[]>{
        const [rows] = await this.pool.query<RolRow[]>(
            `SELECT ${COLUMNS} FROM rol ORDER BY nombre`,    
        );
        return rows.map(toEntity);
    }

    async findById(id: string): Promise<Rol | undefined> {
        const [rows] = await this.pool.query<RolRow[]>(
            `SELECT ${COLUMNS} FROM rol WHERE id = ?`, [id]
        );
        return rows[0] && toEntity(rows[0]);
    }

    async findByNombre(nombre: string): Promise<Rol | undefined> {
        const [rows] = await this.pool.query<RolRow[]>(
            `SELECT ${COLUMNS} FROM rol WHERE nombre = ?`, [nombre]
        );
        return rows[0] && toEntity(rows[0]);
    }

    async findByGatename(gatename: string): Promise<Rol | undefined> {
        const [rows] = await this.pool.query<RolRow[]>(
            `SELECT ${COLUMNS} FROM rol WHERE gatename = ?`, [gatename]
        );
        return rows[0] && toEntity(rows[0]);
    }

    async save(rol: Omit<Rol, 'id'>): Promise<Rol> {
        const id = randomUUID();
        await this.pool.query(
           `INSERT INTO rol (id, nombre, gatename) VALUES (?, ?, ?)`,
            [id, rol.nombre, rol.gatename]
        );
        return (await this.findById(id))!;
    }

    async update(id: string, changes: Partial<Rol>): Promise<Rol | undefined> {
        const entries = Object.entries(changes).filter(([column, value]) => ALLOWED_COLUMNS.has(column) && value !== undefined);
        if (entries.length === 0) return this.findById(id);

        const sets = entries.map(([column]) => `${column} = ?`).join(', ');
        const values = entries.map(([, value]) => value);

        await this.pool.query(`UPDATE rol SET ${sets} WHERE id = ?`, [...values, id]);
        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const [result] = await this.pool.query<ResultSetHeader>(
            `DELETE FROM rol WHERE id = ?`, [id]
        );
        return result.affectedRows > 0;
    }
}

function toEntity(row: RolRow): Rol {
    const rol = new Rol();
    rol.id = row.id;
    rol.nombre = row.nombre;
    rol.gatename = row.gatename;

    return rol;
}