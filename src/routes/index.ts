import { Router } from 'express';

// Auth + Usuario
import authRoutes from './auth.routes';
import usuarioRoutes from './usuario.routes';

// Núcleo del evento
import eventosRoutes from './eventos.routes';
import archivoEventoRoutes from './archivoEvento.routes';
import mesaRoutes from './mesa.route';
import empresasRoutes from './empresas.routes';
import solicitudesReunionRoutes from './solicitudesReunion.route';
import encuestaRoutes from './encuesta.route';

// Storage (opcional)
import storageRoutes from './storage.routes';

// Notificaciones (nuevo)
import notificacionRoutes from './notificacion.routes';

const api = Router();

// Montaje con prefijos consistentes
api.use('/auth', authRoutes);
api.use('/usuarios', usuarioRoutes);

api.use('/eventos', eventosRoutes);
api.use('/archivos-evento', archivoEventoRoutes);
api.use('/mesas', mesaRoutes);
api.use('/empresas', empresasRoutes);
api.use('/solicitudes', solicitudesReunionRoutes);
api.use('/encuestas', encuestaRoutes);

api.use('/storage', storageRoutes);

api.use('/notificaciones', notificacionRoutes);

export default api;
