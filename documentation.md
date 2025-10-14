# Rueda de Negocios API Documentation

## Descripción

API RESTful para la gestión de eventos de rueda de negocios, empresas participantes, usuarios, reuniones, notificaciones y más. Construida con Node.js, Express y MongoDB (Mongoose).

---

## Tabla de Contenidos

- [Instalación](#instalación)
- [Variables de Entorno](#variables-de-entorno)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Modelos de Datos](#modelos-de-datos)
- [Endpoints Principales](#endpoints-principales)
- [Middlewares](#middlewares)
- [Manejo de Errores](#manejo-de-errores)
- [Monitoreo y Métricas](#monitoreo-y-métricas)
- [Ejemplo de Uso](#ejemplo-de-uso)

---

## Instalación

1. Clona el repositorio.
2. Instala dependencias:

   ```bash
   npm install
   ```

3. Copia `.env.example` a `.env` y configura tus variables.
4. Inicia el servidor en desarrollo:

   ```bash
   npm run dev
   ```

---

## Variables de Entorno

Configura el archivo `.env`:

| Variable                | Descripción                                 | Ejemplo                                  |
|-------------------------|---------------------------------------------|------------------------------------------|
| NODE_ENV                | Entorno (`development`/`production`)        | development                              |
| PORT                    | Puerto de la API                            | 3001                                     |
| MONGODB_URI             | URI de conexión a MongoDB                   | mongodb+srv://user:pass@host/db          |
| DB_NAME                 | Nombre de la base de datos                  | rueda_negocios                           |
| ALLOWED_ORIGINS         | Orígenes permitidos para CORS               | http://localhost:3000                    |
| RATE_LIMIT_WINDOW_MS    | Ventana de rate limit (ms)                  | 900000                                   |
| RATE_LIMIT_MAX          | Máximo de requests por ventana              | 100                                      |
| JWT_SECRET              | Secreto para JWT                            | cambia_esta_cadena_larga                 |
| JWT_EXPIRES_IN          | Expiración del access token                 | 15m                                      |
| JWT_REFRESH_EXPIRES_IN  | Expiración del refresh token                | 7d                                       |

---

## Estructura de Carpetas

```
src/
  app.ts
  server.ts
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
```

---

## Modelos de Datos

### Usuario (`Usuario`)

- `nombre`, `apellido`, `email`, `username`, `passwordHash`, `telefono`, `tipoUsuario` (`personal`, `dueño`, `admin`), `creado_en`, `actualizado_en`

### Empresa (`Empresa`)

- `eventoId`, `nombre`, `rubro`, `descripcion`, `intereses`, `idPersonal`, `web_url`, `perfil_pdf_url`, `logo_url`, `estado`, `mesaId`, `comprobante`, `creado_en`, `actualizado_en`

### Evento (`Evento`)

- `nombre`, `descripcion`, `inicio`, `fin`, `duracion_minutos_reunion`, `numero_mesa`, `modo_mesas`, `creado_en`, `actualizado_en`

### Mesa (`Mesa`)

- `eventoId`, `codigo`, `es_virtual`, `activa`, `creado_en`, `actualizado_en`

### Reunión (`Reunion`)

- `eventoId`, `empresaAId`, `empresaBId`, `mesaId`, `inicio`, `fin`, `estado`, `retrasada`, `creado_en`, `actualizado_en`

### Solicitud de Reunión (`SolicitudReunion`)

- `eventoId`, `empresaSolicitanteId`, `empresaDestinoId`, `inicio_solicitado`, `fin_solicitado`, `estado`, `nota`, `creado_en`, `actualizado_en`

### Notificación (`Notificacion`)

- `usuarioId`, `asunto`, `cuerpo`, `data`, `leida`, `creado_en`, `actualizado_en`

### Archivo de Evento (`ArchivoEvento`)

- `eventoId`, `tipo`, `url`, `nombre_archivo`, `mime`, `creado_en`

### Encuesta de Reunión (`EncuestaReunion`)

- `reunionId`, `enviadoPorUsuarioId`, `logrado`, `valor_trato`, `creado_en`

---

## Endpoints Principales

### Auth

- `POST /api/auth/register` — Registro de usuario
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refrescar token
- `GET /api/auth/me` — Info usuario autenticado

### Eventos

- `GET /api/eventos` — Listar eventos
- `POST /api/eventos` — Crear evento (admin)

### Empresas

- `GET /api/empresas?eventoId=...` — Listar empresas (por evento)
- `POST /api/empresas` — Crear empresa (autenticado)

---

## Middlewares

- **Autenticación JWT**: `authenticateToken`
- **Autorización por rol**: `authorizeRoles`
- **Rate Limit**: `apiLimiter`
- **CORS**: `corsMiddleware`
- **Logger**: `reqResConsoleLogger`
- **Manejo de errores**: `errorHandler`
- **404 Not Found**: `notFound`
- **Async Handler**: `asyncHandler`

---

## Manejo de Errores

- Respuestas JSON con campo `error`.
- Errores de validación, autenticación y autorización gestionados por middlewares.
- Errores inesperados logueados en consola.

---

## Monitoreo y Métricas

- **/metrics**: Exposición de métricas Prometheus (`prom-client`)
- **/health**: Endpoint de salud

---

## Ejemplo de Uso

### Registro

```http
POST /api/auth/register
Content-Type: application/json

{
  "nombre": "Juan",
  "apellido": "Pérez",
  "email": "juan@ejemplo.com",
  "username": "juanp",
  "password": "123456"
}
```

### Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "identifier": "juanp",
  "password": "123456"
}
```

### Listar Eventos

```http
GET /api/eventos
Authorization: Bearer <token>
```

---

## Notas

- Todos los endpoints `/api/*` devuelven JSON.
- Para endpoints protegidos, enviar header `Authorization: Bearer <token>`.
- El sistema usa validación con Zod y Mongoose.

---

© 2025 Rueda de