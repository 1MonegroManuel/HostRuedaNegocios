import mongoose, { Schema, Document, Model } from 'mongoose';

export const roles = ['personal','encargado','admin'] as const;
export type RolUsuario = (typeof roles)[number];

export interface UsuarioDoc extends Document {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  passwordHash: string;
  telefono: string | null;
  tipoUsuario: RolUsuario;
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  creado_en: Date;
  actualizado_en: Date;
}

const UsuarioSchema = new Schema<UsuarioDoc>({
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, index: true, trim: true },
  passwordHash: { type: String, required: true },
  telefono: { type: String, default: null, trim: true },
  tipoUsuario: { type: String, enum: roles, default: 'personal', required: true },
  resetPasswordCode: { type: String, default: null },
  resetPasswordExpires: { type: Date, default: null }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

const Usuario: Model<UsuarioDoc> =
  mongoose.models.Usuario || mongoose.model<UsuarioDoc>('Usuario', UsuarioSchema);

export default Usuario;