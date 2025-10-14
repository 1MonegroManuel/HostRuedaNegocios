import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';

// Define the notificacion interface and schema
type CanalNotificacion = 'app'|'email'|'sms'|'whatsapp';
type EstadoNotificacion = 'pendiente'|'enviada'|'leida'|'fallida';

interface NotificacionDoc extends Document {
  eventoId?: mongoose.Types.ObjectId | null;
  reunionId?: mongoose.Types.ObjectId | null;
  empresaId?: mongoose.Types.ObjectId | null;
  usuarioId?: mongoose.Types.ObjectId | null;
  tipo: string;
  canal: CanalNotificacion;
  titulo: string;
  mensaje: string;
  payload?: Record<string, any> | null;
  estado: EstadoNotificacion;
  intento?: number | null;
  creada_en: Date;
  actualizada_en: Date;
}

const NotificacionSchema = new Schema<NotificacionDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', default: null, index: true },
  reunionId: { type: Schema.Types.ObjectId, ref: 'Reunion', default: null, index: true },
  empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', default: null, index: true },
  usuarioId: { type: Schema.Types.ObjectId, ref: 'Usuario', default: null, index: true },
  tipo: { type: String, required: true, trim: true },
  canal: { type: String, enum: ['app','email','sms','whatsapp'], required: true, index: true },
  titulo: { type: String, required: true, trim: true },
  mensaje: { type: String, required: true, trim: true },
  payload: { type: Schema.Types.Mixed, default: null },
  estado: { type: String, enum: ['pendiente','enviada','leida','fallida'], default: 'pendiente', index: true },
  intento: { type: Number, default: null, min: 0 },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

