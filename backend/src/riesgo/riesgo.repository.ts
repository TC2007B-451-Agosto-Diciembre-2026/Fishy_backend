import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Riesgo } from './entities/riesgo.entity';

const COLUMNS = 'id, nombre';

interface RiesgoRow extends RowDataPacket {
    id: string;
    nombre: string;
}

@Injectable()
export class RiesgoRepository {
    constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

    async findAll(): Promise<Riesgo[]>{
        const [rows] = await this.pool.query<RiesgoRow[]>(
            `SELECT ${COLUMNS} FROM riesgo ORDER BY nombre`,    
        );
        return rows.map(toEntity);
    }

    async findById(id: string): Promise<Riesgo | undefined> {
        const [rows] = await this.pool.query<RiesgoRow[]>(
            `SELECT ${COLUMNS} FROM riesgo WHERE id = ?`, [id]
        );
        return rows.length > 0 ? toEntity(rows[0]) : undefined;
    }

    async findByNombre(nombre: string): Promise<Riesgo | undefined> {
        const [rows] = await this.pool.query<RiesgoRow[]>(
            `SELECT ${COLUMNS} FROM riesgo WHERE nombre = ?`, [nombre]
        );
        return rows.length > 0 ? toEntity(rows[0]) : undefined;
    }
}

function toEntity(row: RiesgoRow): Riesgo {
    const riesgo = new Riesgo();
    riesgo.id = row.id;
    riesgo.nombre = row.nombre;
    return riesgo;
}