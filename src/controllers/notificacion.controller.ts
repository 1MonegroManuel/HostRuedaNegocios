import { Request, Response } from 'express';
import { z } from 'zod';
import { notificacionService } from '../services/notificacion.service';
import { asyncHandler } from '../middleware/asyncHandler';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'ObjectId inválido');

// Obtener notificaciones del usuario logueado
export const getNotificacionesUsuarioCtrl = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  const notificaciones = await notificacionService.getNotificacionesUsuario(userId);
  res.json({
    data: notificaciones,
    total: notificaciones.length
  });
});

// Obtener notificaciones de la empresa del usuario logueado
export const getNotificacionesEmpresaCtrl = asyncHandler(async (req: Request, res: Response) => {
  console.log('🔔 getNotificacionesEmpresaCtrl: Iniciando...');
  const userId = (req as any).user?.sub;
  console.log('🔔 getNotificacionesEmpresaCtrl: userId:', userId);
  
  if (!userId) {
    console.log('❌ getNotificacionesEmpresaCtrl: Usuario no autenticado');
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  try {
    // Obtener la empresa del usuario
    const Usuario = (await import('../models/usuario.model')).default;
    const Empresa = (await import('../models/empresas.model')).default;
    
    const usuario = await Usuario.findById(userId);
    console.log('🔔 getNotificacionesEmpresaCtrl: usuario encontrado:', usuario ? 'SÍ' : 'NO');
    
    if (!usuario) {
      console.log('❌ getNotificacionesEmpresaCtrl: Usuario no encontrado');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let empresaId: string | null = null;

    // Buscar empresa donde el usuario sea encargado
    console.log('🔔 getNotificacionesEmpresaCtrl: Buscando empresa donde usuario es encargado...');
    const empresaEncargado = await Empresa.findOne({ encargadoId: userId });
    if (empresaEncargado) {
      empresaId = String(empresaEncargado._id);
      console.log('🔔 getNotificacionesEmpresaCtrl: Usuario es encargado, empresaId:', empresaId);
    } else {
      // Si no es encargado, buscar empresa donde esté en personalIds
      console.log('🔔 getNotificacionesEmpresaCtrl: Buscando empresa para usuario personal...');
      const empresaPersonal = await Empresa.findOne({ personalIds: userId });
      if (empresaPersonal) {
        empresaId = String(empresaPersonal._id);
        console.log('🔔 getNotificacionesEmpresaCtrl: Empresa encontrada para personal, empresaId:', empresaId);
      } else {
        console.log('❌ getNotificacionesEmpresaCtrl: No se encontró empresa para este usuario');
      }
    }

    if (!empresaId) {
      console.log('❌ getNotificacionesEmpresaCtrl: Usuario no tiene empresa asociada');
      return res.status(404).json({ 
        error: 'Usuario no tiene empresa asociada',
        message: 'Este usuario no está asociado a ninguna empresa'
      });
    }

    console.log('🔔 getNotificacionesEmpresaCtrl: Obteniendo notificaciones para empresa:', empresaId);
    const notificaciones = await notificacionService.getNotificacionesEmpresa(empresaId);
    console.log('🔔 getNotificacionesEmpresaCtrl: Notificaciones encontradas:', notificaciones.length);
    
    res.json({
      data: notificaciones,
      total: notificaciones.length
    });
  } catch (error) {
    console.error('Error en getNotificacionesEmpresaCtrl:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Marcar notificación como leída
export const marcarNotificacionLeidaCtrl = asyncHandler(async (req: Request, res: Response) => {
  const { id } = z.object({ id: objectId }).parse(req.params);
  
  await notificacionService.marcarComoLeida(id);
  res.json({ success: true });
});

// Obtener notificaciones no leídas del usuario
export const getNotificacionesNoLeidasCtrl = asyncHandler(async (req: Request, res: Response) => {
  const userId = (req as any).user?.sub;
  if (!userId) {
    return res.status(401).json({ error: 'Usuario no autenticado' });
  }

  const Notificacion = (await import('../models/notificacion.model')).default;
  const notificaciones = await Notificacion.find({
    usuarioId: userId,
    estado: { $ne: 'leida' }
  })
    .populate('empresaId', 'nombre')
    .populate('eventoId', 'nombre')
    .sort({ creada_en: -1 })
    .limit(10);

  res.json({
    data: notificaciones,
    total: notificaciones.length
  });
});