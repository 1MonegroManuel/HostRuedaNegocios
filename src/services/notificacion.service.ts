import Notificacion, { NotificacionDoc, CanalNotificacion } from '../models/notificacion.model';
import { emailService } from './email.service';
import Usuario from '../models/usuario.model';
import Empresa from '../models/empresas.model';
import Evento from '../models/eventos.model';

interface CrearNotificacionParams {
  tipo: string;
  titulo: string;
  mensaje: string;
  canal: CanalNotificacion;
  eventoId?: string;
  solicitudReunionId?: string;
  empresaId?: string;
  usuarioId?: string;
  payload?: Record<string, any>;
}

class NotificacionService {
  
  async crearNotificacion(params: CrearNotificacionParams): Promise<NotificacionDoc> {
    const notificacion = new Notificacion({
      tipo: params.tipo,
      canal: params.canal,
      titulo: params.titulo,
      mensaje: params.mensaje,
      eventoId: params.eventoId,
      empresaId: params.empresaId,
      usuarioId: params.usuarioId,
      payload: params.payload,
      estado: 'pendiente'
    });

    const notificacionGuardada = await notificacion.save();
    
    // Si es email, intentar enviarlo inmediatamente
    if (params.canal === 'email' && params.usuarioId) {
      await this.enviarEmailNotificacion(notificacionGuardada);
    }

    console.log(`📧 Notificación creada: ${params.tipo} - ${params.canal}`);
    return notificacionGuardada;
  }

  private async enviarEmailNotificacion(notificacion: NotificacionDoc): Promise<void> {
    try {
      // Aquí necesitaríamos obtener el email del usuario
      // Por ahora solo marcamos como enviada si es email
      if (notificacion.canal === 'email') {
        notificacion.estado = 'enviada';
        await notificacion.save();
        console.log(`✅ Email enviado para notificación: ${notificacion.tipo}`);
      }
    } catch (error) {
      console.error('❌ Error enviando email de notificación:', error);
      notificacion.estado = 'fallida';
      await notificacion.save();
    }
  }

  async getNotificacionesUsuario(usuarioId: string): Promise<NotificacionDoc[]> {
    return Notificacion.find({ usuarioId })
      .populate('empresaId', 'nombre')
      .populate('eventoId', 'nombre')
      .sort({ creada_en: -1 })
      .limit(50);
  }

  async getNotificacionesEmpresa(empresaId: string): Promise<NotificacionDoc[]> {
    return Notificacion.find({ empresaId })
      .populate('usuarioId', 'username email')
      .populate('eventoId', 'nombre')
      .sort({ creada_en: -1 })
      .limit(50);
  }

  async marcarComoLeida(notificacionId: string): Promise<void> {
    await Notificacion.findByIdAndUpdate(notificacionId, { estado: 'leida' });
  }

  // Métodos específicos para diferentes tipos de notificaciones
  async notificarSolicitudAceptada(solicitudReunion: any, empresaObjetivoId: string): Promise<void> {
    const empresaSolicitante = solicitudReunion.empresaSolicitaId?.nombre || 'Empresa';
    
    await this.crearNotificacion({
      tipo: 'solicitud_aceptada',
      titulo: 'Solicitud de reunión aceptada',
      mensaje: `Tu solicitud de reunión con ${empresaSolicitante} ha sido aceptada.`,
      canal: 'app',
      empresaId: solicitudReunion.empresaSolicitaId?._id || solicitudReunion.empresaSolicitaId,
      eventoId: solicitudReunion.eventoId,
      solicitudReunionId: solicitudReunion._id,
      payload: {
        empresaObjetivo: empresaSolicitante,
        fechaReunion: solicitudReunion.inicioPropuesto,
        tipoReunion: solicitudReunion.tipoReunion
      }
    });
  }

