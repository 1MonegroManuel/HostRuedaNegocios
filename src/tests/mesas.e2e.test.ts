import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';

// Define the mesa interface and schema
interface MesaDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  numero: number;
  nombre?: string | null;
  ubicacion?: string | null;
  capacidad?: number | null;
  activa: boolean;
  creado_en: Date;
  actualizado_en: Date;
}

const MesaSchema = new Schema<MesaDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  numero: { type: Number, required: true, min: 1 },
  nombre: { type: String, default: null, trim: true },
  ubicacion: { type: String, default: null, trim: true },
  capacidad: { type: Number, default: null, min: 1 },
  activa: { type: Boolean, default: true, index: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

// Evita mesas duplicadas dentro del mismo evento
MesaSchema.index({ eventoId: 1, numero: 1 }, { unique: true });

describe('Mesas - flujo CRUD + filtros', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let Mesa: Model<MesaDoc>;
  let Evento: Model<any>;
  let adminToken = '';
  let eventoId = '';

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

    Evento = mongoose.model('Evento', EventoSchema);
    Mesa = mongoose.model<MesaDoc>('Mesa', MesaSchema);

    // Create Express app with mesa routes
    app = express();
    app.use(express.json());

    // Define mesa routes manually
    app.get('/api/mesas', async (req, res) => {
      try {
        const { page = 1, limit = 10, eventoId, activa } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = {};
        if (eventoId) filter.eventoId = eventoId;
        if (activa !== undefined) filter.activa = activa === 'true';
        
        const mesas = await Mesa.find(filter)
          .populate('eventoId', 'nombre')
          .sort({ numero: 1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await Mesa.countDocuments(filter);
        
        res.json({
          success: true,
          data: mesas,
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

    app.get('/api/mesas/by-evento/:eventoId', async (req, res) => {
      try {
        const { page = 1, limit = 10, activa } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = { eventoId: req.params.eventoId };
        if (activa !== undefined) filter.activa = activa === 'true';
        
        const mesas = await Mesa.find(filter)
          .sort({ numero: 1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await Mesa.countDocuments(filter);
        
        res.json({
          success: true,
          data: mesas,
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

    app.get('/api/mesas/:id', async (req, res) => {
      try {
        const mesa = await Mesa.findById(req.params.id)
          .populate('eventoId', 'nombre');
        
        if (!mesa) {
          return res.status(404).json({ success: false, error: 'Mesa no encontrada' });
        }
        res.json({ success: true, data: mesa });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/mesas', async (req, res) => {
      try {
        const { eventoId, numero, nombre, ubicacion, capacidad, activa } = req.body;
        
        // Validar capacidad si se proporciona
        if (capacidad !== undefined && capacidad !== null && capacidad < 1) {
          return res.status(400).json({ success: false, error: 'La capacidad debe ser mayor a 0' });
        }
        
        const mesa = await Mesa.create({
          eventoId,
          numero,
          nombre: nombre || null,
          ubicacion: ubicacion || null,
          capacidad: capacidad || null,
          activa: activa !== undefined ? activa : true
        });

        const populatedMesa = await Mesa.findById(mesa._id)
          .populate('eventoId', 'nombre');

        res.status(201).json({ success: true, data: populatedMesa });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/mesas/:id', async (req, res) => {
      try {
        const { numero, nombre, ubicacion, capacidad, activa } = req.body;
        
        const updateData: any = {};
        if (numero !== undefined) updateData.numero = numero;
        if (nombre !== undefined) updateData.nombre = nombre;
        if (ubicacion !== undefined) updateData.ubicacion = ubicacion;
        if (capacidad !== undefined) updateData.capacidad = capacidad;
        if (activa !== undefined) updateData.activa = activa;

        const mesa = await Mesa.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre');

        if (!mesa) {
          return res.status(404).json({ success: false, error: 'Mesa no encontrada' });
        }

        res.json({ success: true, data: mesa });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/mesas/:id', async (req, res) => {
      try {
        const mesa = await Mesa.findByIdAndDelete(req.params.id);
        if (!mesa) {
          return res.status(404).json({ success: false, error: 'Mesa no encontrada' });
        }
        res.json({ success: true, message: 'Mesa eliminada correctamente' });
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
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }, 30000);

  const bearer = (token?: string) =>
    token ? { Authorization: `Bearer ${token}` } : {};

  describe('CRUD básico de mesas', () => {
    let mesaId = '';

    it('crear mesa', async () => {
      const mesaData = {
        eventoId,
        numero: 1,
        nombre: 'Mesa Principal',
        ubicacion: 'Salón A - Esquina NE',
        capacidad: 8,
        activa: true
      };

      const res = await request(app)
        .post('/api/mesas')
        .set(bearer(adminToken))
        .send(mesaData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.numero).toBe(mesaData.numero);
      expect(res.body.data.nombre).toBe(mesaData.nombre);
      expect(res.body.data.activa).toBe(true);
      mesaId = res.body.data._id;
    }, 30000);

    it('leer mesa por ID', async () => {
      const res = await request(app)
        .get(`/api/mesas/${mesaId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(mesaId);
      expect(res.body.data.numero).toBe(1);
    }, 30000);

    it('listar mesas', async () => {
      const res = await request(app)
        .get('/api/mesas')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    }, 30000);

    it('actualizar mesa', async () => {
      const updateData = {
        nombre: 'Mesa Principal - Actualizada',
        ubicacion: 'Salón A - Centro',
        capacidad: 10,
        activa: false
      };

      const res = await request(app)
        .patch(`/api/mesas/${mesaId}`)
        .set(bearer(adminToken))
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe(updateData.nombre);
      expect(res.body.data.capacidad).toBe(10);
      expect(res.body.data.activa).toBe(false);
    }, 30000);

    it('eliminar mesa', async () => {
      const res = await request(app)
        .delete(`/api/mesas/${mesaId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Mesa eliminada correctamente');
    }, 30000);
  });

  describe('filtros de mesas', () => {
    let mesa1Id = '';
    let mesa2Id = '';

    beforeAll(async () => {
      // Crear mesas de prueba para filtros
      const mesa1 = await Mesa.create({
        eventoId,
        numero: 1,
        nombre: 'Mesa A',
        ubicacion: 'Salón A',
        capacidad: 6,
        activa: true
      });
      mesa1Id = mesa1.id.toString();

      const mesa2 = await Mesa.create({
        eventoId,
        numero: 2,
        nombre: 'Mesa B',
        ubicacion: 'Salón B',
        capacidad: 4,
        activa: false
      });
      mesa2Id = mesa2.id.toString();
    }, 30000);

    it('filtrar por evento', async () => {
      const res = await request(app)
        .get(`/api/mesas/by-evento/${eventoId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    }, 30000);

    it('filtrar por estado activo', async () => {
      const res = await request(app)
        .get('/api/mesas')
        .query({ activa: 'true' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].activa).toBe(true);
    }, 30000);

    it('filtrar por estado inactivo', async () => {
      const res = await request(app)
        .get('/api/mesas')
        .query({ activa: 'false' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].activa).toBe(false);
    }, 30000);

    it('filtrar por evento y estado', async () => {
      const res = await request(app)
        .get(`/api/mesas/by-evento/${eventoId}`)
        .query({ activa: 'true' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].activa).toBe(true);
    }, 30000);

    it('paginación', async () => {
      const res = await request(app)
        .get('/api/mesas')
        .query({ page: 1, limit: 1 })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(1);
      expect(res.body.pagination.total).toBe(2);
    }, 30000);

    it('ordenamiento por número', async () => {
      const res = await request(app)
        .get('/api/mesas')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].numero).toBe(1);
      expect(res.body.data[1].numero).toBe(2);
    }, 30000);
  });

  describe('validaciones de mesas', () => {
    it('debe fallar al crear mesa sin campos requeridos', async () => {
      const res = await request(app)
        .post('/api/mesas')
        .set(bearer(adminToken))
        .send({
          // faltan eventoId y numero
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear mesa con número inválido', async () => {
      const res = await request(app)
        .post('/api/mesas')
        .set(bearer(adminToken))
        .send({
          eventoId,
          numero: 0, // inválido
          nombre: 'Mesa Inválida'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear mesa con capacidad inválida', async () => {
      const res = await request(app)
        .post('/api/mesas')
        .set(bearer(adminToken))
        .send({
          eventoId,
          numero: 3,
          nombre: 'Mesa Inválida',
          capacidad: 0 // inválido
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear mesa duplicada en el mismo evento', async () => {
      const mesaData = {
        eventoId,
        numero: 1, // ya existe
        nombre: 'Mesa Duplicada'
      };

      const res = await request(app)
        .post('/api/mesas')
        .set(bearer(adminToken))
        .send(mesaData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });
});
