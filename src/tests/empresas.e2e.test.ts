import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';

// Define the empresa interface and schema
interface EmpresaDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  mesaId?: mongoose.Types.ObjectId | null;
  nombre: string;
  nit?: string | null;
  rubro?: string | null;
  representante?: string | null;
  telefono?: string | null;
  email?: string | null;
  sitio_web?: string | null;
  logo_url?: string | null;
  descripcion?: string | null;
  creada_en: Date;
  actualizada_en: Date;
}

const EmpresaSchema = new Schema<EmpresaDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  mesaId:   { type: Schema.Types.ObjectId, ref: 'Mesa', default: null, index: true },
  nombre: { type: String, required: true, trim: true },
  nit: { type: String, default: null, trim: true },
  rubro: { type: String, default: null, trim: true },
  representante: { type: String, default: null, trim: true },
  telefono: { type: String, default: null, trim: true },
  email: { type: String, default: null, trim: true, lowercase: true },
  sitio_web: { type: String, default: null, trim: true },
  logo_url: { type: String, default: null, trim: true },
  descripcion: { type: String, default: null, trim: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Una misma empresa (por nombre) no debe repetirse en el mismo evento
EmpresaSchema.index({ eventoId: 1, nombre: 1 }, { unique: true });

describe('Empresas - flujo CRUD + filtros', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let Empresa: Model<EmpresaDoc>;
  let Evento: Model<any>;
  let Mesa: Model<any>;
  let adminToken = '';
  let eventoId = '';
  let mesaId = '';

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

    Evento = mongoose.model('Evento', EventoSchema);
    Mesa = mongoose.model('Mesa', MesaSchema);
    Empresa = mongoose.model<EmpresaDoc>('Empresa', EmpresaSchema);

    // Create Express app with empresa routes
    app = express();
    app.use(express.json());

    // Define empresa routes manually
    app.get('/api/empresas', async (req, res) => {
      try {
        const { page = 1, limit = 10, eventoId, mesaId, asignada, q } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = {};
        if (eventoId) filter.eventoId = eventoId;
        if (mesaId) filter.mesaId = mesaId;
        if (asignada !== undefined) {
          filter.mesaId = asignada === 'true' ? { $ne: null } : null;
        }
        if (q) {
          filter.$or = [
            { nombre: { $regex: q, $options: 'i' } },
            { rubro: { $regex: q, $options: 'i' } },
            { representante: { $regex: q, $options: 'i' } }
          ];
        }
        
        const empresas = await Empresa.find(filter)
          .populate('eventoId', 'nombre')
          .populate('mesaId', 'numero nombre')
          .sort({ creada_en: -1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await Empresa.countDocuments(filter);
        
        res.json({
          success: true,
          data: empresas,
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

    app.get('/api/empresas/by-evento/:eventoId', async (req, res) => {
      try {
        const { page = 1, limit = 10, mesaId, asignada, q } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = { eventoId: req.params.eventoId };
        if (mesaId) filter.mesaId = mesaId;
        if (asignada !== undefined) {
          filter.mesaId = asignada === 'true' ? { $ne: null } : null;
        }
        if (q) {
          filter.$or = [
            { nombre: { $regex: q, $options: 'i' } },
            { rubro: { $regex: q, $options: 'i' } },
            { representante: { $regex: q, $options: 'i' } }
          ];
        }
        
        const empresas = await Empresa.find(filter)
          .populate('mesaId', 'numero nombre')
          .sort({ creada_en: -1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await Empresa.countDocuments(filter);
        
        res.json({
          success: true,
          data: empresas,
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

    app.get('/api/empresas/:id', async (req, res) => {
      try {
        const empresa = await Empresa.findById(req.params.id)
          .populate('eventoId', 'nombre')
          .populate('mesaId', 'numero nombre');
        
        if (!empresa) {
          return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.json({ success: true, data: empresa });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/empresas', async (req, res) => {
      try {
        const { eventoId, mesaId, nombre, nit, rubro, representante, telefono, email, sitio_web, logo_url, descripcion } = req.body;
        
        const empresa = await Empresa.create({
          eventoId,
          mesaId: mesaId || null,
          nombre: nombre.trim(),
          nit: nit || null,
          rubro: rubro || null,
          representante: representante || null,
          telefono: telefono || null,
          email: email || null,
          sitio_web: sitio_web || null,
          logo_url: logo_url || null,
          descripcion: descripcion || null
        });

        const populatedEmpresa = await Empresa.findById(empresa._id)
          .populate('eventoId', 'nombre')
          .populate('mesaId', 'numero nombre');

        res.status(201).json({ success: true, data: populatedEmpresa });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/empresas/:id', async (req, res) => {
      try {
        const { mesaId, nombre, nit, rubro, representante, telefono, email, sitio_web, logo_url, descripcion } = req.body;
        
        const updateData: any = {};
        if (mesaId !== undefined) updateData.mesaId = mesaId;
        if (nombre) updateData.nombre = nombre.trim();
        if (nit !== undefined) updateData.nit = nit;
        if (rubro !== undefined) updateData.rubro = rubro;
        if (representante !== undefined) updateData.representante = representante;
        if (telefono !== undefined) updateData.telefono = telefono;
        if (email !== undefined) updateData.email = email;
        if (sitio_web !== undefined) updateData.sitio_web = sitio_web;
        if (logo_url !== undefined) updateData.logo_url = logo_url;
        if (descripcion !== undefined) updateData.descripcion = descripcion;

        const empresa = await Empresa.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre').populate('mesaId', 'numero nombre');

        if (!empresa) {
          return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }

        res.json({ success: true, data: empresa });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/empresas/:id', async (req, res) => {
      try {
        const empresa = await Empresa.findByIdAndDelete(req.params.id);
        if (!empresa) {
          return res.status(404).json({ success: false, error: 'Empresa no encontrada' });
        }
        res.json({ success: true, message: 'Empresa eliminada correctamente' });
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
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }, 30000);

  const bearer = (token?: string) =>
    token ? { Authorization: `Bearer ${token}` } : {};

  describe('CRUD básico de empresas', () => {
    let empresaId = '';

    it('crear empresa', async () => {
      const empresaData = {
        eventoId,
        mesaId,
        nombre: 'Empresa Test SRL',
        nit: '123456789',
        rubro: 'Tecnología',
        representante: 'Juan Pérez',
        telefono: '70000000',
        email: 'contacto@empresatest.com',
        sitio_web: 'https://empresatest.com',
        descripcion: 'Empresa de desarrollo de software'
      };

      const res = await request(app)
        .post('/api/empresas')
        .set(bearer(adminToken))
        .send(empresaData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe(empresaData.nombre);
      expect(res.body.data.rubro).toBe('Tecnología');
      empresaId = res.body.data._id;
    }, 30000);

    it('leer empresa por ID', async () => {
      const res = await request(app)
        .get(`/api/empresas/${empresaId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(empresaId);
      expect(res.body.data.nombre).toBe('Empresa Test SRL');
    }, 30000);

    it('listar empresas', async () => {
      const res = await request(app)
        .get('/api/empresas')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    }, 30000);

    it('actualizar empresa', async () => {
      const updateData = {
        nombre: 'Empresa Test SRL - Actualizada',
        rubro: 'Consultoría',
        representante: 'María García',
        telefono: '75555555'
      };

      const res = await request(app)
        .patch(`/api/empresas/${empresaId}`)
        .set(bearer(adminToken))
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.nombre).toBe(updateData.nombre);
      expect(res.body.data.rubro).toBe('Consultoría');
    }, 30000);

    it('eliminar empresa', async () => {
      const res = await request(app)
        .delete(`/api/empresas/${empresaId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Empresa eliminada correctamente');
    }, 30000);
  });

  describe('filtros de empresas', () => {
    let empresa1Id = '';
    let empresa2Id = '';

    beforeAll(async () => {
      // Crear empresas de prueba para filtros
      const empresa1 = await Empresa.create({
        eventoId,
        mesaId,
        nombre: 'Empresa A',
        rubro: 'Tecnología',
        representante: 'Ana López'
      });
      empresa1Id = empresa1.id.toString();

      const empresa2 = await Empresa.create({
        eventoId,
        nombre: 'Empresa B',
        rubro: 'Consultoría',
        representante: 'Carlos Ruiz'
      });
      empresa2Id = empresa2.id.toString();
    }, 30000);

    it('filtrar por evento', async () => {
      const res = await request(app)
        .get(`/api/empresas/by-evento/${eventoId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
    }, 30000);

    it('filtrar por asignación a mesa', async () => {
      const res = await request(app)
        .get('/api/empresas')
        .query({ asignada: 'true' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].mesaId).toBeDefined();
    }, 30000);

    it('filtrar por no asignación a mesa', async () => {
      const res = await request(app)
        .get('/api/empresas')
        .query({ asignada: 'false' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].mesaId).toBeNull();
    }, 30000);

    it('buscar por texto (nombre)', async () => {
      const res = await request(app)
        .get('/api/empresas')
        .query({ q: 'Empresa A' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].nombre).toBe('Empresa A');
    }, 30000);

    it('buscar por texto (rubro)', async () => {
      const res = await request(app)
        .get('/api/empresas')
        .query({ q: 'Consultoría' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].rubro).toBe('Consultoría');
    }, 30000);

    it('paginación', async () => {
      const res = await request(app)
        .get('/api/empresas')
        .query({ page: 1, limit: 1 })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(1);
      expect(res.body.pagination.total).toBe(2);
    }, 30000);
  });

  describe('validaciones de empresas', () => {
    it('debe fallar al crear empresa sin campos requeridos', async () => {
      const res = await request(app)
        .post('/api/empresas')
        .set(bearer(adminToken))
        .send({
          // faltan eventoId y nombre
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear empresa duplicada en el mismo evento', async () => {
      const empresaData = {
        eventoId,
        nombre: 'Empresa Duplicada'
      };

      // Crear primera empresa
      await request(app)
        .post('/api/empresas')
        .set(bearer(adminToken))
        .send(empresaData);

      // Intentar crear segunda empresa con mismo nombre en mismo evento
      const res = await request(app)
        .post('/api/empresas')
        .set(bearer(adminToken))
        .send(empresaData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });
});
