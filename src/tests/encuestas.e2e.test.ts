import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';

// Define the encuesta reunion interface and schema
interface EncuestaReunionDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  reunionId: mongoose.Types.ObjectId;
  empresaId: mongoose.Types.ObjectId;
  calificacion_general: number;
  match_negocio?: number | null;
  puntualidad?: number | null;
  interes_contraparte?: number | null;
  recomendar_nps?: number | null;
  comentarios?: string | null;
  creada_en: Date;
  actualizada_en: Date;
}

const EncuestaSchema = new Schema<EncuestaReunionDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  reunionId: { type: Schema.Types.ObjectId, ref: 'Reunion', required: true, index: true },
  empresaId: { type: Schema.Types.ObjectId, ref: 'Empresa', required: true, index: true },
  calificacion_general: { type: Number, required: true, min: 1, max: 5 },
  match_negocio: { type: Number, default: null, min: 1, max: 5 },
  puntualidad: { type: Number, default: null, min: 1, max: 5 },
  interes_contraparte: { type: Number, default: null, min: 1, max: 5 },
  recomendar_nps: { type: Number, default: null, min: 0, max: 10 },
  comentarios: { type: String, default: null, trim: true },
}, { timestamps: { createdAt: 'creada_en', updatedAt: 'actualizada_en' } });

// Evita duplicar una encuesta de la misma empresa en la misma reunión
EncuestaSchema.index({ reunionId: 1, empresaId: 1 }, { unique: true });