  async notificarSolicitudRechazada(solicitudReunion: any, empresaObjetivoId: string): Promise<void> {
    const empresaSolicitante = solicitudReunion.empresaSolicitaId?.nombre || 'Empresa';
    
    await this.crearNotificacion({
      tipo: 'solicitud_rechazada',
      titulo: 'Solicitud de reunión rechazada',
      mensaje: `Tu solicitud de reunión con ${empresaSolicitante} ha sido rechazada.`,
      canal: 'app',
      empresaId: solicitudReunion.empresaSolicitaId?._id || solicitudReunion.empresaSolicitaId,
      eventoId: solicitudReunion.eventoId,
      solicitudReunionId: solicitudReunion._id,
      payload: {
        empresaObjetivo: empresaSolicitante,
        fechaReunion: solicitudReunion.inicioPropuesto
      }
    });
  }

  async notificarReunionProxima(solicitudReunion: any): Promise<void> {
    const empresaSolicitante = solicitudReunion.empresaSolicitaId?.nombre || 'Empresa';
    const empresaObjetivo = solicitudReunion.empresaObjetivoId?.nombre || 'Empresa';
    const fecha = solicitudReunion.inicioPropuesto ? new Date(solicitudReunion.inicioPropuesto).toLocaleDateString() : '';
    const hora = solicitudReunion.inicioPropuesto ? new Date(solicitudReunion.inicioPropuesto).toLocaleTimeString() : '';

    // Notificar a ambas empresas
    await Promise.all([
      // Para la empresa solicitante
      this.crearNotificacion({
        tipo: 'reunion_proxima',
        titulo: 'Reunión próxima',
        mensaje: `Tienes una reunión próxima con ${empresaObjetivo} el ${fecha} a las ${hora}.`,
        canal: 'app',
        empresaId: solicitudReunion.empresaSolicitaId?._id || solicitudReunion.empresaSolicitaId,
        eventoId: solicitudReunion.eventoId,
        solicitudReunionId: solicitudReunion._id,
        payload: {
          empresaObjetivo,
          fechaReunion: solicitudReunion.inicioPropuesto,
          tipoReunion: solicitudReunion.tipoReunion
        }
      }),
      // Para la empresa objetivo
      this.crearNotificacion({
        tipo: 'reunion_proxima',
        titulo: 'Reunión próxima',
        mensaje: `Tienes una reunión próxima con ${empresaSolicitante} el ${fecha} a las ${hora}.`,
        canal: 'app',
        empresaId: solicitudReunion.empresaObjetivoId?._id || solicitudReunion.empresaObjetivoId,
        eventoId: solicitudReunion.eventoId,
        solicitudReunionId: solicitudReunion._id,
        payload: {
          empresaObjetivo: empresaSolicitante,
          fechaReunion: solicitudReunion.inicioPropuesto,
          tipoReunion: solicitudReunion.tipoReunion
        }
      })
    ]);
  }

  async notificarNuevoEmpleado(usuarioId: string, empresaId: string, username: string, password: string, empresaNombre: string): Promise<void> {
    await this.crearNotificacion({
      tipo: 'empleado_registrado',
      titulo: 'Bienvenido a la plataforma',
      mensaje: `Has sido registrado como empleado de ${empresaNombre}.`,
      canal: 'app',
      usuarioId,
      empresaId,
      payload: {
        username,
        empresaNombre
      }
    });

    // También enviar email con credenciales
    try {
      const usuario = await Usuario.findById(usuarioId);
      if (usuario && usuario.email) {
        await emailService.sendEmployeeCredentialsEmail(usuario.email, username, password, empresaNombre);
      }
    } catch (error) {
      console.error('❌ Error enviando email de credenciales:', error);
    }
  }

  // ===== NOTIFICACIONES DE EMPRESAS =====

  // Notificar nueva empresa registrada a admins
  async notificarNuevaEmpresa(empresa: any): Promise<void> {
    try {
      // Obtener todos los administradores
      const admins = await Usuario.find({ tipoUsuario: 'admin' });
      
      // Notificar a cada admin
      await Promise.all(admins.map(admin => 
        this.crearNotificacion({
          tipo: 'nueva_empresa',
          titulo: 'Nueva empresa registrada',
          mensaje: `La empresa "${empresa.nombre}" se ha registrado y está pendiente de aprobación.`,
          canal: 'app',
          usuarioId: String(admin._id),
          empresaId: String(empresa._id),
          eventoId: String(empresa.eventoId),
          payload: {
            empresaNombre: empresa.nombre,
            empresaId: String(empresa._id),
            estado: empresa.estado
          }
        })
      ));

      console.log(`✅ Notificaciones enviadas a ${admins.length} admins sobre nueva empresa: ${empresa.nombre}`);
    } catch (error) {
      console.error('❌ Error notificando nueva empresa:', error);
    }
  }

