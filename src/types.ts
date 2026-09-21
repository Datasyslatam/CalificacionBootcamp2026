export interface Jurado {
  id: number;
  nombre: string;
  cargo: string;
  avatar: string;
}

export interface Criterio {
  id: string;
  nombre: string;
  descripcion: string;
  ponderacion: number;
}

export interface CalificacionEquipo {
  equipoId: number;
  nombreEquipo: string;
  calificaciones: Record<string, number>; // criterioId -> puntuacion (1-10)
  comentarios: Record<string, string>;
  calificadoPor: number[]; // ids de jurados que ya calificaron
}

export interface CalificacionJurado {
  juradoId: number;
  equipoId: number;
  calificaciones: Record<string, number>;
  comentarios: string;
  timestamp: Date;
}
