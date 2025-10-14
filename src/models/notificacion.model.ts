import mongoose, { Schema, Document, Model } from 'mongoose';

export type CanalNotificacion = 'app'|'email';
export type EstadoNotificacion = 'pendiente'|'enviada'|'leida'|'fallida';

export interface NotificacionDoc extends Document {
  // Contexto opcional para trazar el origen de la notificación
  eventoId?: mongoose.Types.ObjectId | null;
  reunionId?: mongoose.Types.ObjectId | null;
  empresaId?: mongoose.Types.ObjectId | null;
  usuarioId?: mongoose.Types.ObjectId | null;

  tipo: string;                  // ej: "reunion_programada", "solicitud_aceptada"
  canal: CanalNotificacion;      // app/email/sms/whatsapp
  titulo: string;
  mensaje: string;

  payload?: Record<string, any> | null; // datos extras (no sensibles)
  estado: EstadoNotificacion;   // pendiente/enviada/leida/fallida
  intento?: number | null;      // nº de intentos de envío (si usas colas)

  creada_en: Date;
  actualizada_en: Date;
}

const NotificacionSchema = new Schema<NotificacionDoc>({
  eventoId:  { type: Schema.Types.ObjectId, ref: 'Evento', default: null, index: true },
  reunionId: { type: Schema.Types.ObjectId, ref: 'Reunion', default: null, index: true },
  empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', default: null, index: true },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null, index: true },

  tipo:   { type: String, required: true, trim: true },
  canal:  { type: String, enum: ['app','email'], required: true, index: true },
  titulo: { type: String, required: true, trim: true },
  mensaje:{ type: String, required: true, trim: true },

  payload:{ type: Schema.Types.Mixed, default: null },
  estado: { type: String, enum: ['pendiente','enviada','leida','fallida'], default: 'pendiente', index: true },
  intento:{ type: Number, default: null, min: 0 },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

const Notificacion: Model<NotificacionDoc> =
  mongoose.models.Notificacion || mongoose.model<NotificacionDoc>('Notificacion', NotificacionSchema);

export default Notificacion;
