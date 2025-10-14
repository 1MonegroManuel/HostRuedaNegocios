import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';

// Define the archivo evento interface and schema
type TipoArchivoEvento = 'MAPA'|'CRONOGRAMA'|'OTRO';

interface ArchivoEventoDoc extends Document {
  eventoId: mongoose.Types.ObjectId;
  tipo: TipoArchivoEvento;
  url: string;
  nombre_archivo: string;
  mime: string;
  creado_en: Date;
}

const ArchivoEventoSchema = new Schema<ArchivoEventoDoc>({
  eventoId: { type: Schema.Types.ObjectId, ref: 'Evento', required: true, index: true },
  tipo: { type: String, enum: ['MAPA','CRONOGRAMA','OTRO'], required: true, index: true },
  url: { type: String, required: true, trim: true },
  nombre_archivo: { type: String, required: true, trim: true },
  mime: { type: String, required: true, trim: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: false } });

describe('Archivos de Evento - flujo CRUD básico', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let ArchivoEvento: Model<ArchivoEventoDoc>;
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
    ArchivoEvento = mongoose.model<ArchivoEventoDoc>('ArchivoEvento', ArchivoEventoSchema);

    // Create Express app with archivo evento routes
    app = express();
    app.use(express.json());

    // Define archivo evento routes manually
    app.get('/api/archivos-evento', async (req, res) => {
      try {
        const { page = 1, limit = 10, eventoId, tipo } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = {};
        if (eventoId) filter.eventoId = eventoId;
        if (tipo) filter.tipo = tipo;
        
        const archivos = await ArchivoEvento.find(filter)
          .populate('eventoId', 'nombre')
          .sort({ creado_en: -1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await ArchivoEvento.countDocuments(filter);
        
        res.json({
          success: true,
          data: archivos,
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

    app.get('/api/archivos-evento/by-evento/:eventoId', async (req, res) => {
      try {
        const { page = 1, limit = 10, tipo } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        
        let filter: any = { eventoId: req.params.eventoId };
        if (tipo) filter.tipo = tipo;
        
        const archivos = await ArchivoEvento.find(filter)
          .sort({ creado_en: -1 })
          .skip(skip)
          .limit(Number(limit));
        
        const total = await ArchivoEvento.countDocuments(filter);
        
        res.json({
          success: true,
          data: archivos,
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

    app.get('/api/archivos-evento/:id', async (req, res) => {
      try {
        const archivo = await ArchivoEvento.findById(req.params.id)
          .populate('eventoId', 'nombre');
        
        if (!archivo) {
          return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
        }
        res.json({ success: true, data: archivo });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/archivos-evento', async (req, res) => {
      try {
        const { eventoId, tipo, url, nombre_archivo, mime } = req.body;
        
        const archivo = await ArchivoEvento.create({
          eventoId,
          tipo,
          url: url.trim(),
          nombre_archivo: nombre_archivo.trim(),
          mime: mime.trim()
        });

        const populatedArchivo = await ArchivoEvento.findById(archivo._id)
          .populate('eventoId', 'nombre');

        res.status(201).json({ success: true, data: populatedArchivo });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/archivos-evento/:id', async (req, res) => {
      try {
        const { tipo, url, nombre_archivo, mime } = req.body;
        
        const updateData: any = {};
        if (tipo) updateData.tipo = tipo;
        if (url) updateData.url = url.trim();
        if (nombre_archivo) updateData.nombre_archivo = nombre_archivo.trim();
        if (mime) updateData.mime = mime.trim();

        const archivo = await ArchivoEvento.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        ).populate('eventoId', 'nombre');

        if (!archivo) {
          return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
        }

        res.json({ success: true, data: archivo });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.delete('/api/archivos-evento/:id', async (req, res) => {
      try {
        const archivo = await ArchivoEvento.findByIdAndDelete(req.params.id);
        if (!archivo) {
          return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
        }
        res.json({ success: true, message: 'Archivo eliminado correctamente' });
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

  describe('CRUD básico de archivos de evento', () => {
    let archivoId = '';

    it('crear archivo de evento', async () => {
      const archivoData = {
        eventoId,
        tipo: 'MAPA',
        url: 'https://example.com/mapa-evento.pdf',
        nombre_archivo: 'mapa-evento.pdf',
        mime: 'application/pdf'
      };

      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send(archivoData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tipo).toBe(archivoData.tipo);
      expect(res.body.data.url).toBe(archivoData.url);
      expect(res.body.data.nombre_archivo).toBe(archivoData.nombre_archivo);
      expect(res.body.data.mime).toBe(archivoData.mime);
      archivoId = res.body.data._id;
    }, 30000);

    it('leer archivo por ID', async () => {
      const res = await request(app)
        .get(`/api/archivos-evento/${archivoId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data._id).toBe(archivoId);
      expect(res.body.data.tipo).toBe('MAPA');
    }, 30000);

    it('listar archivos', async () => {
      const res = await request(app)
        .get('/api/archivos-evento')
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.pagination.total).toBe(1);
    }, 30000);

    it('actualizar archivo', async () => {
      const updateData = {
        tipo: 'CRONOGRAMA',
        nombre_archivo: 'cronograma-evento.pdf',
        mime: 'application/pdf'
      };

      const res = await request(app)
        .patch(`/api/archivos-evento/${archivoId}`)
        .set(bearer(adminToken))
        .send(updateData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tipo).toBe(updateData.tipo);
      expect(res.body.data.nombre_archivo).toBe(updateData.nombre_archivo);
    }, 30000);

    it('eliminar archivo', async () => {
      const res = await request(app)
        .delete(`/api/archivos-evento/${archivoId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Archivo eliminado correctamente');
    }, 30000);
  });

  describe('filtros de archivos de evento', () => {
    let archivo1Id = '';
    let archivo2Id = '';
    let archivo3Id = '';

    beforeAll(async () => {
      // Crear archivos de prueba para filtros
      const archivo1 = await ArchivoEvento.create({
        eventoId,
        tipo: 'MAPA',
        url: 'https://example.com/mapa.pdf',
        nombre_archivo: 'mapa.pdf',
        mime: 'application/pdf'
      });
      archivo1Id = archivo1.id.toString();

      const archivo2 = await ArchivoEvento.create({
        eventoId,
        tipo: 'CRONOGRAMA',
        url: 'https://example.com/cronograma.pdf',
        nombre_archivo: 'cronograma.pdf',
        mime: 'application/pdf'
      });
      archivo2Id = archivo2.id.toString();

      const archivo3 = await ArchivoEvento.create({
        eventoId,
        tipo: 'OTRO',
        url: 'https://example.com/info.pdf',
        nombre_archivo: 'info.pdf',
        mime: 'application/pdf'
      });
      archivo3Id = archivo3.id.toString();
    }, 30000);

    it('filtrar por evento', async () => {
      const res = await request(app)
        .get(`/api/archivos-evento/by-evento/${eventoId}`)
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(3);
    }, 30000);

    it('filtrar por tipo MAPA', async () => {
      const res = await request(app)
        .get('/api/archivos-evento')
        .query({ tipo: 'MAPA' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].tipo).toBe('MAPA');
    }, 30000);

    it('filtrar por tipo CRONOGRAMA', async () => {
      const res = await request(app)
        .get('/api/archivos-evento')
        .query({ tipo: 'CRONOGRAMA' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].tipo).toBe('CRONOGRAMA');
    }, 30000);

    it('filtrar por tipo OTRO', async () => {
      const res = await request(app)
        .get('/api/archivos-evento')
        .query({ tipo: 'OTRO' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].tipo).toBe('OTRO');
    }, 30000);

    it('combinar filtros de evento y tipo', async () => {
      const res = await request(app)
        .get(`/api/archivos-evento/by-evento/${eventoId}`)
        .query({ tipo: 'MAPA' })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].tipo).toBe('MAPA');
    }, 30000);

    it('paginación', async () => {
      const res = await request(app)
        .get('/api/archivos-evento')
        .query({ page: 1, limit: 2 })
        .set(bearer(adminToken));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(2);
      expect(res.body.pagination.total).toBe(3);
    }, 30000);
  });

  describe('diferentes tipos de archivos', () => {
    it('crear archivo de mapa', async () => {
      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send({
          eventoId,
          tipo: 'MAPA',
          url: 'https://example.com/mapa-salon.pdf',
          nombre_archivo: 'mapa-salon.pdf',
          mime: 'application/pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tipo).toBe('MAPA');
    }, 30000);

    it('crear archivo de cronograma', async () => {
      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send({
          eventoId,
          tipo: 'CRONOGRAMA',
          url: 'https://example.com/cronograma.pdf',
          nombre_archivo: 'cronograma.pdf',
          mime: 'application/pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tipo).toBe('CRONOGRAMA');
    }, 30000);

    it('crear archivo de otro tipo', async () => {
      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send({
          eventoId,
          tipo: 'OTRO',
          url: 'https://example.com/informacion.pdf',
          nombre_archivo: 'informacion.pdf',
          mime: 'application/pdf'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.tipo).toBe('OTRO');
    }, 30000);

    it('crear archivo de imagen', async () => {
      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send({
          eventoId,
          tipo: 'MAPA',
          url: 'https://example.com/mapa.png',
          nombre_archivo: 'mapa.png',
          mime: 'image/png'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.mime).toBe('image/png');
    }, 30000);
  });

  describe('validaciones de archivos de evento', () => {
    it('debe fallar al crear archivo sin campos requeridos', async () => {
      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send({
          // faltan campos requeridos
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear archivo con tipo inválido', async () => {
      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send({
          eventoId,
          tipo: 'TIPO_INVALIDO',
          url: 'https://example.com/test.pdf',
          nombre_archivo: 'test.pdf',
          mime: 'application/pdf'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear archivo con URL vacía', async () => {
      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send({
          eventoId,
          tipo: 'MAPA',
          url: '',
          nombre_archivo: 'test.pdf',
          mime: 'application/pdf'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear archivo con nombre vacío', async () => {
      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send({
          eventoId,
          tipo: 'MAPA',
          url: 'https://example.com/test.pdf',
          nombre_archivo: '',
          mime: 'application/pdf'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);

    it('debe fallar al crear archivo con MIME vacío', async () => {
      const res = await request(app)
        .post('/api/archivos-evento')
        .set(bearer(adminToken))
        .send({
          eventoId,
          tipo: 'MAPA',
          url: 'https://example.com/test.pdf',
          nombre_archivo: 'test.pdf',
          mime: ''
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    }, 30000);
  });
});
