import mongoose, { Schema, Document, Model } from 'mongoose';

export type TipoArchivoEvento = 'MAPA'|'CRONOGRAMA'|'OTRO';

export interface ArchivoEventoDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  tipo: TipoArchivoEvento;
  url: string;
  nombre_archivo: string;
  mime: string;
  creado_en: Date;
}

const ArchivoEventoSchema = new Schema<ArchivoEventoDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  tipo: { type: String, enum: ['MAPA','CRONOGRAMA','OTRO'], required: true, index: true },
  url: { type: String, required: true, trim: true },
  nombre_archivo: { type: String, required: true, trim: true },
  mime: { type: String, required: true, trim: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: false } });

const ArchivoEvento: Model<ArchivoEventoDoc> =
  mongoose.models.ArchivoEvento || mongoose.model<ArchivoEventoDoc>('ArchivoEvento', ArchivoEventoSchema);

export default ArchivoEvento;
