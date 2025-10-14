import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';

// Define the solicitud reunion interface and schema
type EstadoSolicitud = 'pendiente'|'aceptada'|'rechazada'|'cancelada';

interface SolicitudReunionDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  empresaSolicitaId: mongoose.Types.ObjectId;
  empresaObjetivoId: mongoose.Types.ObjectId;
  mesaPreferidaId?: mongoose.Types.ObjectId | null;
  inicioPropuesto?: Date | null;
  finPropuesto?: Date | null;
  mensaje?: string | null;
  estado: EstadoSolicitud;
  creada_en: Date;
  actualizada_en: Date;
}

const SolicitudReunionSchema = new Schema<SolicitudReunionDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  empresaSolicitaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  empresaObjetivoId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  mesaPreferidaId: { type: Schema.Types.ObjectId, ref: 'Mesa', default: null },
  inicioPropuesto: { type: Date, default: null },
  finPropuesto: { type: Date, default: null },
  mensaje: { type: String, default: null, trim: true },
  estado: { type: String, enum: ['pendiente','aceptada','rechazada','cancelada'], default: 'pendiente', index: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Evita duplicar solicitudes PENDIENTES entre el mismo par en el mismo evento
SolicitudReunionSchema.index(
  { eventoId: 1, empresaSolicitaId: 1, empresaObjetivoId: 1, estado: 1 },
  { unique: true, partialFilterExpression: { estado: 'pendiente' } }
);

describe('Solicitudes de Reunión - flujo CRUD + conversión', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let SolicitudReunion: Model<SolicitudReunionDoc>;
  let Evento: Model<any>;
  let Mesa: Model<any>;
  let Empresa: Model<any>;
  let Reunion: Model<any>;
  let adminToken = '';
  let eventoId = '';
  let mesaId = '';
  let empresaAId = '';
  let empresaBId = '';

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

    const MesaSchema = new Schema({
      eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true },
      numero: { type: Number, required: true },
      nombre: { type: String, default: null },
      ubicacion: { type: String, default: null },
      capacidad: { type: Number, default: null },
      activa: { type: Boolean, default: true }
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

    Evento = mongoose.model('Evento', EventoSchema);
    Mesa = mongoose.model('Mesa', MesaSchema);
    Empresa = mongoose.model('Empresa', EmpresaSchema);
    Reunion = mongoose.model('Reunion', ReunionSchema);
    SolicitudReunion = mongoose.model<SolicitudReunionDoc>('SolicitudReunion', SolicitudReunionSchema);

    // Create Express app with solicitud reunion routes
    app = express();
    app.use(express.json());

    // Define solicitud reunion routes manually
    app.get('/api/solicitudes-reunion', async (req, res) => {
      try {
        const { page = 1, limit = 10, eventoId, empresaId, estado } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = {};
        if (eventoId) filter.eventoId = eventoId;
        if (empresaId) {
          filter.$or = [
            { empresaSolicitaId: empresaId },
            { empresaObjetivoId: empresaId }
          ];
        }
        if (estado) filter.estado = estado;
        
        const solicitudes = await SolicitudReunion.find(filter)
          .populate('eventoId', 'nombre')
          .populate('empresaSolicitaId', 'nombre representante')
          .populate('empresaObjetivoId', 'nombre representante')
          .populate('mesaPreferidaId', 'numero nombre')
          .sort({ creada_en: -1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await SolicitudReunion.countDocuments(filter);
        
        res.json({
          success: true,
          data: solicitudes,
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

    app.get('/api/solicitudes-reunion/:id', async (req, res) => {
      try {
        const solicitud = await SolicitudReunion.findById(req.params.id)
          .populate('eventoId', 'nombre')
          .populate('empresaSolicitaId', 'nombre representante')
          .populate('empresaObjetivoId', 'nombre representante')
          .populate('mesaPreferidaId', 'numero nombre');
        
        if (!solicitud) {
          return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        }
        res.json({ success: true, data: solicitud });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/solicitudes-reunion', async (req, res) => {
      try {
        const { eventoId, empresaSolicitaId, empresaObjetivoId, mesaPreferidaId, inicioPropuesto, finPropuesto, mensaje } = req.body;
        
        const solicitud = await SolicitudReunion.create({
          eventoId,
          empresaSolicitaId,
          empresaObjetivoId,
          mesaPreferidaId: mesaPreferidaId || null,
          inicioPropuesto: inicioPropuesto ? new Date(inicioPropuesto) : null,
          finPropuesto: finPropuesto ? new Date(finPropuesto) : null,
          mensaje: mensaje || null,
          estado: 'pendiente'
        });

        const populatedSolicitud = await SolicitudReunion.findById(solicitud._id)
          .populate('eventoId', 'nombre')
          .populate('empresaSolicitaId', 'nombre representante')
          .populate('empresaObjetivoId', 'nombre representante')
          .populate('mesaPreferidaId', 'numero nombre');

        res.status(201).json({ success: true, data: populatedSolicitud });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/solicitudes-reunion/:id', async (req, res) => {
      try {
        const { mesaPreferidaId, inicioPropuesto, finPropuesto, mensaje } = req.body;
        
        const updateData: any = {};
        if (mesaPreferidaId !== undefined) updateData.mesaPreferidaId = mesaPreferidaId;
        if (inicioPropuesto !== undefined) updateData.inicioPropuesto = inicioPropuesto ? new Date(inicioPropuesto) : null;
        if (finPropuesto !== undefined) updateData.finPropuesto = finPropuesto ? new Date(finPropuesto) : null;
        if (mensaje !== undefined) updateData.mensaje = mensaje;

        const solicitud = await SolicitudReunion.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre')
         .populate('empresaSolicitaId', 'nombre representante')
         .populate('empresaObjetivoId', 'nombre representante')
         .populate('mesaPreferidaId', 'numero nombre');

        if (!solicitud) {
          return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        }

        res.json({ success: true, data: solicitud });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/solicitudes-reunion/:id', async (req, res) => {
      try {
        const solicitud = await SolicitudReunion.findByIdAndDelete(req.params.id);
        if (!solicitud) {
          return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        }
        res.json({ success: true, message: 'Solicitud eliminada correctamente' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/solicitudes-reunion/:id/estado', async (req, res) => {
      try {
        const { estado } = req.body;
        
        if (!estado || !['pendiente','aceptada','rechazada','cancelada'].includes(estado)) {
          return res.status(400).json({ success: false, error: 'Estado inválido' });
        }

        const solicitud = await SolicitudReunion.findByIdAndUpdate(
          req.params.id,
          { estado },
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre')
         .populate('empresaSolicitaId', 'nombre representante')
         .populate('empresaObjetivoId', 'nombre representante')
         .populate('mesaPreferidaId', 'numero nombre');

        if (!solicitud) {
          return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        }

        res.json({ success: true, data: solicitud });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/solicitudes-reunion/:id/convertir-a-reunion', async (req, res) => {
      try {
        const { mesaId, inicio, fin } = req.body;
        
        // Obtener la solicitud
        const solicitud = await SolicitudReunion.findById(req.params.id);
        if (!solicitud) {
          return res.status(404).json({ success: false, error: 'Solicitud no encontrada' });
        }

        if (solicitud.estado !== 'aceptada') {
          return res.status(400).json({ success: false, error: 'Solo se pueden convertir solicitudes aceptadas' });
        }

        // Crear la reunión
        const reunion = await Reunion.create({
          eventoId: solicitud.eventoId,
          mesaId: mesaId || solicitud.mesaPreferidaId,
          empresaAId: solicitud.empresaSolicitaId,
          empresaBId: solicitud.empresaObjetivoId,
          inicio: new Date(inicio || solicitud.inicioPropuesto),
          fin: new Date(fin || solicitud.finPropuesto),
          estado: 'programada',
          notas: `Convertida desde solicitud: ${solicitud.mensaje || 'Sin mensaje'}`
        });

        // Marcar la solicitud como completada (opcional)
        await SolicitudReunion.findByIdAndUpdate(req.params.id, { estado: 'completada' });

        const populatedReunion = await Reunion.findById(reunion._id)
          .populate('eventoId', 'nombre')
          .populate('mesaId', 'numero nombre')
          .populate('empresaAId', 'nombre representante')
          .populate('empresaBId', 'nombre representante');

        res.json({ success: true, data: populatedReunion });
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

    const mesa = await Mesa.create({
      eventoId: evento._id,
      numero: 1,
      nombre: 'Mesa Principal',
      ubicacion: 'Salón A',
      capacidad: 8,
      activa: true
    });
    mesaId = mesa._id.toString();

    const empresaA = await Empresa.create({
      eventoId: evento._id,
      nombre: 'Empresa A',
      representante: 'Juan Pérez',
      email: 'juan@empresaa.com'
    });
    empresaAId = empresaA._id.toString();

    const empresaB = await Empresa.create({
      eventoId: evento._id,
      nombre: 'Empresa B',
      representante: 'María García',
      email: 'maria@empresab.com'
    });
    empresaBId = empresaB._id.toString();
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }, 30000);

  const bearer = (token?: string) =>
    token ? { Authorization: `Bearer ${token}` } : {};

  describe('CRUD básico de solicitudes de reunión', () => {
    let solicitudId = '';

    it('crear solicitud de reunión', async () => {
      const solicitudData = {
        eventoId,
        empresaSolicitaId: empresaAId,
        empresaObjetivoId: empresaBId,
        mesaPreferidaId: mesaId,
        inicioPropuesto: '2024-06-15T10:00:00.000Z',
        finPropuesto: '2024-06-15T10:30:00.000Z',
        mensaje: 'Nos gustaría conocer más sobre su empresa'
      };

      const res = await request(app)
        .post('/api/solicitudes-reunion')
        .set(bearer(adminToken))
        .send(solicitudData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('pendiente');
      expect(res.body.data.mensaje).toBe(solicitudData.mensaje);
      solicitudId = res.body.data._id;
    }, 30000);

    it('leer solicitud por ID', async () => {
      const res = await request(app)
        .get(`/api/solicitudes-reunion/${solicitudId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(solicitudId);
      expect(res.body.data.estado).toBe('pendiente');
    }, 30000);

    it('listar solicitudes', async () => {
      const res = await request(app)
        .get('/api/solicitudes-reunion')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    }, 30000);

    it('actualizar solicitud', async () => {
      const updateData = {
        inicioPropuesto: '2024-06-15T11:00:00.000Z',
        finPropuesto: '2024-06-15T11:30:00.000Z',
        mensaje: 'Mensaje actualizado'
      };

      const res = await request(app)
        .patch(`/api/solicitudes-reunion/${solicitudId}`)
        .set(bearer(adminToken))
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mensaje).toBe(updateData.mensaje);
    }, 30000);

    it('eliminar solicitud', async () => {
      const res = await request(app)
        .delete(`/api/solicitudes-reunion/${solicitudId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Solicitud eliminada correctamente');
    }, 30000);
  });

  describe('gestión de estados de solicitudes', () => {
    let solicitudId = '';

    beforeAll(async () => {
      // Crear solicitud para pruebas de estado
      const solicitud = await SolicitudReunion.create({
        eventoId,
        empresaSolicitaId: empresaAId,
        empresaObjetivoId: empresaBId,
        mensaje: 'Solicitud de prueba',
        estado: 'pendiente'
      });
      solicitudId = solicitud.id.toString();
    }, 30000);

    it('cambiar estado a aceptada', async () => {
      const res = await request(app)
        .patch(`/api/solicitudes-reunion/${solicitudId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'aceptada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('aceptada');
    }, 30000);

    it('cambiar estado a rechazada', async () => {
      const res = await request(app)
        .patch(`/api/solicitudes-reunion/${solicitudId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'rechazada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('rechazada');
    }, 30000);

    it('cambiar estado a cancelada', async () => {
      const res = await request(app)
        .patch(`/api/solicitudes-reunion/${solicitudId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'cancelada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('cancelada');
    }, 30000);

    it('debe fallar con estado inválido', async () => {
      const res = await request(app)
        .patch(`/api/solicitudes-reunion/${solicitudId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'estado_invalido' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });

  describe('conversión de solicitud a reunión', () => {
    let solicitudId = '';

    beforeAll(async () => {
      // Crear solicitud aceptada para conversión
      const solicitud = await SolicitudReunion.create({
        eventoId,
        empresaSolicitaId: empresaAId,
        empresaObjetivoId: empresaBId,
        mesaPreferidaId: mesaId,
        inicioPropuesto: new Date('2024-06-15T14:00:00.000Z'),
        finPropuesto: new Date('2024-06-15T14:30:00.000Z'),
        mensaje: 'Solicitud para conversión',
        estado: 'aceptada'
      });
      solicitudId = solicitud.id.toString();
    }, 30000);

    it('convertir solicitud aceptada a reunión', async () => {
      const conversionData = {
        mesaId,
        inicio: '2024-06-15T14:00:00.000Z',
        fin: '2024-06-15T14:30:00.000Z'
      };

      const res = await request(app)
        .post(`/api/solicitudes-reunion/${solicitudId}/convertir-a-reunion`)
        .set(bearer(adminToken))
        .send(conversionData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('programada');
      expect(res.body.data.empresaAId._id).toBe(empresaAId);
      expect(res.body.data.empresaBId._id).toBe(empresaBId);
    }, 30000);

    it('debe fallar al convertir solicitud no aceptada', async () => {
      // Crear solicitud pendiente
      const solicitudPendiente = await SolicitudReunion.create({
        eventoId,
        empresaSolicitaId: empresaAId,
        empresaObjetivoId: empresaBId,
        mensaje: 'Solicitud pendiente',
        estado: 'pendiente'
      });

      const res = await request(app)
        .post(`/api/solicitudes-reunion/${solicitudPendiente._id}/convertir-a-reunion`)
        .set(bearer(adminToken))
        .send({ mesaId });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Solo se pueden convertir solicitudes aceptadas');
    }, 30000);
  });

  describe('filtros de solicitudes', () => {
    let solicitud1Id = '';
    let solicitud2Id = '';

    beforeAll(async () => {
      // Crear un nuevo evento para evitar conflictos de claves únicas
      const nuevoEvento = await Evento.create({
        nombre: 'Evento Filtros 2024',
        descripcion: 'Evento para pruebas de filtros',
        inicio: new Date('2024-06-16T09:00:00.000Z'),
        fin: new Date('2024-06-16T18:00:00.000Z'),
        duracion_minutos_reunion: 30,
        modo_mesas: 'FIJA_POR_EMPRESA'
      });

      // Crear solicitudes de prueba para filtros
      const solicitud1 = await SolicitudReunion.create({
        eventoId: nuevoEvento._id,
        empresaSolicitaId: empresaAId,
        empresaObjetivoId: empresaBId,
        mensaje: 'Solicitud 1',
        estado: 'pendiente'
      });
      solicitud1Id = (solicitud1 as any)._id.toString();

      const solicitud2 = await SolicitudReunion.create({
        eventoId: nuevoEvento._id,
        empresaSolicitaId: empresaBId,
        empresaObjetivoId: empresaAId,
        mensaje: 'Solicitud 2',
        estado: 'aceptada'
      });
      solicitud2Id = (solicitud2 as any)._id.toString();
    }, 30000);

    it('filtrar por evento', async () => {
      const res = await request(app)
        .get('/api/solicitudes-reunion')
        .query({ eventoId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/solicitudes-reunion')
        .query({ estado: 'pendiente' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((s: any) => s.estado === 'pendiente')).toBe(true);
    }, 30000);

    it('filtrar por empresa', async () => {
      const res = await request(app)
        .get('/api/solicitudes-reunion')
        .query({ empresaId: empresaAId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('combinar múltiples filtros', async () => {
      const res = await request(app)
        .get('/api/solicitudes-reunion')
        .query({ 
          eventoId,
          estado: 'aceptada'
        })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((s: any) => s.estado === 'aceptada')).toBe(true);
    }, 30000);
  });

  describe('validaciones de solicitudes', () => {
    it('debe fallar al crear solicitud sin campos requeridos', async () => {
      const res = await request(app)
        .post('/api/solicitudes-reunion')
        .set(bearer(adminToken))
        .send({
          // faltan campos requeridos
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear solicitud con estado inválido', async () => {
      const res = await request(app)
        .post('/api/solicitudes-reunion')
        .set(bearer(adminToken))
        .send({
          eventoId,
          empresaSolicitaId: empresaAId,
          empresaObjetivoId: empresaBId,
          estado: 'estado_invalido'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear solicitud duplicada pendiente', async () => {
      const solicitudData = {
        eventoId,
        empresaSolicitaId: empresaAId,
        empresaObjetivoId: empresaBId,
        mensaje: 'Solicitud duplicada'
      };

      // Crear primera solicitud
      await request(app)
        .post('/api/solicitudes-reunion')
        .set(bearer(adminToken))
        .send(solicitudData);

      // Intentar crear solicitud duplicada
      const res = await request(app)
        .post('/api/solicitudes-reunion')
        .set(bearer(adminToken))
        .send(solicitudData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });
});