  // Notificar cambio de estado de empresa
  async notificarCambioEstadoEmpresa(empresa: any, estadoAnterior: string, estadoNuevo: string): Promise<void> {
    try {
      // Notificar al encargado si existe
      if (empresa.encargadoId) {
        await this.crearNotificacion({
          tipo: 'estado_empresa_cambiado',
          titulo: `Estado de empresa actualizado: ${estadoNuevo}`,
          mensaje: `El estado de tu empresa "${empresa.nombre}" ha cambiado de ${estadoAnterior} a ${estadoNuevo}.`,
          canal: 'app',
          usuarioId: String(empresa.encargadoId),
          empresaId: String(empresa._id),
          eventoId: String(empresa.eventoId),
          payload: {
            empresaNombre: empresa.nombre,
            estadoAnterior,
            estadoNuevo
          }
        });
      }

      // Notificar a todos los empleados de la empresa
      if (empresa.personalIds && empresa.personalIds.length > 0) {
        await Promise.all(empresa.personalIds.map((personalId: any) => 
          this.crearNotificacion({
            tipo: 'estado_empresa_cambiado',
            titulo: `Estado de empresa actualizado: ${estadoNuevo}`,
            mensaje: `El estado de tu empresa "${empresa.nombre}" ha cambiado de ${estadoAnterior} a ${estadoNuevo}.`,
            canal: 'app',
            usuarioId: String(personalId),
            empresaId: String(empresa._id),
            eventoId: String(empresa.eventoId),
            payload: {
              empresaNombre: empresa.nombre,
              estadoAnterior,
              estadoNuevo
            }
          })
        ));
      }

      console.log(`✅ Notificaciones enviadas sobre cambio de estado de empresa: ${empresa.nombre}`);
    } catch (error) {
      console.error('❌ Error notificando cambio de estado de empresa:', error);
    }
  }

  // ===== NOTIFICACIONES DE SOLICITUDES DE REUNIÓN =====

  // Notificar nueva solicitud de reunión
  async notificarNuevaSolicitud(solicitud: any): Promise<void> {
    try {
      const empresaSolicitante = solicitud.empresaSolicitaId?.nombre || 'Empresa';
      const empresaObjetivo = solicitud.empresaObjetivoId?.nombre || 'Empresa';
      const fecha = solicitud.inicioPropuesto ? new Date(solicitud.inicioPropuesto).toLocaleDateString() : '';
      const hora = solicitud.inicioPropuesto ? new Date(solicitud.inicioPropuesto).toLocaleTimeString() : '';

      // Notificar a la empresa objetivo
      await this.crearNotificacion({
        tipo: 'nueva_solicitud_reunion',
        titulo: 'Nueva solicitud de reunión',
        mensaje: `${empresaSolicitante} ha solicitado una reunión contigo para el ${fecha} a las ${hora}.`,
        canal: 'app',
        empresaId: String(solicitud.empresaObjetivoId),
        eventoId: String(solicitud.eventoId),
        solicitudReunionId: String(solicitud._id),
        payload: {
          empresaSolicitante,
          fechaReunion: solicitud.inicioPropuesto,
          tipoReunion: solicitud.tipoReunion
        }
      });

      // Notificar a admins sobre la nueva solicitud
      const admins = await Usuario.find({ tipoUsuario: 'admin' });
      await Promise.all(admins.map(admin => 
        this.crearNotificacion({
          tipo: 'nueva_solicitud_reunion',
          titulo: 'Nueva solicitud de reunión',
          mensaje: `${empresaSolicitante} ha solicitado una reunión con ${empresaObjetivo}.`,
          canal: 'app',
          usuarioId: String(admin._id),
          eventoId: String(solicitud.eventoId),
          solicitudReunionId: String(solicitud._id),
          payload: {
            empresaSolicitante,
            empresaObjetivo,
            fechaReunion: solicitud.inicioPropuesto
          }
        })
      ));

      console.log(`✅ Notificaciones enviadas sobre nueva solicitud de reunión`);
    } catch (error) {
      console.error('❌ Error notificando nueva solicitud:', error);
    }
  }

