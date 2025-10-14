import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getNotificacionesUsuarioCtrl,
  getNotificacionesEmpresaCtrl,
  marcarNotificacionLeidaCtrl,
  getNotificacionesNoLeidasCtrl
} from '../controllers/notificacion.controller';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Obtener notificaciones del usuario logueado
router.get('/usuario', getNotificacionesUsuarioCtrl);

// Obtener notificaciones de la empresa del usuario logueado
router.get('/empresa', getNotificacionesEmpresaCtrl);

// Obtener notificaciones no leídas del usuario
router.get('/no-leidas', getNotificacionesNoLeidasCtrl);

// Marcar notificación como leída
router.patch('/:id/leida', marcarNotificacionLeidaCtrl);

export default router;
