import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Categoria } from './entities/categoria.entity';

const COLUMNS = 'id, nombre';

// Lista blanca de columnas: para nombres de columna no existe `?`, así que solo pasan estas.
const ALLOWED_COLUMNS = new Set(['nombre']);

interface CategoriaRow extends RowDataPacket {
    id: string;
    nombre: string;
}

@Injectable()
export class CategoriaRepository {
    constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

    async findAll(): Promise<Categoria[]>{
        const [rows] = await this.pool.query<CategoriaRow[]>(
            `SELECT ${COLUMNS} FROM categoria ORDER BY nombre`,    
        );
        return rows.map(toEntity);
    }

    async findById(id: string): Promise<Categoria | undefined> {
        const [rows] = await this.pool.query<CategoriaRow[]>(
            `SELECT ${COLUMNS} FROM categoria WHERE id = ?`, [id]
        );
        return rows[0] && toEntity(rows[0]);
    }
    
    async findByNombre(nombre: string): Promise<Categoria | undefined> {
        const [rows] = await this.pool.query<CategoriaRow[]>(
            `SELECT ${COLUMNS} FROM categoria WHERE nombre = ?`, [nombre]
        );
        return rows[0] && toEntity(rows[0]);
    }

    async save(categoria: Omit<Categoria, 'id'>): Promise<Categoria> {
        const id = randomUUID();
        await this.pool.query(
           `INSERT INTO categoria (id, nombre) VALUES (?, ?)`,
           [id, categoria.nombre]
        );
        return (await this.findById(id))!;
    }

    async update(id: string, changes: Partial<Categoria>): Promise<Categoria | undefined> {
        const entries = Object.entries(changes).filter(([column, value]) => ALLOWED_COLUMNS.has(column) && value !== undefined);
        if (entries.length === 0) return this.findById(id);

        const sets = entries.map(([column]) => `${column} = ?`).join(', ');
        const values = entries.map(([, value]) => value);

        await this.pool.query(`UPDATE categoria SET ${sets} WHERE id = ?`, [...values, id]);
        return this.findById(id);
    }

    async delete(id: string): Promise<boolean> {
        const [result] = await this.pool.query<ResultSetHeader>(
            `DELETE FROM categoria WHERE id = ?`, [id]
        );
        return result.affectedRows > 0;
    }
}

function toEntity(row: CategoriaRow): Categoria {
    const categoria = new Categoria();
    categoria.id = row.id;
    categoria.nombre = row.nombre;
    return categoria;
}