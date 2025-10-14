import { Request, Response } from 'express';
import path from 'path';
import mime from 'mime-types';
import {
  uploadBufferToCloudinary,
  destroyFromCloudinary,
  parseCloudinaryFromUrl,
  replaceFileContent,
  type ResourceType,
} from '../services/storage.service';

/**
 * POST /api/storage
 * Field del form-data: "archivo"
 * Respuesta: { url, tipo, carpeta, nombre }
 */
export async function subirArchivoCtrl(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ message: 'No se envió ningún archivo' });

    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    const detected = (mime.lookup(ext) || file.mimetype || '').toString();

    let resourceType: ResourceType = 'raw';
    if (detected.startsWith('image/')) resourceType = 'image';
    else if (detected.startsWith('video/')) resourceType = 'video';

    const carpeta = (req.query.carpeta as string) || 'uploads';
    const nombre = (req.query.nombre as string) || undefined;

    const result = await uploadBufferToCloudinary(file.buffer, {
      folder: carpeta,
      resource_type: resourceType,
      filename_override: nombre,
      use_filename: !!nombre,
      unique_filename: !nombre,
      overwrite: !!nombre, // Permitir overwrite si se especifica nombre
    });

    return res.status(201).json({
      url: result.secureUrl || result.url,
      tipo: result.resourceType,
      carpeta: result.folder,
      nombre: result.publicId.split('/').pop(),
      bytes: result.bytes,
      mime: detected || file.mimetype,
    });
  } catch (err: any) {
    console.error('Error al subir archivo:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Error al subir archivo' });
  }
}

/**
 * PUT /api/storage/replace
 * Field del form-data: "archivo"
 * Query: existingUrl (URL del archivo a reemplazar)
 * Respuesta: { url, tipo, carpeta, nombre } (mantiene la misma URL)
 */
export async function reemplazarArchivoCtrl(req: Request, res: Response) {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ message: 'No se envió ningún archivo' });

    const existingUrl = (req.query.existingUrl as string) || '';
    if (!existingUrl) return res.status(400).json({ message: 'Debe enviar existingUrl' });

    const ext = path.extname(file.originalname).replace('.', '').toLowerCase();
    const detected = (mime.lookup(ext) || file.mimetype || '').toString();

    let resourceType: ResourceType = 'raw';
    if (detected.startsWith('image/')) resourceType = 'image';
    else if (detected.startsWith('video/')) resourceType = 'video';

    const result = await replaceFileContent(existingUrl, file.buffer, {
      resource_type: resourceType,
    });

    return res.status(200).json({
      url: result.secureUrl || result.url,
      tipo: result.resourceType,
      carpeta: result.folder,
      nombre: result.publicId.split('/').pop(),
      bytes: result.bytes,
      mime: detected || file.mimetype,
    });
  } catch (err: any) {
    console.error('Error al reemplazar archivo:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Error al reemplazar archivo' });
  }
}

/**
 * DELETE /api/storage
 * body: { url: "https://res.cloudinary.com/..." }
 */
export async function eliminarArchivoCtrl(req: Request, res: Response) {
  try {
    const archivoUrl = (req.body?.url || '').toString();
    if (!archivoUrl) return res.status(400).json({ message: 'Debe enviar url' });

    const { publicId, resourceType } = parseCloudinaryFromUrl(archivoUrl);
    const result = await destroyFromCloudinary(publicId, resourceType);

    // Cloudinary responde { result: 'ok' } o 'not found'
    if ((result as any)?.result === 'not found') {
      return res.status(404).json({ message: 'El archivo no existe en Cloudinary' });
    }

    return res.status(200).json({ message: 'Archivo eliminado correctamente' });
  } catch (err: any) {
    console.error('Error al eliminar archivo:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Error al eliminar archivo' });
  }
}
