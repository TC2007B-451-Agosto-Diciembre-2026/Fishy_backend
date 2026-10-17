import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import { DB_POOL } from '../database/database.module';

interface ConteoRow extends RowDataPacket {
  total: number;
}

@Injectable()
export class ReporteLikeRepository {
  constructor( @Inject(DB_POOL) private readonly pool: Pool,) {}

  async agregar(usuarioId: string, reporteId: string): Promise<void> {
    await this.pool.query(
      `INSERT IGNORE INTO reporte_like
        (usuario_id, reporte_id) VALUES (?, ?)`,
      [usuarioId, reporteId]
    );
  }

  async eliminar(usuarioId: string, reporteId: string): Promise<void> {
    await this.pool.query(
      `DELETE FROM reporte_like WHERE usuario_id = ? AND reporte_id = ?`, [usuarioId, reporteId]
    );
  }

  async contar(reporteId: string): Promise<number> {
    const [rows] = await this.pool.query<ConteoRow[]>(
      `SELECT COUNT(*) AS total FROM reporte_like WHERE reporte_id = ?`, [reporteId]
    );
    return Number(rows[0]?.total ?? 0);
  }

  async existe(usuarioId: string, reporteId: string): Promise<boolean> {
    const [rows] = await this.pool.query<ConteoRow[]>(
      `SELECT 1 FROM reporte_like WHERE usuario_id = ? AND reporte_id = ? LIMIT 1`, [usuarioId, reporteId]
    );
    return rows.length > 0;
  }

  async contarPorUsuario(usuarioId: string): Promise<number> {
    const [rows] = await this.pool.query<ConteoRow[]>(
      `SELECT COUNT(*) AS total FROM reporte_like WHERE usuario_id = ?`, [usuarioId]
    );
    return Number(rows[0]?.total ?? 0);
  }

    async contarPorUsuarioEnOtros(usuarioId: string): Promise<number> {
    const [rows] = await this.pool.query<ConteoRow[]>(
      `SELECT COUNT(*) AS total
         FROM reporte_like rl
         JOIN reporte r ON r.id = rl.reporte_id
        WHERE rl.usuario_id = ? AND r.perteneceA <> ?`,
      [usuarioId, usuarioId]
    );
    return Number(rows[0]?.total ?? 0);
  }
  
}