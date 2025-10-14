import mongoose, { Schema, Document, Model } from 'mongoose';

export type EstadoSolicitud = 'pendiente'|'aceptada'|'rechazada'|'cancelada';

export interface SolicitudReunionDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  empresaSolicitaId: mongoose.Types.ObjectId; // quien solicita
  empresaObjetivoId: mongoose.Types.ObjectId; // a quien solicita
  usuarioSolicitaId: mongoose.Types.ObjectId; // representante/empleado que solicita
  
  // Opcionales de preferencia (no reservan nada)
  mesaPreferidaId?: mongoose.Types.ObjectId | null;
  inicioPropuesto?: Date | null;
  finPropuesto?: Date | null;
  tipoReunion: 'virtual' | 'presencial'; // tipo de reunión
  mensaje?: string | null;
  estado: EstadoSolicitud;

  creada_en: Date;
  actualizada_en: Date;
}

const SolicitudReunionSchema = new Schema<SolicitudReunionDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  empresaSolicitaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  empresaObjetivoId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  usuarioSolicitaId: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true, index: true },

  mesaPreferidaId: { type: Schema.Types.ObjectId, ref: 'Mesa', default: null },
  inicioPropuesto: { type: Date, default: null },
  finPropuesto: { type: Date, default: null },
  tipoReunion: { type: String, enum: ['virtual', 'presencial'], required: true, default: 'presencial' },

  mensaje: { type: String, default: null, trim: true },
  estado: { type: String, enum: ['pendiente','aceptada','rechazada','cancelada'], default: 'pendiente', index: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Evita duplicar solicitudes PENDIENTES entre el mismo par en el mismo evento
SolicitudReunionSchema.index(
  { eventoId: 1, empresaSolicitaId: 1, empresaObjetivoId: 1, estado: 1 },
  { unique: true, partialFilterExpression: { estado: 'pendiente' } }
);

const SolicitudReunion: Model<SolicitudReunionDoc> =
  mongoose.models.SolicitudReunion || mongoose.model<SolicitudReunionDoc>('SolicitudReunion', SolicitudReunionSchema);

export default SolicitudReunion;
