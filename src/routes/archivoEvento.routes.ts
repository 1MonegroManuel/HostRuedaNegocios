import { Router } from 'express';
import {
  crearArchivoCtrl,
  listarArchivosCtrl,
  listarArchivosPorEventoCtrl,
  obtenerArchivoCtrl,
  actualizarArchivoCtrl,
  eliminarArchivoCtrl
} from '../controllers/archivoEvento.controller';

const router = Router();

// Públicos
router.get('/', listarArchivosCtrl);
router.get('/by-evento/:eventoId', listarArchivosPorEventoCtrl);
router.get('/:id', obtenerArchivoCtrl);

// Mutaciones (si quieres proteger: agrega authenticateToken/authorizeRoles)
router.post('/', crearArchivoCtrl);
router.patch('/:id', actualizarArchivoCtrl);
router.delete('/:id', eliminarArchivoCtrl);

export default router;
