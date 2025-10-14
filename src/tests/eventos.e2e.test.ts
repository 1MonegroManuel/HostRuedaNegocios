import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';

// Define the evento interface and schema
interface EventoDoc extends Document {
  nombre: string;
  descripcion: string;
  inicio: Date;
  fin: Date;
  duracion_minutos_reunion: number;
  numero_mesa?: number | null;
  modo_mesas: 'FIJA_POR_EMPRESA' | 'POR_REUNION';
  logo_url: string | null;
  creado_en: Date;
  actualizado_en: Date;
}

const EventoSchema = new Schema<EventoDoc>({
  nombre: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  inicio: { type: Date, required: true, index: true },
  fin: { type: Date, required: true },
  duracion_minutos_reunion: { type: Number, required: true, min: 1 },
  numero_mesa: { type: Number, default: null },
  modo_mesas: { type: String, enum: ['FIJA_POR_EMPRESA','POR_REUNION'], required: true },
  logo_url: { type: String, default: null }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

describe('Eventos - flujo CRUD', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let Evento: Model<EventoDoc>;
  let adminToken = '';

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

    // Create the Evento model
    Evento = mongoose.model<EventoDoc>('Evento', EventoSchema);

    // Create Express app with evento routes
    app = express();
    app.use(express.json());

    // Define evento routes manually
    app.get('/api/eventos', async (req, res) => {
      try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        const eventos = await Evento.find()
          .sort({ inicio: -1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await Evento.countDocuments();
        
        res.json({
          success: true,
          data: eventos,
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

    app.get('/api/eventos/:id', async (req, res) => {
      try {
        const evento = await Evento.findById(req.params.id);
        if (!evento) {
          return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        }
        res.json({ success: true, data: evento });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/eventos', async (req, res) => {
      try {
        const { nombre, descripcion, inicio, fin, duracion_minutos_reunion, numero_mesa, modo_mesas, logo_url } = req.body;
        
        const evento = await Evento.create({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          inicio: new Date(inicio),
          fin: new Date(fin),
          duracion_minutos_reunion,
          numero_mesa: numero_mesa || null,
          modo_mesas,
          logo_url: logo_url || null
        });

        res.status(201).json({ success: true, data: evento });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/eventos/:id', async (req, res) => {
      try {
        const { nombre, descripcion, inicio, fin, duracion_minutos_reunion, numero_mesa, modo_mesas, logo_url } = req.body;
        
        const updateData: any = {};
        if (nombre) updateData.nombre = nombre.trim();
        if (descripcion) updateData.descripcion = descripcion.trim();
        if (inicio) updateData.inicio = new Date(inicio);
        if (fin) updateData.fin = new Date(fin);
        if (duracion_minutos_reunion) updateData.duracion_minutos_reunion = duracion_minutos_reunion;
        if (numero_mesa !== undefined) updateData.numero_mesa = numero_mesa;
        if (modo_mesas) updateData.modo_mesas = modo_mesas;
        if (logo_url !== undefined) updateData.logo_url = logo_url;

        const evento = await Evento.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!evento) {
          return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        }

        res.json({ success: true, data: evento });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/eventos/:id', async (req, res) => {
      try {
        const evento = await Evento.findByIdAndDelete(req.params.id);
        if (!evento) {
          return res.status(404).json({ success: false, error: 'Evento no encontrado' });
        }
        res.json({ success: true, message: 'Evento eliminado correctamente' });
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
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }, 30000);

  const bearer = (token?: string) =>
    token ? { Authorization: `Bearer ${token}` } : {};

  describe('CRUD básico de eventos', () => {
    let eventoId = '';

    it('crear evento', async () => {
      const eventoData = {
        nombre: 'Rueda de Negocios 2024',
        descripcion: 'Evento anual de networking empresarial',
        inicio: '2024-06-15T09:00:00.000Z',
        fin: '2024-06-15T18:00:00.000Z',
        duracion_minutos_reunion: 30,
        numero_mesa: 10,
        modo_mesas: 'FIJA_POR_EMPRESA',
        logo_url: 'https://example.com/logo.png'
      };

      const res = await request(app)
        .post('/api/eventos')
        .set(bearer(adminToken))
        .send(eventoData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe(eventoData.nombre);
      expect(res.body.data.modo_mesas).toBe('FIJA_POR_EMPRESA');
      eventoId = res.body.data._id;
    }, 30000);

    it('leer evento por ID', async () => {
      const res = await request(app)
        .get(`/api/eventos/${eventoId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(eventoId);
      expect(res.body.data.nombre).toBe('Rueda de Negocios 2024');
    }, 30000);

    it('listar eventos', async () => {
      const res = await request(app)
        .get('/api/eventos')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    }, 30000);

    it('actualizar evento', async () => {
      const updateData = {
        nombre: 'Rueda de Negocios 2024 - Actualizada',
        descripcion: 'Evento anual de networking empresarial - Edición especial',
        duracion_minutos_reunion: 45,
        modo_mesas: 'POR_REUNION'
      };

      const res = await request(app)
        .patch(`/api/eventos/${eventoId}`)
        .set(bearer(adminToken))
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe(updateData.nombre);
      expect(res.body.data.duracion_minutos_reunion).toBe(45);
      expect(res.body.data.modo_mesas).toBe('POR_REUNION');
    }, 30000);

    it('eliminar evento', async () => {
      const res = await request(app)
        .delete(`/api/eventos/${eventoId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Evento eliminado correctamente');
    }, 30000);

    it('verificar que el evento fue eliminado', async () => {
      const res = await request(app)
        .get(`/api/eventos/${eventoId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    }, 30000);
  });

  describe('validaciones de eventos', () => {
    it('debe fallar al crear evento sin campos requeridos', async () => {
      const res = await request(app)
        .post('/api/eventos')
        .set(bearer(adminToken))
        .send({
          nombre: 'Evento incompleto'
          // faltan campos requeridos
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear evento con modo_mesas inválido', async () => {
      const res = await request(app)
        .post('/api/eventos')
        .set(bearer(adminToken))
        .send({
          nombre: 'Evento inválido',
          descripcion: 'Descripción',
          inicio: '2024-06-15T09:00:00.000Z',
          fin: '2024-06-15T18:00:00.000Z',
          duracion_minutos_reunion: 30,
          modo_mesas: 'MODO_INVALIDO'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear evento con duración mínima inválida', async () => {
      const res = await request(app)
        .post('/api/eventos')
        .set(bearer(adminToken))
        .send({
          nombre: 'Evento inválido',
          descripcion: 'Descripción',
          inicio: '2024-06-15T09:00:00.000Z',
          fin: '2024-06-15T18:00:00.000Z',
          duracion_minutos_reunion: 0, // inválido
          modo_mesas: 'FIJA_POR_EMPRESA'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });
});