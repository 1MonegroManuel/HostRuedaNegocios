import { Router } from 'express';
import {
  crearEncuestaCtrl,
  listarEncuestasCtrl,
  obtenerEncuestaCtrl,
  actualizarEncuestaCtrl,
  eliminarEncuestaCtrl,
  metricasEncuestasCtrl,
  verificarEncuestasPendientesCtrl,
  verificarEncuestaCompletaCtrl,
} from '../controllers/encuesta.controller';
// Si quieres proteger creación/edición: 
// import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const r = Router();

// Listado y métricas
// Filtros: ?page=&limit=&eventoId=&reunionId=&empresaId=
r.get('/', asyncHandler(listarEncuestasCtrl));
r.get('/metricas', asyncHandler(metricasEncuestasCtrl));

// Verificaciones
r.get('/pendientes/:empresaId', asyncHandler(verificarEncuestasPendientesCtrl));
r.get('/completa/:solicitudReunionId', asyncHandler(verificarEncuestaCompletaCtrl));

r.get('/:id', asyncHandler(obtenerEncuestaCtrl));

// Mutaciones
r.post('/', /*authenticateToken,*/ asyncHandler(crearEncuestaCtrl));
r.patch('/:id', /*authenticateToken,*/ asyncHandler(actualizarEncuestaCtrl));
r.delete('/:id', /*authenticateToken, authorizeRoles('admin'),*/ asyncHandler(eliminarEncuestaCtrl));

export default r;
