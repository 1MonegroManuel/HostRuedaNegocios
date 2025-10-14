import { Router } from 'express';
import { upload } from '../middleware/upload';
import { subirArchivoCtrl, eliminarArchivoCtrl, reemplazarArchivoCtrl } from '../controllers/upload.controller';
// Si quieres proteger: import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const r = Router();

// Subida (multipart/form-data). Field: "archivo"
r.post(
  '/',
  // authenticateToken, authorizeRoles('admin'),
  upload.single('archivo'),
  asyncHandler(subirArchivoCtrl)
);

// Reemplazar archivo existente manteniendo la URL
r.put(
  '/replace',
  // authenticateToken, authorizeRoles('admin'),
  upload.single('archivo'),
  asyncHandler(reemplazarArchivoCtrl)
);

// Borrado por URL de Cloudinary
r.delete(
  '/',
  // authenticateToken, authorizeRoles('admin'),
  asyncHandler(eliminarArchivoCtrl)
);

export default r;
