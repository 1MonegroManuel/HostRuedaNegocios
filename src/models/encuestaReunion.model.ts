import mongoose, { Schema, Document, Model } from 'mongoose';

export interface EncuestaReunionDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  solicitudReunionId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;     // ¿quién responde?

  // Campos de satisfacción (0–5 o 1–5, aquí 1–5):
  calificacion_general: number;           // 1..5
  match_negocio?: number | null;          // 1..5
  puntualidad?: number | null;            // 1..5
  interes_contraparte?: number | null;    // 1..5

  recomendar_nps?: number | null;         // 0..10
  monto_acordado?: number | null;         // Monto en USD acordado entre empresas
  comentarios?: string | null;

  creada_en: Date;
  actualizada_en: Date;
}

const EncuestaSchema = new Schema<EncuestaReunionDoc>({
  eventoId:   { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  solicitudReunionId:  { type: Schema.Types.ObjectId, ref: 'SolicitudReunion', required: true, index: true },
  empresaId:  { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },

  calificacion_general: { type: Number, required: true, min: 1, max: 5 },
  match_negocio:        { type: Number, default: null, min: 1, max: 5 },
  puntualidad:          { type: Number, default: null, min: 1, max: 5 },
  interes_contraparte:  { type: Number, default: null, min: 1, max: 5 },

  recomendar_nps:       { type: Number, default: null, min: 0, max: 10 },
  monto_acordado:       { type: Number, default: null, min: 0 },
  comentarios:          { type: String, default: null, trim: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Evita duplicar una encuesta de la misma empresa en la misma solicitud de reunión
EncuestaSchema.index({ solicitudReunionId: 1, empresaId: 1 }, { unique: true });

const EncuestaReunion: Model<EncuestaReunionDoc> =
  mongoose.models.EncuestaReunion || mongoose.model<EncuestaReunionDoc>('EncuestaReunion', EncuestaSchema);

export default EncuestaReunion;
