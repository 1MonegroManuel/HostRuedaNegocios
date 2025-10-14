import { Router } from 'express';
import {
  crearEmpresaCtrl,
  listarEmpresasCtrl,
  listarEmpresasPorEventoCtrl,
  obtenerEmpresaCtrl,
  actualizarEmpresaCtrl,
  eliminarEmpresaCtrl,
  getEmpresaByEncargadoCtrl,
  getEmpresaByPersonalCtrl,
} from '../controllers/empresas.controller';
// Si deseas proteger mutaciones, descomenta y ajusta a tu middleware real:
// import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const r = Router();

// Listados
// Filtros por query: ?page=&limit=&eventoId=&mesaId=&asignada=(true|false)&q=texto
r.get('/', asyncHandler(listarEmpresasCtrl));
r.get('/by-evento/:eventoId', asyncHandler(listarEmpresasPorEventoCtrl));
r.get('/by-encargado/:encargadoId', asyncHandler(getEmpresaByEncargadoCtrl));
r.get('/by-personal/:personalId', asyncHandler(getEmpresaByPersonalCtrl));
r.get('/:id', asyncHandler(obtenerEmpresaCtrl));

// Mutaciones
r.post('/', /*authenticateToken, authorizeRoles('admin'),*/ asyncHandler(crearEmpresaCtrl));
r.patch('/:id', /*authenticateToken, authorizeRoles('admin'),*/ asyncHandler(actualizarEmpresaCtrl));
r.delete('/:id', /*authenticateToken, authorizeRoles('admin'),*/ asyncHandler(eliminarEmpresaCtrl));

export default r;