describe('Notificaciones - flujo CRUD + estados', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let Notificacion: Model<NotificacionDoc>;
  let Evento: Model<any>;
  let Reunion: Model<any>;
  let Empresa: Model<any>;
  let Usuario: Model<any>;
  let adminToken = '';
  let eventoId = '';
  let reunionId = '';
  let empresaId = '';
  let usuarioId = '';

  beforeAll(async () => {
    // Levantar Mongo en memoria PRIMERO
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    // ENV necesarias ANTES del import de app/env
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test-secret-1234567890';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    // Recargar módulos para que tomen estas env
    jest.resetModules();

    // Conectar Mongoose a la base de datos en memoria
    await mongoose.connect(uri);
    
    // Wait a bit to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create the models
    const EventoSchema = new Schema({
      nombre: { type: String, required: true },
      descripcion: { type: String, required: true },
      inicio: { type: Date, required: true },
      fin: { type: Date, required: true },
      duracion_minutos_reunion: { type: Number, required: true },
      modo_mesas: { type: String, enum: ['FIJA_POR_EMPRESA','POR_REUNION'], required: true }
    }, { timestamps: true });

    const ReunionSchema = new Schema({
      eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true },
      mesaId: { type: Schema.Types.ObjectId, ref: 'Mesa', required: true },
      empresaAId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
      empresaBId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true },
      inicio: { type: Date, required: true },
      fin: { type: Date, required: true },
      estado: { type: String, enum: ['programada','confirmada','completada','cancelada','no_show'], default: 'programada' },
      notas: { type: String, default: null }
    }, { timestamps: true });

    const EmpresaSchema = new Schema({
      eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true },
      mesaId: { type: Schema.Types.ObjectId, ref: 'Mesa', default: null },
      nombre: { type: String, required: true },
      nit: { type: String, default: null },
      rubro: { type: String, default: null },
      representante: { type: String, default: null },
      telefono: { type: String, default: null },
      email: { type: String, default: null }
    }, { timestamps: true });

    const UsuarioSchema = new Schema({
      nombre: { type: String, required: true },
      apellido: { type: String, required: true },
      email: { type: String, required: true, unique: true },
      username: { type: String, required: true, unique: true },
      passwordHash: { type: String, required: true },
      telefono: { type: String, default: null },
      tipoUsuario: { type: String, enum: ['personal','dueño','admin'], default: 'personal' }
    }, { timestamps: true });

    Evento = mongoose.model('Evento', EventoSchema);
    Reunion = mongoose.model('Reunion', ReunionSchema);
    Empresa = mongoose.model('Empresa', EmpresaSchema);
    Usuario = mongoose.model('Usuario', UsuarioSchema);
    Notificacion = mongoose.model<NotificacionDoc>('Notificacion', NotificacionSchema);

    // Create Express app with notificacion routes
    app = express();
    app.use(express.json());

    // Define notificacion routes manually
    app.get('/api/notificaciones', async (req, res) => {
      try {
        const { page = 1, limit = 10, eventoId, reunionId, empresaId, usuarioId, tipo, canal, estado } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = {};
        if (eventoId) filter.eventoId = eventoId;
        if (reunionId) filter.reunionId = reunionId;
        if (empresaId) filter.empresaId = empresaId;
        if (usuarioId) filter.usuarioId = usuarioId;
        if (tipo) filter.tipo = tipo;
        if (canal) filter.canal = canal;
        if (estado) filter.estado = estado;
        
        const notificaciones = await Notificacion.find(filter)
          .populate('eventoId', 'nombre')
          .populate('reunionId', 'inicio fin estado')
          .populate('empresaId', 'nombre representante')
          .populate('usuarioId', 'nombre apellido email')
          .sort({ creada_en: -1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await Notificacion.countDocuments(filter);
        
        res.json({
          success: true,
          data: notificaciones,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/notificaciones/:id', async (req, res) => {
      try {
        const notificacion = await Notificacion.findById(req.params.id)
          .populate('eventoId', 'nombre')
          .populate('reunionId', 'inicio fin estado')
          .populate('empresaId', 'nombre representante')
          .populate('usuarioId', 'nombre apellido email');
        
        if (!notificacion) {
          return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
        }
        res.json({ success: true, data: notificacion });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/notificaciones', async (req, res) => {
      try {
        const { eventoId, reunionId, empresaId, usuarioId, tipo, canal, titulo, mensaje, payload, estado } = req.body;
        
        // Validar estado si se proporciona
        if (estado && !['pendiente','enviada','leida','fallida'].includes(estado)) {
          return res.status(400).json({ success: false, error: 'Estado inválido' });
        }
        
        const notificacion = await Notificacion.create({
          eventoId: eventoId || null,
          reunionId: reunionId || null,
          empresaId: empresaId || null,
          usuarioId: usuarioId || null,
          tipo: tipo.trim(),
          canal,
          titulo: titulo.trim(),
          mensaje: mensaje.trim(),
          payload: payload || null,
          estado: estado || 'pendiente'
        });

        const populatedNotificacion = await Notificacion.findById(notificacion._id)
          .populate('eventoId', 'nombre')
          .populate('reunionId', 'inicio fin estado')
          .populate('empresaId', 'nombre representante')
          .populate('usuarioId', 'nombre apellido email');

        res.status(201).json({ success: true, data: populatedNotificacion });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/notificaciones/:id', async (req, res) => {
      try {
        const { titulo, mensaje, payload, intento } = req.body;
        
        // Validar intento si se proporciona
        if (intento !== undefined && intento < 0) {
          return res.status(400).json({ success: false, error: 'El intento debe ser mayor o igual a 0' });
        }
        
        const updateData: any = {};
        if (titulo) updateData.titulo = titulo.trim();
        if (mensaje) updateData.mensaje = mensaje.trim();
        if (payload !== undefined) updateData.payload = payload;
        if (intento !== undefined) updateData.intento = intento;

        const notificacion = await Notificacion.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre')
         .populate('reunionId', 'inicio fin estado')
         .populate('empresaId', 'nombre representante')
         .populate('usuarioId', 'nombre apellido email');

        if (!notificacion) {
          return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
        }

        res.json({ success: true, data: notificacion });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/notificaciones/:id', async (req, res) => {
      try {
        const notificacion = await Notificacion.findByIdAndDelete(req.params.id);
        if (!notificacion) {
          return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
        }
        res.json({ success: true, message: 'Notificación eliminada correctamente' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/notificaciones/:id/estado', async (req, res) => {
      try {
        const { estado } = req.body;
        
        if (!estado || !['pendiente','enviada','leida','fallida'].includes(estado)) {
          return res.status(400).json({ success: false, error: 'Estado inválido' });
        }

        const notificacion = await Notificacion.findByIdAndUpdate(
          req.params.id,
          { estado },
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre')
         .populate('reunionId', 'inicio fin estado')
         .populate('empresaId', 'nombre representante')
         .populate('usuarioId', 'nombre apellido email');

        if (!notificacion) {
          return res.status(404).json({ success: false, error: 'Notificación no encontrada' });
        }

        res.json({ success: true, data: notificacion });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Generate admin token for testing
    adminToken = jwt.sign(
      { sub: 'admin-test-id', role: 'admin', username: 'admin', email: 'admin@test.com' },
      'test-secret-1234567890',
      { expiresIn: '15m' }
    );

    // Create test data
    const evento = await Evento.create({
      nombre: 'Rueda de Negocios 2024',
      descripcion: 'Evento de networking',
      inicio: new Date('2024-06-15T09:00:00.000Z'),
      fin: new Date('2024-06-15T18:00:00.000Z'),
      duracion_minutos_reunion: 30,
      modo_mesas: 'FIJA_POR_EMPRESA'
    });
    eventoId = evento._id.toString();

    const reunion = await Reunion.create({
      eventoId: evento._id,
      mesaId: new mongoose.Types.ObjectId(),
      empresaAId: new mongoose.Types.ObjectId(),
      empresaBId: new mongoose.Types.ObjectId(),
      inicio: new Date('2024-06-15T10:00:00.000Z'),
      fin: new Date('2024-06-15T10:30:00.000Z'),
      estado: 'programada'
    });
    reunionId = reunion._id.toString();

    const empresa = await Empresa.create({
      eventoId: evento._id,
      nombre: 'Empresa Test',
      representante: 'Juan Pérez',
      email: 'juan@empresatest.com'
    });
    empresaId = empresa._id.toString();

    const usuario = await Usuario.create({
      nombre: 'Admin',
      apellido: 'Test',
      email: 'admin@test.com',
      username: 'admin',
      passwordHash: 'hashed_password',
      tipoUsuario: 'admin'
    });
    usuarioId = usuario._id.toString();
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }, 30000);

  const bearer = (token?: string) =>
    token ? { Authorization: `Bearer ${token}` } : {};

  describe('CRUD básico de notificaciones', () => {
    let notificacionId = '';

    it('crear notificación', async () => {
      const notificacionData = {
        eventoId,
        reunionId,
        empresaId,
        usuarioId,
        tipo: 'reunion_programada',
        canal: 'email',
        titulo: 'Reunión Programada',
        mensaje: 'Su reunión ha sido programada para el 15 de junio a las 10:00 AM',
        payload: {
          reunion_id: reunionId,
          fecha: '2024-06-15T10:00:00.000Z',
          duracion: 30
        }
      };

      const res = await request(app)
        .post('/api/notificaciones')
        .set(bearer(adminToken))
        .send(notificacionData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tipo).toBe(notificacionData.tipo);
      expect(res.body.data.canal).toBe(notificacionData.canal);
      expect(res.body.data.estado).toBe('pendiente');
      expect(res.body.data.payload).toEqual(notificacionData.payload);
      notificacionId = res.body.data._id;
    }, 30000);

    it('leer notificación por ID', async () => {
      const res = await request(app)
        .get(`/api/notificaciones/${notificacionId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(notificacionId);
      expect(res.body.data.tipo).toBe('reunion_programada');
    }, 30000);

    it('listar notificaciones', async () => {
      const res = await request(app)
        .get('/api/notificaciones')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    }, 30000);

    it('actualizar notificación', async () => {
      const updateData = {
        titulo: 'Reunión Programada - Actualizada',
        mensaje: 'Su reunión ha sido reprogramada para el 15 de junio a las 11:00 AM',
        intento: 1
      };

      const res = await request(app)
        .patch(`/api/notificaciones/${notificacionId}`)
        .set(bearer(adminToken))
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.titulo).toBe(updateData.titulo);
      expect(res.body.data.intento).toBe(1);
    }, 30000);

    it('eliminar notificación', async () => {
      const res = await request(app)
        .delete(`/api/notificaciones/${notificacionId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Notificación eliminada correctamente');
    }, 30000);
  });

  describe('gestión de estados de notificaciones', () => {
    let notificacionId = '';

    beforeAll(async () => {
      // Crear notificación para pruebas de estado
      const notificacion = await Notificacion.create({
        eventoId,
        tipo: 'solicitud_aceptada',
        canal: 'app',
        titulo: 'Solicitud Aceptada',
        mensaje: 'Su solicitud de reunión ha sido aceptada',
        estado: 'pendiente'
      });
      notificacionId = notificacion.id.toString();
    }, 30000);

    it('cambiar estado a enviada', async () => {
      const res = await request(app)
        .patch(`/api/notificaciones/${notificacionId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'enviada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('enviada');
    }, 30000);

    it('cambiar estado a leida', async () => {
      const res = await request(app)
        .patch(`/api/notificaciones/${notificacionId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'leida' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('leida');
    }, 30000);

    it('cambiar estado a fallida', async () => {
      const res = await request(app)
        .patch(`/api/notificaciones/${notificacionId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'fallida' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('fallida');
    }, 30000);

    it('debe fallar con estado inválido', async () => {
      const res = await request(app)
        .patch(`/api/notificaciones/${notificacionId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'estado_invalido' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });

  describe('filtros de notificaciones', () => {
    let notificacion1Id = '';
    let notificacion2Id = '';

    beforeAll(async () => {
      // Crear notificaciones de prueba para filtros
      const notificacion1 = await Notificacion.create({
        eventoId,
        reunionId,
        empresaId,
        tipo: 'reunion_programada',
        canal: 'email',
        titulo: 'Reunión Programada',
        mensaje: 'Su reunión ha sido programada',
        estado: 'pendiente'
      });
      notificacion1Id = notificacion1.id.toString();

      const notificacion2 = await Notificacion.create({
        eventoId,
        usuarioId,
        tipo: 'recordatorio_evento',
        canal: 'sms',
        titulo: 'Recordatorio de Evento',
        mensaje: 'No olvide su evento mañana',
        estado: 'enviada'
      });
      notificacion2Id = notificacion2.id.toString();
    }, 30000);

    it('filtrar por evento', async () => {
      const res = await request(app)
        .get('/api/notificaciones')
        .query({ eventoId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('filtrar por tipo', async () => {
      const res = await request(app)
        .get('/api/notificaciones')
        .query({ tipo: 'reunion_programada' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((n: any) => n.tipo === 'reunion_programada')).toBe(true);
    }, 30000);

    it('filtrar por canal', async () => {
      const res = await request(app)
        .get('/api/notificaciones')
        .query({ canal: 'email' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((n: any) => n.canal === 'email')).toBe(true);
    }, 30000);

    it('filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/notificaciones')
        .query({ estado: 'pendiente' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((n: any) => n.estado === 'pendiente')).toBe(true);
    }, 30000);

    it('filtrar por empresa', async () => {
      const res = await request(app)
        .get('/api/notificaciones')
        .query({ empresaId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('combinar múltiples filtros', async () => {
      const res = await request(app)
        .get('/api/notificaciones')
        .query({ 
          eventoId,
          canal: 'email',
          estado: 'pendiente'
        })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((n: any) => n.canal === 'email' && n.estado === 'pendiente')).toBe(true);
    }, 30000);
  });

  describe('validaciones de notificaciones', () => {
    it('debe fallar al crear notificación sin campos requeridos', async () => {
      const res = await request(app)
        .post('/api/notificaciones')
        .set(bearer(adminToken))
        .send({
          // faltan campos requeridos
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear notificación con canal inválido', async () => {
      const res = await request(app)
        .post('/api/notificaciones')
        .set(bearer(adminToken))
        .send({
          tipo: 'test',
          canal: 'canal_invalido',
          titulo: 'Test',
          mensaje: 'Mensaje de prueba'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear notificación con estado inválido', async () => {
      const res = await request(app)
        .post('/api/notificaciones')
        .set(bearer(adminToken))
        .send({
          tipo: 'test',
          canal: 'email',
          titulo: 'Test',
          mensaje: 'Mensaje de prueba',
          estado: 'estado_invalido'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar con intento negativo', async () => {
      // Crear una notificación primero
      const notificacion = await Notificacion.create({
        tipo: 'test',
        canal: 'email',
        titulo: 'Test',
        mensaje: 'Mensaje de prueba',
        estado: 'pendiente'
      });

      const res = await request(app)
        .patch(`/api/notificaciones/${notificacion._id}`)
        .set(bearer(adminToken))
        .send({
          intento: -1
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });

  describe('diferentes tipos de notificaciones', () => {
    it('crear notificación de reunión programada', async () => {
      const res = await request(app)
        .post('/api/notificaciones')
        .set(bearer(adminToken))
        .send({
          eventoId,
          reunionId,
          tipo: 'reunion_programada',
          canal: 'email',
          titulo: 'Reunión Programada',
          mensaje: 'Su reunión ha sido programada',
          payload: { reunion_id: reunionId }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tipo).toBe('reunion_programada');
    }, 30000);

    it('crear notificación de solicitud aceptada', async () => {
      const res = await request(app)
        .post('/api/notificaciones')
        .set(bearer(adminToken))
        .send({
          eventoId,
          empresaId,
          tipo: 'solicitud_aceptada',
          canal: 'app',
          titulo: 'Solicitud Aceptada',
          mensaje: 'Su solicitud de reunión ha sido aceptada'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tipo).toBe('solicitud_aceptada');
    }, 30000);

    it('crear notificación de recordatorio', async () => {
      const res = await request(app)
        .post('/api/notificaciones')
        .set(bearer(adminToken))
        .send({
          eventoId,
          usuarioId,
          tipo: 'recordatorio_evento',
          canal: 'sms',
          titulo: 'Recordatorio de Evento',
          mensaje: 'No olvide su evento mañana'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tipo).toBe('recordatorio_evento');
    }, 30000);

    it('crear notificación de WhatsApp', async () => {
      const res = await request(app)
        .post('/api/notificaciones')
        .set(bearer(adminToken))
        .send({
          eventoId,
          empresaId,
          tipo: 'reunion_cancelada',
          canal: 'whatsapp',
          titulo: 'Reunión Cancelada',
          mensaje: 'Su reunión ha sido cancelada'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.canal).toBe('whatsapp');
    }, 30000);
  });
});
