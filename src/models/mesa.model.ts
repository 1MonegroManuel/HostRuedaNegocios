import mongoose, { Schema, Document, Model } from 'mongoose';

export interface MesaDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  numero: number;                // número visible de mesa dentro del evento
  nombre?: string | null;        // alias opcional ("Mesa A", "VIP 1", etc.)
  capacidad?: number | null;     // asientos disponibles
  activa: boolean;               // para habilitar/deshabilitar sin borrar
  ocupada: boolean;              // para controlar si está asignada a una empresa
  creado_en: Date;
  actualizado_en: Date;
}

const MesaSchema = new Schema<MesaDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  numero:   { type: Number, required: true, min: 1 },
  nombre:   { type: String, default: null, trim: true },
  capacidad:{ type: Number, default: null, min: 1 },
  activa:   { type: Boolean, default: true, index: true },
  ocupada:  { type: Boolean, default: false, index: true },
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

// Evita mesas duplicadas dentro del mismo evento
MesaSchema.index({ eventoId: 1, numero: 1 }, { unique: true });

const Mesa: Model<MesaDoc> =
  mongoose.models.Mesa || mongoose.model<MesaDoc>('Mesa', MesaSchema);

export default Mesa;
