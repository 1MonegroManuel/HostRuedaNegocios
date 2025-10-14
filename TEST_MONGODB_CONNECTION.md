# 🔍 TEST - Verificar Conexión MongoDB

## 📋 **Pasos para Verificar:**

### **1. Verificar en MongoDB Atlas:**

#### **A. Ve a tu Dashboard:**
- URL: https://cloud.mongodb.com
- Cluster: "RuedaNegocios"

#### **B. Verificar Usuario:**
1. Ve a "Database Access"
2. Busca usuario "Admin"
3. Verifica que existe y tiene permisos

#### **C. Verificar Red:**
1. Ve a "Network Access"
2. Debe tener regla: `0.0.0.0/0` (Allow access from anywhere)

### **2. Obtener Connection String Correcto:**

#### **A. Método Automático:**
1. Ve a "Database" → "Connect"
2. Selecciona "Connect your application"
3. Driver: "Node.js"
4. Version: "4.1 or later"
5. Copia el connection string

#### **B. Método Manual:**
```
mongodb+srv://<username>:<password>@ruedanegocios.urzdhtv.mongodb.net/?retryWrites=true&w=majority
```

### **3. Credenciales Posibles:**

#### **Opción 1 - Usuario Admin:**
```
Username: Admin
Password: admin123
URI: mongodb+srv://Admin:admin123@ruedanegocios.urzdhtv.mongodb.net/?retryWrites=true&w=majority&appName=RuedaNegocios
```

#### **Opción 2 - Usuario Root:**
```
Username: root
Password: [tu-password-root]
URI: mongodb+srv://root:[password]@ruedanegocios.urzdhtv.mongodb.net/?retryWrites=true&w=majority&appName=RuedaNegocios
```

### **4. Crear Usuario Nuevo (Recomendado):**

#### **A. Crear Usuario:**
1. "Database Access" → "Add New Database User"
2. Username: `render_user`
3. Password: `render_password_123`
4. Privileges: "Read and write to any database"

#### **B. Nueva URI:**
```
MONGODB_URI=mongodb+srv://render_user:render_password_123@ruedanegocios.urzdhtv.mongodb.net/?retryWrites=true&w=majority&appName=RuedaNegocios
```

### **5. Configurar en Render:**

#### **Variables de Entorno:**
```
NODE_ENV=production
MONGODB_URI=[tu-uri-correcta]
```

## 🔧 **Verificar Conexión:**

### **A. Desde MongoDB Compass:**
1. Instala MongoDB Compass
2. Conecta con tu URI
3. Verifica que funciona

### **B. Desde Terminal:**
```bash
mongosh "mongodb+srv://username:password@ruedanegocios.urzdhtv.mongodb.net/"
```

## ⚠️ **Problemas Comunes:**

### **1. Usuario No Existe:**
- Crear nuevo usuario en MongoDB Atlas

### **2. Contraseña Incorrecta:**
- Resetear contraseña en MongoDB Atlas

### **3. Sin Permisos de Red:**
- Agregar regla `0.0.0.0/0` en Network Access

### **4. Cluster Inactivo:**
- Verificar que el cluster esté corriendo

## 🎯 **Solución Rápida:**

### **1. Crear Usuario Nuevo:**
- Username: `render_user`
- Password: `render_password_123`
- Privileges: "Read and write to any database"

### **2. Configurar en Render:**
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://render_user:render_password_123@ruedanegocios.urzdhtv.mongodb.net/?retryWrites=true&w=majority&appName=RuedaNegocios
```

### **3. Deploy:**
- Guardar variables en Render
- Manual Deploy

---
**Estado**: 🔍 Verificar credenciales MongoDB Atlas
**Acción**: Crear usuario nuevo o verificar existente
