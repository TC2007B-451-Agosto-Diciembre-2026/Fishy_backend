export class Comentario {
  id: string;
  contenido: string;

  fecha_creado: Date;
  fecha_update: Date;

  perteneceA: string | null;
  perteneceAReporte: string;

  autor: string | null;
}