  // ===== NOTIFICACIONES DE EVENTOS =====

  // Notificar inicio de evento a todas las empresas
  async notificarInicioEvento(evento: any): Promise<void> {
    try {
      // Obtener todas las empresas del evento
      const empresas = await Empresa.find({ eventoId: evento._id, estado: 'aceptado' });

      // Notificar a cada empresa
      await Promise.all(empresas.map(async (empresa) => {
        // Notificar al encargado
        if (empresa.encargadoId) {
          await this.crearNotificacion({
            tipo: 'evento_iniciado',
            titulo: `¡El evento "${evento.nombre}" ha comenzado!`,
            mensaje: `El evento "${evento.nombre}" ha comenzado. ¡Es hora de participar en las reuniones!`,
            canal: 'app',
            usuarioId: String(empresa.encargadoId),
            empresaId: String(empresa._id),
            eventoId: String(evento._id),
            payload: {
              eventoNombre: evento.nombre,
              fechaInicio: evento.inicio
            }
          });
        }

        // Notificar a todos los empleados
        if (empresa.personalIds && empresa.personalIds.length > 0) {
          await Promise.all(empresa.personalIds.map((personalId: any) => 
            this.crearNotificacion({
              tipo: 'evento_iniciado',
              titulo: `¡El evento "${evento.nombre}" ha comenzado!`,
              mensaje: `El evento "${evento.nombre}" ha comenzado. ¡Es hora de participar en las reuniones!`,
              canal: 'app',
              usuarioId: String(personalId),
              empresaId: String(empresa._id),
              eventoId: String(evento._id),
              payload: {
                eventoNombre: evento.nombre,
                fechaInicio: evento.inicio
              }
            })
          ));
        }
      }));

      console.log(`✅ Notificaciones enviadas sobre inicio de evento: ${evento.nombre}`);
    } catch (error) {
      console.error('❌ Error notificando inicio de evento:', error);
    }
  }

  // Notificar fin de evento
  async notificarFinEvento(evento: any): Promise<void> {
    try {
      // Obtener todas las empresas del evento
      const empresas = await Empresa.find({ eventoId: evento._id, estado: 'aceptado' });

      // Notificar a cada empresa
      await Promise.all(empresas.map(async (empresa) => {
        // Notificar al encargado
        if (empresa.encargadoId) {
          await this.crearNotificacion({
            tipo: 'evento_finalizado',
            titulo: `Evento "${evento.nombre}" finalizado`,
            mensaje: `El evento "${evento.nombre}" ha finalizado. ¡Gracias por participar!`,
            canal: 'app',
            usuarioId: String(empresa.encargadoId),
            empresaId: String(empresa._id),
            eventoId: String(evento._id),
            payload: {
              eventoNombre: evento.nombre,
              fechaFin: evento.fin
            }
          });
        }

        // Notificar a todos los empleados
        if (empresa.personalIds && empresa.personalIds.length > 0) {
          await Promise.all(empresa.personalIds.map((personalId: any) => 
            this.crearNotificacion({
              tipo: 'evento_finalizado',
              titulo: `Evento "${evento.nombre}" finalizado`,
              mensaje: `El evento "${evento.nombre}" ha finalizado. ¡Gracias por participar!`,
              canal: 'app',
              usuarioId: String(personalId),
              empresaId: String(empresa._id),
              eventoId: String(evento._id),
              payload: {
                eventoNombre: evento.nombre,
                fechaFin: evento.fin
              }
            })
          ));
        }
      }));

      console.log(`✅ Notificaciones enviadas sobre fin de evento: ${evento.nombre}`);
    } catch (error) {
      console.error('❌ Error notificando fin de evento:', error);
    }
  }

