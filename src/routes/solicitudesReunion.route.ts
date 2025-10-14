import { Router } from 'express';
import {
  crearSolicitudCtrl,
  listarSolicitudesCtrl,
  obtenerSolicitudCtrl,
  actualizarSolicitudCtrl,
  eliminarSolicitudCtrl,
  setEstadoSolicitudCtrl,
  verificarSolicitudExistenteCtrl,
} from '../controllers/solicitudesReunion.controller';
// Para proteger mutaciones, conecta tus middlewares cuando quieras:
// import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const r = Router();

// Listado y consulta
// Query soportadas: ?page=&limit=&eventoId=&empresaId=&estado=
r.get('/', asyncHandler(listarSolicitudesCtrl));
r.get('/verificar-existente', asyncHandler(verificarSolicitudExistenteCtrl));
r.get('/:id', asyncHandler(obtenerSolicitudCtrl));

// Mutaciones
r.post('/', /*authenticateToken,*/ asyncHandler(crearSolicitudCtrl));
r.patch('/:id', /*authenticateToken,*/ asyncHandler(actualizarSolicitudCtrl));
r.delete('/:id', /*authenticateToken,*/ asyncHandler(eliminarSolicitudCtrl));

// CRUD+ (estado)
r.patch('/:id/estado', /*authenticateToken,*/ asyncHandler(setEstadoSolicitudCtrl));


export default r;
