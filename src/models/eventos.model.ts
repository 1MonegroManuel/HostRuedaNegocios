import mongoose, { Schema, Document, Model } from 'mongoose';

export interface EventoDoc extends Document {
  nombre: string;
  descripcion: string;
  inicio: Date;
  fin: Date;
  duracion_minutos_reunion: number;
  numero_mesas: number;
  modo_mesas: 'FIJA_POR_EMPRESA' | 'POR_REUNION';
  logo_url: string | null;
  estado: 'ACTIVO' | 'FINALIZADO' | 'CANCELADO' | 'PROGRAMADO';
  creado_en: Date;
  actualizado_en: Date;
}

const EventoSchema = new Schema<EventoDoc>({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  inicio: { type: Date, required: true, index: true },
  fin: { type: Date, required: true },
  duracion_minutos_reunion: { type: Number, required: true, min: 1 },
  numero_mesas: { type: Number, required: true, min: 1 },
  modo_mesas: { type: String, enum: ['FIJA_POR_EMPRESA','POR_REUNION'], required: true },
  logo_url: { type: String, default: null },
  estado: { type: String, enum: ['ACTIVO', 'FINALIZADO', 'CANCELADO', 'PROGRAMADO'], default: 'ACTIVO', index: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

const Evento: Model<EventoDoc> =
  mongoose.models.Evento || mongoose.model<EventoDoc>('Evento', EventoSchema);

export default Evento;