  // ===== NOTIFICACIONES DE USUARIOS =====

  // Notificar asignación de encargado
  async notificarEncargadoAsignado(usuarioId: string, empresaId: string, empresaNombre: string): Promise<void> {
    try {
      await this.crearNotificacion({
        tipo: 'encargado_asignado',
        titulo: 'Has sido asignado como encargado',
        mensaje: `Has sido asignado como encargado de la empresa "${empresaNombre}".`,
        canal: 'app',
        usuarioId,
        empresaId,
        payload: {
          empresaNombre,
          rol: 'encargado'
        }
      });

      console.log(`✅ Notificación enviada a encargado asignado: ${usuarioId}`);
    } catch (error) {
      console.error('❌ Error notificando encargado asignado:', error);
    }
  }

  // ===== NOTIFICACIONES DE MESAS =====

  // Notificar asignación de mesa
  async notificarMesaAsignada(empresa: any, mesa: any): Promise<void> {
    try {
      // Notificar al encargado
      if (empresa.encargadoId) {
        await this.crearNotificacion({
          tipo: 'mesa_asignada',
          titulo: 'Mesa asignada',
          mensaje: `Se te ha asignado la mesa "${mesa.nombre || `Mesa ${mesa.numero}`}" para el evento.`,
          canal: 'app',
          usuarioId: String(empresa.encargadoId),
          empresaId: String(empresa._id),
          eventoId: String(empresa.eventoId),
          payload: {
            mesaNombre: mesa.nombre || `Mesa ${mesa.numero}`,
            mesaNumero: mesa.numero,
            capacidad: mesa.capacidad
          }
        });
      }

      // Notificar a todos los empleados
      if (empresa.personalIds && empresa.personalIds.length > 0) {
        await Promise.all(empresa.personalIds.map((personalId: any) => 
          this.crearNotificacion({
            tipo: 'mesa_asignada',
            titulo: 'Mesa asignada',
            mensaje: `Se ha asignado la mesa "${mesa.nombre || `Mesa ${mesa.numero}`}" a tu empresa para el evento.`,
            canal: 'app',
            usuarioId: String(personalId),
            empresaId: String(empresa._id),
            eventoId: String(empresa.eventoId),
            payload: {
              mesaNombre: mesa.nombre || `Mesa ${mesa.numero}`,
              mesaNumero: mesa.numero,
              capacidad: mesa.capacidad
            }
          })
        ));
      }

      console.log(`✅ Notificaciones enviadas sobre asignación de mesa`);
    } catch (error) {
      console.error('❌ Error notificando asignación de mesa:', error);
    }
  }

  // ===== MÉTODO AUXILIAR PARA NOTIFICACIONES MASIVAS =====

  // Notificar a todos los usuarios de una empresa
  async notificarATodosUsuariosEmpresa(empresaId: string, tipo: string, titulo: string, mensaje: string, payload?: any): Promise<void> {
    try {
      const empresa = await Empresa.findById(empresaId);
      if (!empresa) return;

      const notificaciones = [];

      // Notificar al encargado
      if (empresa.encargadoId) {
        notificaciones.push(
          this.crearNotificacion({
            tipo,
            titulo,
            mensaje,
            canal: 'app',
            usuarioId: String(empresa.encargadoId),
            empresaId: String(empresa._id),
            eventoId: String(empresa.eventoId),
            payload
          })
        );
      }

      // Notificar a todos los empleados
      if (empresa.personalIds && empresa.personalIds.length > 0) {
        empresa.personalIds.forEach((personalId: any) => {
          notificaciones.push(
            this.crearNotificacion({
              tipo,
              titulo,
              mensaje,
              canal: 'app',
              usuarioId: String(personalId),
              empresaId: String(empresa._id),
              eventoId: String(empresa.eventoId),
              payload
            })
          );
        });
      }

      await Promise.all(notificaciones);
      console.log(`✅ Notificaciones enviadas a todos los usuarios de la empresa: ${empresa.nombre}`);
    } catch (error) {
      console.error('❌ Error notificando a usuarios de empresa:', error);
    }
  }
}

export const notificacionService = new NotificacionService();
