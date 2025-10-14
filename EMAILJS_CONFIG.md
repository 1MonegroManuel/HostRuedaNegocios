# 📧 Configuración EmailJS para Frontend

## 🔧 Variables de Entorno para Frontend

Crea un archivo `.env` en la carpeta `HostRuedaNegocios/` con:

```env
# EmailJS Configuration
VITE_EMAILJS_SERVICE_ID=service_mp1om1p
VITE_EMAILJS_TEMPLATE_ID=template_q70lbpb
VITE_EMAILJS_PUBLIC_KEY=TpN5xx1_R9Qp663u3

# API Configuration
VITE_API_URL=https://tu-backend-en-render.com/api
```

## 📦 Instalación de EmailJS

```bash
npm install @emailjs/browser
```

## 🚀 Uso en React

```typescript
// services/emailService.ts
import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

export const sendEmail = async (templateParams: any) => {
  try {
    const result = await emailjs.send(
      SERVICE_ID,
      TEMPLATE_ID,
      templateParams,
      PUBLIC_KEY
    );
    console.log('Email enviado:', result.text);
    return true;
  } catch (error) {
    console.error('Error enviando email:', error);
    return false;
  }
};
```

## 📋 Templates de EmailJS

### 1. Template de Recuperación de Contraseña
- **Template ID**: `template_q70lbpb`
- **Variables**:
  - `user_email`
  - `reset_code`
  - `user_name`

### 2. Template de Notificación de Reunión
- **Variables**:
  - `user_email`
  - `empresa_name`
  - `meeting_date`
  - `meeting_time`

## 🔒 Seguridad

- Las claves de EmailJS son públicas por diseño
- No expongas datos sensibles en los templates
- Usa validación en el backend para códigos de reset

## 📝 Notas

- EmailJS funciona directamente desde el frontend
- No necesita configuración en el backend
- Ideal para notificaciones simples y formularios de contacto
