#!/bin/bash

# Script de deployment para Render
echo "🚀 Iniciando deployment para Render..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# Ejecutar tests
echo "🧪 Ejecutando tests..."
npm test

if [ $? -ne 0 ]; then
    echo "❌ Tests fallaron. No se puede hacer deployment."
    exit 1
fi

# Compilar TypeScript
echo "🔨 Compilando TypeScript..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build falló. No se puede hacer deployment."
    exit 1
fi

# Verificar que el build se creó correctamente
if [ ! -d "dist" ]; then
    echo "❌ Error: Directorio dist no se creó."
    exit 1
fi

# Verificar archivos críticos
echo "✅ Verificando archivos críticos..."
if [ ! -f "dist/server.js" ]; then
    echo "❌ Error: dist/server.js no se encontró."
    exit 1
fi

if [ ! -f "dist/src/app.js" ]; then
    echo "❌ Error: dist/src/app.js no se encontró."
    exit 1
fi

echo "✅ Build completado exitosamente!"
echo "📋 Archivos generados:"
ls -la dist/

echo ""
echo "🎯 Próximos pasos:"
echo "1. Sube el código a GitHub"
echo "2. Conecta el repositorio en Render"
echo "3. Configura las variables de entorno"
echo "4. ¡Deploy!"
echo ""
echo "📖 Lee RENDER_DEPLOYMENT.md para instrucciones detalladas"
