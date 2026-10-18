import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Comentario } from './entities/comentario.entity';

const SELECT = `SELECT c.id, c.contenido, c.fecha_creado, c.fecha_update, 
c.perteneceA, c.perteneceAReporte, u.nombreUsuario AS autor
FROM comentario c
LEFT JOIN usuario u ON u.id = c.perteneceA`;

@Injectable()
export class ComentarioRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findByReporte(reporteId: string): Promise<Comentario[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `${SELECT} WHERE c.perteneceAReporte = ? ORDER BY c.fecha_creado ASC, c.id ASC`,
      [reporteId],
    );
    return rows.map(toEntity);
  }

  async findById(id: string): Promise<Comentario | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(`${SELECT} WHERE c.id = ?`, [id]);
    return rows[0] && toEntity(rows[0]);
  }

  async save(data: { contenido: string; perteneceA: string; perteneceAReporte: string }): Promise<Comentario> {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO comentario (id, contenido, perteneceA, perteneceAReporte) VALUES (?, ?, ?, ?)`,
      [id, data.contenido, data.perteneceA, data.perteneceAReporte],
    );
    return (await this.findById(id))!;
  }

  async update(id: string, contenido: string): Promise<Comentario | undefined> {
    await this.pool.query(`UPDATE comentario SET contenido = ? WHERE id = ?`, [contenido, id]);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(`DELETE FROM comentario WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

function toEntity(row: any): Comentario {
  const comentario = new Comentario();
  comentario.id = row.id;
  comentario.contenido = row.contenido;
  comentario.fecha_creado = row.fecha_creado;
  comentario.fecha_update = row.fecha_update;
  comentario.perteneceA = row.perteneceA;
  comentario.perteneceAReporte = row.perteneceAReporte;
  comentario.autor = row.autor ?? null;
  return comentario;
}