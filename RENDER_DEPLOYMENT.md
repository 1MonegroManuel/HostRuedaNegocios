# 🚀 Guía de Deployment en Render

## 📋 Prerrequisitos

1. **Cuenta en Render.com** (gratuita)
2. **Base de datos MongoDB** (MongoDB Atlas recomendado)
3. **Cuenta en Cloudinary** (opcional, para archivos)

## 🔧 Configuración Paso a Paso

### 1. Preparar el Repositorio

Asegúrate de que tu código esté en GitHub:

```bash
cd dist/
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/tu-usuario/rueda-negocios-backend.git
git push -u origin main
```

### 2. Crear Servicio en Render

1. Ve a [render.com](https://render.com) y haz login
2. Haz clic en "New +" → "Web Service"
3. Conecta tu repositorio de GitHub
4. Selecciona el repositorio del backend

### 3. Configurar el Servicio

**Configuración básica:**
- **Name**: `rueda-negocios-backend`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

### 4. Variables de Entorno

Configura las siguientes variables en Render:

#### 🔑 **Obligatorias**
```
NODE_ENV=production
PORT=3001
JWT_SECRET=tu-jwt-secret-super-seguro-minimo-32-caracteres
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/rueda-negocios
```

#### 🌐 **CORS (Importante)**
```
ALLOWED_ORIGINS=https://tu-frontend-en-render.com,http://localhost:3000
```

#### ☁️ **Cloudinary (Opcional)**
```
CLOUDINARY_CLOUD_NAME=tu-cloud-name
CLOUDINARY_API_KEY=tu-api-key
CLOUDINARY_API_SECRET=tu-api-secret
CLOUDINARY_FOLDER=rueda-negocios
```

#### 📧 **Email (Opcional)**
```
GMAIL_USER=tu-email@gmail.com
GMAIL_APP_PASSWORD=tu-app-password
```

### 5. Configuración Avanzada

#### **Auto-Deploy**
- ✅ Enable Auto-Deploy
- ✅ Branch: `main`

#### **Health Check**
- ✅ Health Check Path: `/health`

#### **Environment**
- ✅ Node Version: `18.x`

## 🗄️ Base de Datos MongoDB Atlas

### 1. Crear Cluster
1. Ve a [MongoDB Atlas](https://cloud.mongodb.com)
2. Crea un nuevo cluster (gratuito)
3. Configura acceso de red (0.0.0.0/0 para Render)
4. Crea usuario de base de datos

### 2. Obtener Connection String
```
mongodb+srv://usuario:password@cluster.mongodb.net/rueda-negocios?retryWrites=true&w=majority
```

## 🎯 URLs de la API

Una vez desplegado, tu API estará disponible en:
- **API Base**: `https://rueda-negocios-backend.onrender.com/api`
- **Health Check**: `https://rueda-negocios-backend.onrender.com/health`
- **Metrics**: `https://rueda-negocios-backend.onrender.com/metrics`

## 🔧 Troubleshooting

### Error: "Cannot find module"
```bash
# Verifica que el build se ejecute correctamente
npm run build
```

### Error: "CORS policy"
```bash
# Asegúrate de configurar ALLOWED_ORIGINS correctamente
ALLOWED_ORIGINS=https://tu-frontend.com
```

### Error: "MongoDB connection failed"
```bash
# Verifica la URI de MongoDB Atlas
# Asegúrate de que la IP esté en la whitelist
```

### Error: "JWT_SECRET not set"
```bash
# Genera un JWT_SECRET seguro
JWT_SECRET=$(openssl rand -base64 32)
```

## 📊 Monitoreo

### Health Check
```bash
curl https://tu-backend.onrender.com/health
```

### Logs
- Ve a tu servicio en Render
- Pestaña "Logs" para ver logs en tiempo real

### Metrics
```bash
curl https://tu-backend.onrender.com/metrics
```

## 🚀 Próximos Pasos

1. **Configurar Frontend** para apuntar a la nueva API
2. **Configurar Dominio Personalizado** (opcional)
3. **Configurar SSL** (automático en Render)
4. **Configurar Backup** de la base de datos

## 📝 Notas Importantes

- **Render Free Tier**: Se suspende después de 15 minutos de inactividad
- **Cold Start**: Primera request puede tardar ~30 segundos
- **Logs**: Se mantienen por 7 días en plan gratuito
- **Build Time**: Máximo 90 minutos en plan gratuito

## 🔗 Enlaces Útiles

- [Render Documentation](https://render.com/docs)
- [MongoDB Atlas](https://cloud.mongodb.com)
- [Cloudinary](https://cloudinary.com)
- [JWT.io](https://jwt.io) (para debug de tokens)
