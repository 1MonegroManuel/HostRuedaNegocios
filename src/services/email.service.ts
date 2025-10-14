import { env } from '../config/env';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private resendApiKey: string | null = null;

  constructor() {
    this.initializeResend();
  }

  private initializeResend() {
    if (env.RESEND_API_KEY) {
      this.resendApiKey = env.RESEND_API_KEY;
      console.log('📧 Resend configurado correctamente');
    } else {
      console.log('⚠️  Resend no configurado. Las notificaciones por email estarán deshabilitadas.');
    }
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.resendApiKey) {
      console.log('⚠️  No se puede enviar email: Resend no configurado');
      return false;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Rueda de Negocios <noreply@ruedanegociosbeni.com>',
          to: [options.to],
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Email enviado exitosamente a ${options.to}:`, result.id);
        return true;
      } else {
        console.error('❌ Error enviando email:', await response.text());
        return false;
      }
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return false;
    }
  }

  // Plantillas de email predefinidas
  async sendPasswordResetEmail(to: string, resetCode: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; text-align: center;">
          <h2 style="color: #1e4b46; margin-bottom: 20px;">Código de Recuperación</h2>
          <p style="color: #333; font-size: 16px; margin-bottom: 30px;">
            Has solicitado restablecer tu contraseña. Usa el siguiente código:
          </p>
          
          <div style="background-color: #1e4b46; color: white; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
            ${resetCode}
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            ⏰ Este código expira en 15 minutos
          </p>
          
          <p style="color: #666; font-size: 14px; margin-top: 20px;">
            Si no solicitaste este cambio, puedes ignorar este email.
          </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #888; font-size: 12px;">
          Rueda de Negocios Beni
        </div>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: 'Código de Recuperación - Rueda de Negocios',
      html,
      text: `Tu código de recuperación es: ${resetCode}. Este código expira en 15 minutos.`,
    });
  }

  async sendEmployeeCredentialsEmail(to: string, username: string, password: string, empresaNombre: string): Promise<boolean> {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e4b46;">Bienvenido a Rueda de Negocios</h2>
        <p>Has sido registrado como empleado de <strong>${empresaNombre}</strong>.</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e4b46;">Tus credenciales:</h3>
          <p><strong>Usuario:</strong> ${username}</p>
          <p><strong>Contraseña:</strong> ${password}</p>
        </div>
        <p>Puedes acceder a la plataforma en: <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}">Rueda de Negocios</a></p>
        <p style="color: #666; font-size: 14px;">
          Por seguridad, te recomendamos cambiar tu contraseña después del primer acceso.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject: `Credenciales de acceso - ${empresaNombre}`,
      html,
      text: `Usuario: ${username}\nContraseña: ${password}\nEmpresa: ${empresaNombre}`,
    });
  }

  async sendMeetingNotificationEmail(to: string, tipo: 'aceptada' | 'rechazada' | 'proxima', empresaSolicitante: string, fecha?: string, hora?: string): Promise<boolean> {
    let subject = '';
    let message = '';

    switch (tipo) {
      case 'aceptada':
        subject = `Solicitud de reunión aceptada - ${empresaSolicitante}`;
        message = `Tu solicitud de reunión con ${empresaSolicitante} ha sido aceptada.`;
        if (fecha && hora) {
          message += ` La reunión está programada para el ${fecha} a las ${hora}.`;
        }
        break;
      case 'rechazada':
        subject = `Solicitud de reunión rechazada - ${empresaSolicitante}`;
        message = `Tu solicitud de reunión con ${empresaSolicitante} ha sido rechazada.`;
        break;
      case 'proxima':
        subject = `Recordatorio: Reunión próxima - ${empresaSolicitante}`;
        message = `Tienes una reunión próxima con ${empresaSolicitante}.`;
        if (fecha && hora) {
          message += ` La reunión es el ${fecha} a las ${hora}.`;
        }
        break;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e4b46;">Notificación de Reunión</h2>
        <p>${message}</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Empresa:</strong> ${empresaSolicitante}</p>
          ${fecha ? `<p><strong>Fecha:</strong> ${fecha}</p>` : ''}
          ${hora ? `<p><strong>Hora:</strong> ${hora}</p>` : ''}
        </div>
        <p>Puedes ver más detalles en la plataforma: <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}">Rueda de Negocios</a></p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: message,
    });
  }
}

export const emailService = new EmailService();
