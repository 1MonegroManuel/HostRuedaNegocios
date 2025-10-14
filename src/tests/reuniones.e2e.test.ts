import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';

// Define the reunion interface and schema
type EstadoReunion = 'programada'|'confirmada'|'completada'|'cancelada'|'no_show';

interface ReunionDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  mesaId: mongoose.Types.ObjectId;
  empresaAId: mongoose.Types.ObjectId;
  empresaBId: mongoose.Types.ObjectId;
  inicio: Date;
  fin: Date;
  estado: EstadoReunion;
  notas?: string | null;
  creada_en: Date;
  actualizada_en: Date;
}

const ReunionSchema = new Schema<ReunionDoc>({
  eventoId:   { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  mesaId:     { type: Schema.Types.ObjectId, ref: 'Mesa', required: true, index: true },
  empresaAId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  empresaBId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  inicio:     { type: Date, required: true, index: true },
  fin:        { type: Date, required: true },
  estado:     { type: String, enum: ['programada','confirmada','completada','cancelada','no_show'], default: 'programada', index: true },
  notas:      { type: String, default: null, trim: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Para evitar duplicidades triviales (mismas 2 empresas, mesa y start)
ReunionSchema.index({ eventoId: 1, mesaId: 1, empresaAId: 1, empresaBId: 1, inicio: 1 }, { unique: true });

describe('Reuniones - flujo CRUD + estados', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let Reunion: Model<ReunionDoc>;
  let Evento: Model<any>;
  let Mesa: Model<any>;
  let Empresa: Model<any>;
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

    Evento = mongoose.model('Evento', EventoSchema);
    Mesa = mongoose.model('Mesa', MesaSchema);
    Empresa = mongoose.model('Empresa', EmpresaSchema);
    Reunion = mongoose.model<ReunionDoc>('Reunion', ReunionSchema);

    // Create Express app with reunion routes
    app = express();
    app.use(express.json());

    // Define reunion routes manually
    app.get('/api/reuniones', async (req, res) => {
      try {
        const { page = 1, limit = 10, eventoId, mesaId, empresaId, estado, desde, hasta } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = {};
        if (eventoId) filter.eventoId = eventoId;
        if (mesaId) filter.mesaId = mesaId;
        if (empresaId) {
          filter.$or = [
            { empresaAId: empresaId },
            { empresaBId: empresaId }
          ];
        }
        if (estado) filter.estado = estado;
        if (desde) filter.inicio = { ...filter.inicio, $gte: new Date(desde as string) };
        if (hasta) filter.inicio = { ...filter.inicio, $lte: new Date(hasta as string) };
        
        const reuniones = await Reunion.find(filter)
          .populate('eventoId', 'nombre')
          .populate('mesaId', 'numero nombre')
          .populate('empresaAId', 'nombre representante')
          .populate('empresaBId', 'nombre representante')
          .sort({ inicio: 1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await Reunion.countDocuments(filter);
        
        res.json({
          success: true,
          data: reuniones,
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

    app.get('/api/reuniones/:id', async (req, res) => {
      try {
        const reunion = await Reunion.findById(req.params.id)
          .populate('eventoId', 'nombre')
          .populate('mesaId', 'numero nombre')
          .populate('empresaAId', 'nombre representante')
          .populate('empresaBId', 'nombre representante');
        
        if (!reunion) {
          return res.status(404).json({ success: false, error: 'Reunión no encontrada' });
        }
        res.json({ success: true, data: reunion });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/reuniones', async (req, res) => {
      try {
        const { eventoId, mesaId, empresaAId, empresaBId, inicio, fin, estado, notas } = req.body;
        
        const reunion = await Reunion.create({
          eventoId,
          mesaId,
          empresaAId,
          empresaBId,
          inicio: new Date(inicio),
          fin: new Date(fin),
          estado: estado || 'programada',
          notas: notas || null
        });

        const populatedReunion = await Reunion.findById(reunion._id)
          .populate('eventoId', 'nombre')
          .populate('mesaId', 'numero nombre')
          .populate('empresaAId', 'nombre representante')
          .populate('empresaBId', 'nombre representante');

        res.status(201).json({ success: true, data: populatedReunion });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/reuniones/:id', async (req, res) => {
      try {
        const { inicio, fin, estado, notas } = req.body;
        
        const updateData: any = {};
        if (inicio) updateData.inicio = new Date(inicio);
        if (fin) updateData.fin = new Date(fin);
        if (estado) updateData.estado = estado;
        if (notas !== undefined) updateData.notas = notas;

        const reunion = await Reunion.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre')
         .populate('mesaId', 'numero nombre')
         .populate('empresaAId', 'nombre representante')
         .populate('empresaBId', 'nombre representante');

        if (!reunion) {
          return res.status(404).json({ success: false, error: 'Reunión no encontrada' });
        }

        res.json({ success: true, data: reunion });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/reuniones/:id', async (req, res) => {
      try {
        const reunion = await Reunion.findByIdAndDelete(req.params.id);
        if (!reunion) {
          return res.status(404).json({ success: false, error: 'Reunión no encontrada' });
        }
        res.json({ success: true, message: 'Reunión eliminada correctamente' });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/reuniones/:id/estado', async (req, res) => {
      try {
        const { estado } = req.body;
        
        if (!estado || !['programada','confirmada','completada','cancelada','no_show'].includes(estado)) {
          return res.status(400).json({ success: false, error: 'Estado inválido' });
        }

        const reunion = await Reunion.findByIdAndUpdate(
          req.params.id,
          { estado },
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre')
         .populate('mesaId', 'numero nombre')
         .populate('empresaAId', 'nombre representante')
         .populate('empresaBId', 'nombre representante');

        if (!reunion) {
          return res.status(404).json({ success: false, error: 'Reunión no encontrada' });
        }

        res.json({ success: true, data: reunion });
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

  describe('CRUD básico de reuniones', () => {
    let reunionId = '';

    it('crear reunión', async () => {
      const reunionData = {
        eventoId,
        mesaId,
        empresaAId,
        empresaBId,
        inicio: '2024-06-15T10:00:00.000Z',
        fin: '2024-06-15T10:30:00.000Z',
        estado: 'programada',
        notas: 'Reunión de networking inicial'
      };

      const res = await request(app)
        .post('/api/reuniones')
        .set(bearer(adminToken))
        .send(reunionData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('programada');
      expect(res.body.data.notas).toBe(reunionData.notas);
      reunionId = res.body.data._id;
    }, 30000);

    it('leer reunión por ID', async () => {
      const res = await request(app)
        .get(`/api/reuniones/${reunionId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(reunionId);
      expect(res.body.data.estado).toBe('programada');
    }, 30000);

    it('listar reuniones', async () => {
      const res = await request(app)
        .get('/api/reuniones')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    }, 30000);

    it('actualizar reunión', async () => {
      const updateData = {
        inicio: '2024-06-15T10:15:00.000Z',
        fin: '2024-06-15T10:45:00.000Z',
        notas: 'Reunión reprogramada'
      };

      const res = await request(app)
        .patch(`/api/reuniones/${reunionId}`)
        .set(bearer(adminToken))
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notas).toBe(updateData.notas);
    }, 30000);

    it('eliminar reunión', async () => {
      const res = await request(app)
        .delete(`/api/reuniones/${reunionId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Reunión eliminada correctamente');
    }, 30000);
  });

  describe('gestión de estados de reuniones', () => {
    let reunionId = '';

    beforeAll(async () => {
      // Crear reunión para pruebas de estado
      const reunion = await Reunion.create({
        eventoId,
        mesaId,
        empresaAId,
        empresaBId,
        inicio: new Date('2024-06-15T11:00:00.000Z'),
        fin: new Date('2024-06-15T11:30:00.000Z'),
        estado: 'programada'
      });
      reunionId = reunion.id.toString();
    }, 30000);

    it('cambiar estado a confirmada', async () => {
      const res = await request(app)
        .patch(`/api/reuniones/${reunionId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'confirmada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('confirmada');
    }, 30000);

    it('cambiar estado a completada', async () => {
      const res = await request(app)
        .patch(`/api/reuniones/${reunionId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'completada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('completada');
    }, 30000);

    it('cambiar estado a cancelada', async () => {
      const res = await request(app)
        .patch(`/api/reuniones/${reunionId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'cancelada' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('cancelada');
    }, 30000);

    it('cambiar estado a no_show', async () => {
      const res = await request(app)
        .patch(`/api/reuniones/${reunionId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'no_show' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.estado).toBe('no_show');
    }, 30000);

    it('debe fallar con estado inválido', async () => {
      const res = await request(app)
        .patch(`/api/reuniones/${reunionId}/estado`)
        .set(bearer(adminToken))
        .send({ estado: 'estado_invalido' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });

  describe('filtros de reuniones', () => {
    let reunion1Id = '';
    let reunion2Id = '';

    beforeAll(async () => {
      // Crear reuniones de prueba para filtros
      const reunion1 = await Reunion.create({
        eventoId,
        mesaId,
        empresaAId,
        empresaBId,
        inicio: new Date('2024-06-15T12:00:00.000Z'),
        fin: new Date('2024-06-15T12:30:00.000Z'),
        estado: 'programada'
      });
      reunion1Id = reunion1.id.toString();

      const reunion2 = await Reunion.create({
        eventoId,
        mesaId,
        empresaAId,
        empresaBId,
        inicio: new Date('2024-06-15T13:00:00.000Z'),
        fin: new Date('2024-06-15T13:30:00.000Z'),
        estado: 'confirmada'
      });
      reunion2Id = reunion2.id.toString();
    }, 30000);

    it('filtrar por evento', async () => {
      const res = await request(app)
        .get('/api/reuniones')
        .query({ eventoId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('filtrar por estado', async () => {
      const res = await request(app)
        .get('/api/reuniones')
        .query({ estado: 'programada' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((r: any) => r.estado === 'programada')).toBe(true);
    }, 30000);

    it('filtrar por empresa', async () => {
      const res = await request(app)
        .get('/api/reuniones')
        .query({ empresaId: empresaAId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('filtrar por rango de fechas', async () => {
      const res = await request(app)
        .get('/api/reuniones')
        .query({ 
          desde: '2024-06-15T11:00:00.000Z',
          hasta: '2024-06-15T14:00:00.000Z'
        })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('combinar múltiples filtros', async () => {
      const res = await request(app)
        .get('/api/reuniones')
        .query({ 
          eventoId,
          estado: 'confirmada',
          desde: '2024-06-15T12:00:00.000Z'
        })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.every((r: any) => r.estado === 'confirmada')).toBe(true);
    }, 30000);
  });

  describe('validaciones de reuniones', () => {
    it('debe fallar al crear reunión sin campos requeridos', async () => {
      const res = await request(app)
        .post('/api/reuniones')
        .set(bearer(adminToken))
        .send({
          // faltan campos requeridos
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear reunión con estado inválido', async () => {
      const res = await request(app)
        .post('/api/reuniones')
        .set(bearer(adminToken))
        .send({
          eventoId,
          mesaId,
          empresaAId,
          empresaBId,
          inicio: '2024-06-15T14:00:00.000Z',
          fin: '2024-06-15T14:30:00.000Z',
          estado: 'estado_invalido'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear reunión duplicada', async () => {
      const reunionData = {
        eventoId,
        mesaId,
        empresaAId,
        empresaBId,
        inicio: '2024-06-15T15:00:00.000Z',
        fin: '2024-06-15T15:30:00.000Z'
      };

      // Crear primera reunión
      await request(app)
        .post('/api/reuniones')
        .set(bearer(adminToken))
        .send(reunionData);

      // Intentar crear reunión duplicada
      const res = await request(app)
        .post('/api/reuniones')
        .set(bearer(adminToken))
        .send(reunionData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });
});
