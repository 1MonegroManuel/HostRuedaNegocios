import { Router } from 'express';
import {
  crearMesaCtrl,
  listarMesasCtrl,
  listarMesasPorEventoCtrl,
  obtenerMesaCtrl,
  actualizarMesaCtrl,
  eliminarMesaCtrl,
  getMesasDisponiblesCtrl,
} from '../controllers/mesa.controller';
// Para proteger mutaciones, descomenta estas líneas y ajusta a tu middleware real:
// import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const r = Router();

// Listados
r.get('/', asyncHandler(listarMesasCtrl));                 // ?page=&limit=&eventoId=&activa=
r.get('/by-evento/:eventoId', asyncHandler(listarMesasPorEventoCtrl));
r.get('/disponibles/:eventoId', asyncHandler(getMesasDisponiblesCtrl));
r.get('/:id', asyncHandler(obtenerMesaCtrl));

// Mutaciones (agrega auth si corresponde)
r.post('/', /*authenticateToken, authorizeRoles('admin'),*/ asyncHandler(crearMesaCtrl));
r.patch('/:id', /*authenticateToken, authorizeRoles('admin'),*/ asyncHandler(actualizarMesaCtrl));
r.delete('/:id', /*authenticateToken, authorizeRoles('admin'),*/ asyncHandler(eliminarMesaCtrl));

export default r;