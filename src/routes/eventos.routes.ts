import { Router } from 'express';
import {
  createEventoCtrl,
  listEventosCtrl,
  getEventoCtrl,
  updateEventoCtrl,
  deleteEventoCtrl,
  cambiarEstadoEventoCtrl
} from '../controllers/eventos.controller';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { asyncHandler } from '../middleware/asyncHandler';

const r = Router();

// Públicos - Rutas específicas primero
r.get('/activos', asyncHandler(listEventosCtrl)); // Eventos activos
r.get('/pasados', asyncHandler(listEventosCtrl)); // Eventos pasados
r.get('/proximos', asyncHandler(listEventosCtrl)); // Eventos próximos
r.get('/todos', asyncHandler(listEventosCtrl)); // Todos los eventos excepto finalizados
r.get('/', asyncHandler(listEventosCtrl)); // Todos los eventos
r.get('/:id', asyncHandler(getEventoCtrl)); // Evento por ID

// Protegidos (admin)
r.post('/', authenticateToken, authorizeRoles('admin'), asyncHandler(createEventoCtrl));
r.patch('/:id', authenticateToken, authorizeRoles('admin'), asyncHandler(updateEventoCtrl));
r.patch('/:id/estado', authenticateToken, authorizeRoles('admin'), asyncHandler(cambiarEstadoEventoCtrl));
r.delete('/:id', authenticateToken, authorizeRoles('admin'), asyncHandler(deleteEventoCtrl));

export default r;
