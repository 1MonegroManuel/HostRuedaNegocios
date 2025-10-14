import { Router } from 'express';
import {
  createUsuarioCtrl,
  listUsuariosCtrl,
  getUsuarioCtrl,
  updateUsuarioCtrl,
  deleteUsuarioCtrl
} from '../controllers/usuario.controller';
// Si deseas proteger mutaciones, descomenta estas líneas y agrega tus middlewares:
// import { authenticateToken, authorizeRoles } from '../middleware/auth';

const router = Router();

// Públicos o protegidos según tu política:
router.post('/', /*authenticateToken, authorizeRoles('admin'),*/ createUsuarioCtrl);
router.get('/', /*authenticateToken, authorizeRoles('admin'),*/ listUsuariosCtrl);
router.get('/:id', /*authenticateToken,*/ getUsuarioCtrl);
router.patch('/:id', /*authenticateToken, authorizeRoles('admin'),*/ updateUsuarioCtrl);
router.delete('/:id', /*authenticateToken, authorizeRoles('admin'),*/ deleteUsuarioCtrl);

export default router;
