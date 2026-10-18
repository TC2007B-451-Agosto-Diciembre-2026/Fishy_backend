import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Reporte } from './entities/reporte.entity';

const COLUMNS= 'id, titulo, fecha_pub, fecha_update, fecha_aprob, perteneceA, tieneEstado, tieneRiesgo';

const UPDATE = ['titulo', 'tieneRiesgo', 'tieneEstado', 'fecha_aprob'];

@Injectable()
export class ReporteRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findAll():Promise<Reporte[]> {
    const [rows]=await this.pool.query<RowDataPacket[]>(
      `SELECT ${COLUMNS} FROM reporte ORDER BY fecha_pub DESC`,
    );
    return rows.map(toEntity);
  }

  async findAllByUsuario(perteneceA: string):Promise<Reporte[]> {
    const [rows]=await this.pool.query<RowDataPacket[]>(
      `SELECT ${COLUMNS} FROM reporte WHERE perteneceA = '${perteneceA}' ORDER BY fecha_pub DESC`,
    );
    return rows.map(toEntity);
  }

  async findAllByEstado(estadoID: string): Promise<Reporte[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${COLUMNS} FROM reporte WHERE tieneEstado = ? ORDER BY fecha_pub`,
      [estadoID]
    );
    return rows.map(toEntity);
  }

  async findById(id: string): Promise<Reporte | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${COLUMNS} FROM reporte WHERE id = ?`,
      [id]
    );
    return rows[0] && toEntity(rows[0]);
  }

  async save (data:{titulo: string; perteneceA: string; tieneEstado: string;}): Promise<Reporte> {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO reporte (id, titulo, perteneceA, tieneEstado) VALUES (?, ?, ?, ?)`,
      [id, data.titulo, data.perteneceA, data.tieneEstado]
    );
    return (await this.findById(id))!;
  }

  async update(id: string, changes: Partial<Reporte>): Promise<Reporte | undefined> {
    const entries = Object.entries(changes).filter(([column, value]) => UPDATE.includes(column) && value !== undefined);
    if (entries.length === 0) return this.findById(id);

    const sets = entries.map(([column]) => `${column} = ?`).join(', ');
    const values = entries.map(([, value]) => value);

    await this.pool.query(
      `UPDATE reporte SET ${sets} WHERE id = ?`,
      [...values, id],
    );
    return this.findById(id);
  }

  async delete(id: string):Promise<boolean> {
    const [result]=await this.pool.query<ResultSetHeader>
    (
      `DELETE FROM reporte WHERE id = '${id}'`,
    );
    return result.affectedRows>0;
  }

  async contarComentarios(reporteId: string): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM comentario WHERE perteneceAReporte = ?`, [reporteId]
    );
    return Number(rows[0]?.total ?? 0);
  }

  async contarAprobadosPorCategoria(dias: number): Promise<{ categoria: string; total: number }[]> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT c.nombre AS categoria, COUNT(r.id) AS total
      FROM categoria c
      LEFT JOIN reporte_categoria rc ON rc.categoria_id = c.id
      LEFT JOIN reporte r
        ON r.id = rc.reporte_id
        AND r.tieneEstado = (SELECT id FROM estado WHERE nombre = 'aprobado')
        AND COALESCE(r.fecha_aprob, r.fecha_pub) >= NOW() - INTERVAL ${dias} DAY
      GROUP BY c.id, c.nombre
      ORDER BY total DESC, c.nombre`);
    return rows.map((row) => ({ categoria: row.categoria, total: Number(row.total) }));
  }
}

function toEntity(row: any): Reporte {
  const reporte=new Reporte();
  reporte.id = row.id;
  reporte.titulo = row.titulo;
  reporte.fecha_pub=row.fecha_pub;
  reporte.fecha_update= row.fecha_update;
  reporte.fecha_aprob= row.fecha_aprob ?? undefined;

  reporte.perteneceA =row.perteneceA;
  reporte.tieneEstado= row.tieneEstado;
  reporte.tieneRiesgo=row.tieneRiesgo;
  return reporte;
}