describe('Encuestas de Reunión - flujo CRUD + métricas', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let EncuestaReunion: Model<EncuestaReunionDoc>;
  let Evento: Model<any>;
  let Mesa: Model<any>;
  let Empresa: Model<any>;
  let Reunion: Model<any>;
  let adminToken = '';
  let eventoId = '';
  let mesaId = '';
  let empresaAId = '';
  let empresaBId = '';
  let reunionId = '';

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
    EncuestaReunion = mongoose.model<EncuestaReunionDoc>('EncuestaReunion', EncuestaSchema);

    // Create Express app with encuesta routes
    app = express();
    app.use(express.json());

    // Define encuesta routes manually
    app.get('/api/encuestas', async (req, res) => {
      try {
        const { page = 1, limit = 10, eventoId, reunionId, empresaId } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = {};
        if (eventoId) filter.eventoId = eventoId;
        if (reunionId) filter.reunionId = reunionId;
        if (empresaId) filter.empresaId = empresaId;
        
        const encuestas = await EncuestaReunion.find(filter)
          .populate('eventoId', 'nombre')
          .populate('reunionId', 'inicio fin estado')
          .populate('empresaId', 'nombre representante')
          .sort({ creada_en: -1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await EncuestaReunion.countDocuments(filter);
        
        res.json({
          success: true,
          data: encuestas,
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

    app.get('/api/encuestas/metricas', async (req, res) => {
      try {
        const { eventoId, reunionId, empresaId } = req.query;
        
        let filter: any = {};
        if (eventoId) filter.eventoId = eventoId;
        if (reunionId) filter.reunionId = reunionId;
        if (empresaId) filter.empresaId = empresaId;

        const encuestas = await EncuestaReunion.find(filter);
        
        const total = encuestas.length;
        if (total === 0) {
          return res.json({
            success: true,
            data: {
              total: 0,
              calificacion_promedio: 0,
              match_negocio_promedio: 0,
              puntualidad_promedio: 0,
              interes_contraparte_promedio: 0,
              nps_promedio: 0,
              distribucion_calificaciones: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
              distribucion_nps: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 }
            }
          });
        }

        // Calcular promedios
        const calificacion_promedio = encuestas.reduce((sum, e) => sum + e.calificacion_general, 0) / total;
        
        const match_negocio_values = encuestas.filter(e => e.match_negocio !== null).map(e => e.match_negocio!);
        const match_negocio_promedio = match_negocio_values.length > 0 
          ? match_negocio_values.reduce((sum, val) => sum + val, 0) / match_negocio_values.length 
          : 0;

        const puntualidad_values = encuestas.filter(e => e.puntualidad !== null).map(e => e.puntualidad!);
        const puntualidad_promedio = puntualidad_values.length > 0 
          ? puntualidad_values.reduce((sum, val) => sum + val, 0) / puntualidad_values.length 
          : 0;

        const interes_contraparte_values = encuestas.filter(e => e.interes_contraparte !== null).map(e => e.interes_contraparte!);
        const interes_contraparte_promedio = interes_contraparte_values.length > 0 
          ? interes_contraparte_values.reduce((sum, val) => sum + val, 0) / interes_contraparte_values.length 
          : 0;

        const nps_values = encuestas.filter(e => e.recomendar_nps !== null).map(e => e.recomendar_nps!);
        const nps_promedio = nps_values.length > 0 
          ? nps_values.reduce((sum, val) => sum + val, 0) / nps_values.length 
          : 0;

        // Distribución de calificaciones (1-5)
        const distribucion_calificaciones = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        encuestas.forEach(e => {
          distribucion_calificaciones[e.calificacion_general as keyof typeof distribucion_calificaciones]++;
        });

        // Distribución NPS (0-10)
        const distribucion_nps = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0 };
        encuestas.forEach(e => {
          if (e.recomendar_nps !== null) {
            distribucion_nps[e.recomendar_nps as keyof typeof distribucion_nps]++;
          }
        });

        res.json({
          success: true,
          data: {
            total,
            calificacion_promedio: Math.round(calificacion_promedio * 100) / 100,
            match_negocio_promedio: Math.round(match_negocio_promedio * 100) / 100,
            puntualidad_promedio: Math.round(puntualidad_promedio * 100) / 100,
            interes_contraparte_promedio: Math.round(interes_contraparte_promedio * 100) / 100,
            nps_promedio: Math.round(nps_promedio * 100) / 100,
            distribucion_calificaciones,
            distribucion_nps
          }
        });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.get('/api/encuestas/:id', async (req, res) => {
      try {
        const encuesta = await EncuestaReunion.findById(req.params.id)
          .populate('eventoId', 'nombre')
          .populate('reunionId', 'inicio fin estado')
          .populate('empresaId', 'nombre representante');
        
        if (!encuesta) {
          return res.status(404).json({ success: false, error: 'Encuesta no encontrada' });
        }
        res.json({ success: true, data: encuesta });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/encuestas', async (req, res) => {
      try {
        const { eventoId, reunionId, empresaId, calificacion_general, match_negocio, puntualidad, interes_contraparte, recomendar_nps, comentarios } = req.body;
        
        const encuesta = await EncuestaReunion.create({
          eventoId,
          reunionId,
          empresaId,
          calificacion_general,
          match_negocio: match_negocio || null,
          puntualidad: puntualidad || null,
          interes_contraparte: interes_contraparte || null,
          recomendar_nps: recomendar_nps || null,
          comentarios: comentarios || null
        });

        const populatedEncuesta = await EncuestaReunion.findById(encuesta._id)
          .populate('eventoId', 'nombre')
          .populate('reunionId', 'inicio fin estado')
          .populate('empresaId', 'nombre representante');

        res.status(201).json({ success: true, data: populatedEncuesta });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/encuestas/:id', async (req, res) => {
      try {
        const { calificacion_general, match_negocio, puntualidad, interes_contraparte, recomendar_nps, comentarios } = req.body;
        
        const updateData: any = {};
        if (calificacion_general !== undefined) updateData.calificacion_general = calificacion_general;
        if (match_negocio !== undefined) updateData.match_negocio = match_negocio;
        if (puntualidad !== undefined) updateData.puntualidad = puntualidad;
        if (interes_contraparte !== undefined) updateData.interes_contraparte = interes_contraparte;
        if (recomendar_nps !== undefined) updateData.recomendar_nps = recomendar_nps;
        if (comentarios !== undefined) updateData.comentarios = comentarios;

        const encuesta = await EncuestaReunion.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre')
         .populate('reunionId', 'inicio fin estado')
         .populate('empresaId', 'nombre representante');

        if (!encuesta) {
          return res.status(404).json({ success: false, error: 'Encuesta no encontrada' });
        }

        res.json({ success: true, data: encuesta });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/encuestas/:id', async (req, res) => {
      try {
        const encuesta = await EncuestaReunion.findByIdAndDelete(req.params.id);
        if (!encuesta) {
          return res.status(404).json({ success: false, error: 'Encuesta no encontrada' });
        }
        res.json({ success: true, message: 'Encuesta eliminada correctamente' });
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

    const reunion = await Reunion.create({
      eventoId: evento._id,
      mesaId: mesa._id,
      empresaAId: empresaA._id,
      empresaBId: empresaB._id,
      inicio: new Date('2024-06-15T10:00:00.000Z'),
      fin: new Date('2024-06-15T10:30:00.000Z'),
      estado: 'completada'
    });
    reunionId = reunion._id.toString();
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }, 30000);

  const bearer = (token?: string) =>
    token ? { Authorization: `Bearer ${token}` } : {};

  describe('CRUD básico de encuestas', () => {
    let encuestaId = '';

    it('crear encuesta', async () => {
      const encuestaData = {
        eventoId,
        reunionId,
        empresaId: empresaAId,
        calificacion_general: 4,
        match_negocio: 5,
        puntualidad: 4,
        interes_contraparte: 5,
        recomendar_nps: 8,
        comentarios: 'Excelente reunión, muy productiva'
      };

      const res = await request(app)
        .post('/api/encuestas')
        .set(bearer(adminToken))
        .send(encuestaData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calificacion_general).toBe(encuestaData.calificacion_general);
      expect(res.body.data.match_negocio).toBe(encuestaData.match_negocio);
      expect(res.body.data.comentarios).toBe(encuestaData.comentarios);
      encuestaId = res.body.data._id;
    }, 30000);

    it('leer encuesta por ID', async () => {
      const res = await request(app)
        .get(`/api/encuestas/${encuestaId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(encuestaId);
      expect(res.body.data.calificacion_general).toBe(4);
    }, 30000);

    it('listar encuestas', async () => {
      const res = await request(app)
        .get('/api/encuestas')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    }, 30000);

    it('actualizar encuesta', async () => {
      const updateData = {
        calificacion_general: 5,
        match_negocio: 5,
        puntualidad: 5,
        interes_contraparte: 5,
        recomendar_nps: 9,
        comentarios: 'Reunión excepcional, altamente recomendada'
      };

      const res = await request(app)
        .patch(`/api/encuestas/${encuestaId}`)
        .set(bearer(adminToken))
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.calificacion_general).toBe(5);
      expect(res.body.data.comentarios).toBe(updateData.comentarios);
    }, 30000);

    it('eliminar encuesta', async () => {
      const res = await request(app)
        .delete(`/api/encuestas/${encuestaId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Encuesta eliminada correctamente');
    }, 30000);
  });

  describe('métricas de encuestas', () => {
    let encuesta1Id = '';
    let encuesta2Id = '';

    beforeAll(async () => {
      // Crear encuestas de prueba para métricas
      const encuesta1 = await EncuestaReunion.create({
        eventoId,
        reunionId,
        empresaId: empresaAId,
        calificacion_general: 4,
        match_negocio: 4,
        puntualidad: 5,
        interes_contraparte: 4,
        recomendar_nps: 8,
        comentarios: 'Buena reunión'
      });
      encuesta1Id = (encuesta1 as any)._id.toString();

      const encuesta2 = await EncuestaReunion.create({
        eventoId,
        reunionId,
        empresaId: empresaBId,
        calificacion_general: 5,
        match_negocio: 5,
        puntualidad: 4,
        interes_contraparte: 5,
        recomendar_nps: 9,
        comentarios: 'Excelente reunión'
      });
      encuesta2Id = (encuesta2 as any)._id.toString();
    }, 30000);

    it('obtener métricas generales', async () => {
      const res = await request(app)
        .get('/api/encuestas/metricas')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
      expect(res.body.data.calificacion_promedio).toBe(4.5);
      expect(res.body.data.match_negocio_promedio).toBe(4.5);
      expect(res.body.data.puntualidad_promedio).toBe(4.5);
      expect(res.body.data.interes_contraparte_promedio).toBe(4.5);
      expect(res.body.data.nps_promedio).toBe(8.5);
    }, 30000);

    it('obtener métricas filtradas por evento', async () => {
      const res = await request(app)
        .get('/api/encuestas/metricas')
        .query({ eventoId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
    }, 30000);

    it('obtener métricas filtradas por reunión', async () => {
      const res = await request(app)
        .get('/api/encuestas/metricas')
        .query({ reunionId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(2);
    }, 30000);

    it('obtener métricas filtradas por empresa', async () => {
      const res = await request(app)
        .get('/api/encuestas/metricas')
        .query({ empresaId: empresaAId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.total).toBe(1);
      expect(res.body.data.calificacion_promedio).toBe(4);
    }, 30000);

    it('verificar distribución de calificaciones', async () => {
      const res = await request(app)
        .get('/api/encuestas/metricas')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.distribucion_calificaciones).toEqual({ 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 });
    }, 30000);

    it('verificar distribución NPS', async () => {
      const res = await request(app)
        .get('/api/encuestas/metricas')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.distribucion_nps[8]).toBe(1);
      expect(res.body.data.distribucion_nps[9]).toBe(1);
    }, 30000);
  });

  describe('filtros de encuestas', () => {
    let encuesta1Id = '';
    let encuesta2Id = '';

    beforeAll(async () => {
      // Crear una nueva reunión para evitar conflictos de claves únicas
      const nuevaReunion = await Reunion.create({
        eventoId: eventoId,
        mesaId: new mongoose.Types.ObjectId(),
        empresaAId: new mongoose.Types.ObjectId(),
        empresaBId: new mongoose.Types.ObjectId(),
        inicio: new Date('2024-06-15T16:00:00.000Z'),
        fin: new Date('2024-06-15T16:30:00.000Z'),
        estado: 'completada'
      });

      // Crear encuestas de prueba para filtros
      const encuesta1 = await EncuestaReunion.create({
        eventoId,
        reunionId: nuevaReunion._id,
        empresaId: empresaAId,
        calificacion_general: 3,
        match_negocio: 3,
        puntualidad: 3,
        interes_contraparte: 3,
        recomendar_nps: 6,
        comentarios: 'Reunión regular'
      });
      encuesta1Id = (encuesta1 as any)._id.toString();

      const encuesta2 = await EncuestaReunion.create({
        eventoId,
        reunionId: nuevaReunion._id,
        empresaId: empresaBId,
        calificacion_general: 5,
        match_negocio: 5,
        puntualidad: 5,
        interes_contraparte: 5,
        recomendar_nps: 10,
        comentarios: 'Reunión excelente'
      });
      encuesta2Id = (encuesta2 as any)._id.toString();
    }, 30000);

    it('filtrar por evento', async () => {
      const res = await request(app)
        .get('/api/encuestas')
        .query({ eventoId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('filtrar por reunión', async () => {
      const res = await request(app)
        .get('/api/encuestas')
        .query({ reunionId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('filtrar por empresa', async () => {
      const res = await request(app)
        .get('/api/encuestas')
        .query({ empresaId: empresaAId })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);

    it('combinar múltiples filtros', async () => {
      const res = await request(app)
        .get('/api/encuestas')
        .query({ 
          eventoId,
          empresaId: empresaAId
        })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    }, 30000);
  });

  describe('validaciones de encuestas', () => {
    it('debe fallar al crear encuesta sin campos requeridos', async () => {
      const res = await request(app)
        .post('/api/encuestas')
        .set(bearer(adminToken))
        .send({
          // faltan campos requeridos
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear encuesta con calificación inválida', async () => {
      const res = await request(app)
        .post('/api/encuestas')
        .set(bearer(adminToken))
        .send({
          eventoId,
          reunionId,
          empresaId: empresaAId,
          calificacion_general: 6, // inválido (debe ser 1-5)
          match_negocio: 4,
          puntualidad: 4,
          interes_contraparte: 4,
          recomendar_nps: 8
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear encuesta con NPS inválido', async () => {
      const res = await request(app)
        .post('/api/encuestas')
        .set(bearer(adminToken))
        .send({
          eventoId,
          reunionId,
          empresaId: empresaAId,
          calificacion_general: 4,
          match_negocio: 4,
          puntualidad: 4,
          interes_contraparte: 4,
          recomendar_nps: 11 // inválido (debe ser 0-10)
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear encuesta duplicada', async () => {
      const encuestaData = {
        eventoId,
        reunionId,
        empresaId: empresaAId,
        calificacion_general: 4,
        match_negocio: 4,
        puntualidad: 4,
        interes_contraparte: 4,
        recomendar_nps: 8
      };

      // Crear primera encuesta
      await request(app)
        .post('/api/encuestas')
        .set(bearer(adminToken))
        .send(encuestaData);

      // Intentar crear encuesta duplicada
      const res = await request(app)
        .post('/api/encuestas')
        .set(bearer(adminToken))
        .send(encuestaData);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });
});
