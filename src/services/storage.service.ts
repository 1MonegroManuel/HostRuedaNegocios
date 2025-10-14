import { UploadApiResponse, v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

/**
 * Tipos de recurso válidos en Cloudinary
 */
export type ResourceType = 'image' | 'video' | 'raw' | 'auto';

export type UploadResult = {
  url: string;
  secureUrl: string;
  publicId: string;
  resourceType: string;
  bytes: number;
  format?: string;
  folder?: string;
  originalFilename?: string;
};

/**
 * Sube un buffer a Cloudinary con streaming (no guarda en disco).
 */
export function uploadBufferToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string;
    resource_type?: ResourceType;
    filename_override?: string;
    use_filename?: boolean;
    unique_filename?: boolean;
    overwrite?: boolean;
  } = {}
): Promise<UploadResult> {
  const {
    folder,
    resource_type = 'auto',
    filename_override,
    use_filename = true,
    unique_filename = true,
    overwrite = false,
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
        filename_override,
        use_filename,
        unique_filename,
        overwrite,
      },
      (err: any, result?: UploadApiResponse) => {
        if (err || !result) return reject(err || new Error('Upload failed'));
        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          bytes: result.bytes,
          format: result.format,
          folder: result.folder,
          originalFilename: result.original_filename,
        });
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

/**
 * Elimina un recurso en Cloudinary por publicId.
 * Si se conoce el resource_type, pásalo; si no, usa 'image' o 'auto'.
 */
export async function destroyFromCloudinary(
  publicId: string,
  resourceType: ResourceType = 'image'
) {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

/**
 * Reemplaza el contenido de un archivo existente manteniendo la misma URL.
 * Primero elimina el archivo existente y luego sube el nuevo con el mismo publicId.
 */
export async function replaceFileContent(
  existingUrl: string,
  newBuffer: Buffer,
  options: {
    resource_type?: ResourceType;
    filename_override?: string;
  } = {}
): Promise<UploadResult> {
  try {
    // Extraer publicId y resourceType de la URL existente
    const { publicId, resourceType } = parseCloudinaryFromUrl(existingUrl);
    
    // Eliminar el archivo existente
    await destroyFromCloudinary(publicId, resourceType);
    
    // Subir el nuevo archivo con el mismo publicId para mantener la URL
    const result = await uploadBufferToCloudinary(newBuffer, {
      folder: publicId.split('/').slice(0, -1).join('/'), // Extraer carpeta del publicId
      resource_type: options.resource_type || resourceType,
      filename_override: publicId.split('/').pop(), // Usar el mismo nombre de archivo
      use_filename: true,
      unique_filename: false,
      overwrite: true, // Forzar overwrite para mantener la URL
    });
    
    return result;
  } catch (err: any) {
    throw new Error(`Error al reemplazar archivo: ${err?.message || 'Desconocido'}`);
  }
}

/**
 * Dado un URL de Cloudinary, intenta extraer { publicId, resourceType }.
 * Admite variantes con carpetas.
 * Ej: https://res.cloudinary.com/<cloud>/image/upload/v1712345678/carpeta/nombre_xyz.jpg
 */
export function parseCloudinaryFromUrl(url: string): { publicId: string; resourceType: ResourceType } {
  // Detectar tipo por subpath (image/upload | video/upload | raw/upload)
  const m = url.match(/res\.cloudinary\.com\/[^/]+\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+?)\.(?:[a-z0-9]+)(\?|$)/i);
  if (m) {
    const resourceType = m[1] as ResourceType;
    const publicId = m[2];
    return { publicId, resourceType };
  }
  // fallback (auto)
  const fallback = url.match(/res\.cloudinary\.com\/[^/]+\/(?:[^/]+)\/upload\/(?:v\d+\/)?(.+?)\.(?:[a-z0-9]+)(\?|$)/i);
  if (fallback) {
    return { publicId: fallback[1], resourceType: 'auto' };
  }
  throw new Error('No se pudo parsear el URL de Cloudinary');
}
