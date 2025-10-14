import mongoose, { Schema, Document, Model } from 'mongoose';

export const estadosEmpresa = ['pendiente', 'aceptado', 'rechazado'] as const;
export type EstadoEmpresa = (typeof estadosEmpresa)[number];

export interface EmpresaDoc extends Document {
  // Relación con el evento y, opcionalmente, la mesa asignada
  eventoId: mongoose.Types.ObjectId;
  mesaId?: mongoose.Types.ObjectId | null;

  // Datos de la empresa
  nombre: string;                 // razón social o nombre comercial
  nit?: string | null;
  rubro?: string | null;          // sector/industria
  representante?: string | null;
  telefono?: string | null;
  email?: string | null;
  sitio_web?: string | null;
  logo_url?: string | null;
  descripcion?: string | null;
  comprobante_pago_url?: string | null;  // URL del comprobante de pago

  // Estado de la empresa (revisión por admin)
  estado: EstadoEmpresa;

  // Modalidad de participación
  isVirtual: boolean;

  // Referencias a usuarios
  encargadoId?: mongoose.Types.ObjectId | null;  // Usuario tipo 'encargado'
  personalIds: mongoose.Types.ObjectId[];        // Array de usuarios tipo 'personal'

  // Control
  creada_en: Date;
  actualizada_en: Date;
}

const EmpresaSchema = new Schema<EmpresaDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  mesaId:   { type: Schema.Types.ObjectId, ref: 'Mesa', default: null, index: true },

  nombre: { type: String, required: true, trim: true },
  nit: { type: String, default: null, trim: true },
  rubro: { type: String, default: null, trim: true },
  representante: { type: String, default: null, trim: true },
  telefono: { type: String, default: null, trim: true },
  email: { type: String, default: null, trim: true, lowercase: true },
  sitio_web: { type: String, default: null, trim: true },
  logo_url: { type: String, default: null, trim: true },
  descripcion: { type: String, default: null, trim: true },
  comprobante_pago_url: { type: String, default: null, trim: true },

  // Estado de la empresa
  estado: { type: String, enum: estadosEmpresa, default: 'pendiente', required: true },

  // Modalidad de participación
  isVirtual: { type: Boolean, default: false, required: true },

  // Referencias a usuarios
  encargadoId: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null },
  personalIds: [{ type: Schema.Types.ObjectId, ref: 'Usuario' }],

}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Una misma empresa (por nombre) no debe repetirse en el mismo evento
EmpresaSchema.index({ eventoId: 1, nombre: 1 }, { unique: true });

// Nota: la unicidad de mesa por evento se valida en el controlador.
// (Podrías agregar un índice parcial único { eventoId, mesaId } con sparse:true, 
// pero es más seguro controlarlo en la lógica para mejores mensajes de error)

const Empresa: Model<EmpresaDoc> =
  mongoose.models.Empresa || mongoose.model<EmpresaDoc>('Empresa', EmpresaSchema);

export default Empresa;
