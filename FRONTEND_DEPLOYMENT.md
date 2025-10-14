# 🚀 Configuración Frontend para Render

## ✅ **Configuración Completada:**

### **1. API URL Actualizada:**
- ✅ **Backend URL**: `https://hostruedanegocios.onrender.com/api`
- ✅ **Configuración**: Actualizada en `apiService/config.ts` y `apiService/client.ts`

### **2. CORS Configurado:**
- ✅ **Backend**: Actualizado para permitir conexiones del frontend
- ✅ **Dominios permitidos**: `https://hostruedanegocios.onrender.com`

## 📋 **Para Deployar Frontend en Render:**

### **1. Preparar Repositorio:**
```bash
cd HostRuedaNegocios/
git add .
git commit -m "Frontend configurado para conectar con backend"
git push origin main
```

### **2. Crear Servicio en Render:**
1. Ve a [render.com](https://render.com)
2. New Static Site
3. Conecta tu repositorio GitHub
4. Selecciona el repositorio del frontend

### **3. Configuración en Render:**
- **Name**: `rueda-negocios-frontend`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Node Version**: `18.x`

### **4. Variables de Entorno (Opcionales):**
```
VITE_API_URL=https://hostruedanegocios.onrender.com/api
VITE_EMAILJS_SERVICE_ID=service_mp1om1p
VITE_EMAILJS_TEMPLATE_ID=template_q70lbpb
VITE_EMAILJS_PUBLIC_KEY=TpN5xx1_R9Qp663u3
```

## 🔧 **Configuración Automática:**

### **Frontend:**
- ✅ **API URL**: Configurada para tu backend
- ✅ **EmailJS**: Configurado para notificaciones
- ✅ **CORS**: Compatible con backend

### **Backend:**
- ✅ **CORS**: Permite conexiones del frontend
- ✅ **API**: Funcionando en `https://hostruedanegocios.onrender.com`

## 🎯 **URLs Esperadas:**

### **Después del Deploy:**
- **Frontend**: `https://tu-frontend.onrender.com`
- **Backend**: `https://hostruedanegocios.onrender.com/api`
- **Health Check**: `https://hostruedanegocios.onrender.com/health`

## 🧪 **Testing de Conexión:**

### **1. Verificar Backend:**
```bash
curl https://hostruedanegocios.onrender.com/health
```

### **2. Verificar API:**
```bash
curl https://hostruedanegocios.onrender.com/api
```

### **3. Verificar CORS:**
- El frontend debería poder hacer peticiones al backend
- Sin errores de CORS en la consola del navegador

## 🔍 **Troubleshooting:**

### **Si hay errores de CORS:**
1. Verificar que el frontend esté en el dominio correcto
2. Actualizar `ALLOWED_ORIGINS` en el backend
3. Verificar que el backend esté funcionando

### **Si hay errores de conexión:**
1. Verificar que la URL del backend sea correcta
2. Verificar que el backend esté funcionando
3. Revisar logs en Render Dashboard

## 📁 **Archivos Modificados:**
- ✅ `src/apiService/config.ts` - API URL actualizada
- ✅ `src/apiService/client.ts` - API URL actualizada
- ✅ `FRONTEND_ENV_TEMPLATE.txt` - Variables de entorno

---
**Estado**: ✅ Frontend configurado para conectar con backend
**Backend**: ✅ Funcionando en `https://hostruedanegocios.onrender.com`
**Próximo paso**: Deployar frontend en Render
