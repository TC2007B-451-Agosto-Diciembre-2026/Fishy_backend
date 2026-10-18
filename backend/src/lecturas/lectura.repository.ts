import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { Pool, ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';
import { Lectura, LecturaConProgreso } from './entities/lectura.entity';

const COLUMNS = 'l.id, l.titulo, l.contenido, l.orden, l.modulo';
const UPDATABLE = ['titulo', 'contenido', 'orden', 'modulo'];

@Injectable()
export class LecturaRepository {
  constructor(@Inject(DB_POOL) private readonly pool: Pool) {}

  async findAllConProgreso(usuarioId: string, modulo?: number): Promise<LecturaConProgreso[]> {
    const filtro = modulo !== undefined ? 'WHERE l.modulo = ?' : '';
    const params: (string | number)[] = [usuarioId];
    if (modulo !== undefined) params.push(modulo);

    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${COLUMNS}, p.completada, p.fecha_completado
       FROM lecturas l
       LEFT JOIN progreso_lecturas p ON p.lectura_id = l.id AND p.usuario_id = ?
       ${filtro}
       ORDER BY l.orden`,
      params,
    );
    return rows.map(toConProgreso);
  }

  async findByIdConProgreso(usuarioId: string, id: string): Promise<LecturaConProgreso | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${COLUMNS}, p.completada, p.fecha_completado
       FROM lecturas l
       LEFT JOIN progreso_lecturas p ON p.lectura_id = l.id AND p.usuario_id = '${usuarioId}'
       WHERE l.id = '${id}'`,
    );
    return rows[0] && toConProgreso(rows[0]);
  }

  async findById(id: string): Promise<Lectura | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${COLUMNS} FROM lecturas l WHERE l.id = ?`,
      [id],
    );
    return rows[0] && toEntity(rows[0]);
  }

  async findByOrden(orden: number): Promise<Lectura | undefined> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT ${COLUMNS} FROM lecturas l WHERE l.orden = ?`,
      [orden],
    );
    return rows[0] && toEntity(rows[0]);
  }

  async siguienteOrden(): Promise<number> {
    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(orden), 0) + 1 AS siguiente FROM lecturas`,
    );
    return Number(rows[0].siguiente);
  }

  async save(data: { titulo: string; contenido: string; orden: number; modulo: number }): Promise<Lectura> {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO lecturas (id, titulo, contenido, orden, modulo) VALUES (?, ?, ?, ?, ?)`,
      [id, data.titulo, data.contenido, data.orden, data.modulo],
    );
    return (await this.findById(id))!;
  }

  async update(id: string, changes: Partial<Lectura>): Promise<Lectura | undefined> {
    const entries = Object.entries(changes).filter(
      ([column, value]) => UPDATABLE.includes(column) && value !== undefined,
    );
    if (entries.length === 0) return this.findById(id);
    const sets = entries.map(([column]) => `${column} = ?`).join(', ');
    const values = entries.map(([, value]) => value);
    await this.pool.query(`UPDATE lecturas SET ${sets} WHERE id = ?`, [...values, id]);
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const [result] = await this.pool.query<ResultSetHeader>(`DELETE FROM lecturas WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  async marcarCompletada(usuarioId: string, lecturaId: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO progreso_lecturas (usuario_id, lectura_id, completada, fecha_completado)
       VALUES (?, ?, TRUE, NOW())
       ON DUPLICATE KEY UPDATE completada = TRUE, fecha_completado = NOW()`,
      [usuarioId, lecturaId],
    );
  }

  async desmarcar(usuarioId: string, lecturaId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM progreso_lecturas WHERE usuario_id = ? AND lectura_id = ?`,
      [usuarioId, lecturaId],
    );
  }

  async progreso(usuarioId: string, modulo?: number): Promise<{ completadas: number; total: number }> {
    const filtro = modulo !== undefined ? 'WHERE l.modulo = ?' : '';
    const params: (string | number)[] = [usuarioId];
    if (modulo !== undefined) params.push(modulo);

    const [rows] = await this.pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(CASE WHEN p.completada THEN 1 ELSE 0 END), 0) AS completadas
       FROM lecturas l
       LEFT JOIN progreso_lecturas p ON p.lectura_id = l.id AND p.usuario_id = ?
       ${filtro}`,
      params,
    );
    return { total: Number(rows[0].total), completadas: Number(rows[0].completadas) };
  }
}

function toEntity(row: any): Lectura {
  const lectura = new Lectura();
  lectura.id = row.id;
  lectura.titulo = row.titulo;
  lectura.contenido = row.contenido;
  lectura.orden = Number(row.orden);
  lectura.modulo = Number(row.modulo);
  return lectura;
}

function toConProgreso(row: any): LecturaConProgreso {
  return {
    ...toEntity(row),
    completada: Boolean(row.completada),
    fecha_completado: row.fecha_completado ?? null,
  };
}