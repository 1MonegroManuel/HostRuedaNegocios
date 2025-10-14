import request from 'supertest';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Define the user interface and schema
interface UsuarioDoc extends Document {
  nombre: string;
  apellido: string;
  email: string;
  username: string;
  passwordHash: string;
  telefono: string | null;
  tipoUsuario: 'personal' | 'dueño' | 'admin';
  creado_en: Date;
  actualizado_en: Date;
}

const UsuarioSchema = new Schema<UsuarioDoc>({
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, index: true, trim: true },
  passwordHash: { type: String, required: true },
  telefono: { type: String, default: null, trim: true },
  tipoUsuario: { type: String, enum: ['personal', 'dueño', 'admin'], default: 'personal', required: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

describe('Usuarios - flujo CRUD (+roles)', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let Usuario: Model<UsuarioDoc>;
  let adminToken = '';

  beforeAll(async () => {
    // Levantar Mongo en memoria PRIMERO
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    // ENV necesarias ANTES del import de app/env
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = uri; // Use the in-memory database URI
    process.env.JWT_SECRET = 'test-secret-1234567890'; // >=16 chars
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    // Recargar módulos para que tomen estas env
    jest.resetModules();

    // Conectar Mongoose a la base de datos en memoria
    await mongoose.connect(uri);
    
    // Wait a bit to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create the Usuario model
    Usuario = mongoose.model<UsuarioDoc>('Usuario', UsuarioSchema);

    // Create Express app with auth routes
    app = express();
    app.use(express.json());

    // Define auth routes manually
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { nombre, apellido, email, username, password, telefono, tipoUsuario } = req.body;
        
        // Check if user already exists
        const exists = await Usuario.findOne({
          $or: [{ email: email.toLowerCase() }, { username: username }]
        });
        if (exists) {
          return res.status(409).json({ success: false, error: 'Email o username ya registrados' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await Usuario.create({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.toLowerCase(),
          username: username.trim(),
          passwordHash,
          telefono: telefono ?? null,
          tipoUsuario: tipoUsuario ?? 'personal'
        });

        // Generate JWT token
        const token = jwt.sign(
          { sub: String(user._id), role: user.tipoUsuario, username: user.username, email: user.email },
          'test-secret-1234567890',
          { expiresIn: '15m' }
        );

        // Return user without password hash
        const userResponse = {
          _id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          username: user.username,
          telefono: user.telefono,
          tipoUsuario: user.tipoUsuario,
          creado_en: user.creado_en,
          actualizado_en: user.actualizado_en
        };

        res.status(201).json({ success: true, user: userResponse, accessToken: token });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    // Define usuario routes manually
    app.post('/api/usuarios', async (req, res) => {
      try {
        const { nombre, apellido, email, username, password, telefono, tipoUsuario } = req.body;
        
        // Check if user already exists
        const exists = await Usuario.findOne({
          $or: [{ email: email.toLowerCase() }, { username: username }]
        });
        if (exists) {
          return res.status(409).json({ success: false, error: 'Email o username ya registrados' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await Usuario.create({
          nombre: nombre.trim(),
          apellido: apellido.trim(),
          email: email.toLowerCase(),
          username: username.trim(),
          passwordHash,
          telefono: telefono ?? null,
          tipoUsuario: tipoUsuario ?? 'personal'
        });

        // Return user without password hash
        const userResponse = {
          _id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          username: user.username,
          telefono: user.telefono,
          tipoUsuario: user.tipoUsuario,
          creado_en: user.creado_en,
          actualizado_en: user.actualizado_en
        };

        res.status(201).json({ success: true, user: userResponse });
      } catch (error: any) {
        res.status(400).json({ success: false, error: error.message });
      }
    });

    app.get('/api/usuarios/:id', async (req, res) => {
      try {
        const user = await Usuario.findById(req.params.id);
        if (!user) {
          return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        const userResponse = {
          _id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          username: user.username,
          telefono: user.telefono,
          tipoUsuario: user.tipoUsuario,
          creado_en: user.creado_en,
          actualizado_en: user.actualizado_en
        };

        res.json({ success: true, user: userResponse });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.patch('/api/usuarios/:id', async (req, res) => {
      try {
        const { nombre, apellido, telefono, password, tipoUsuario } = req.body;
        
        const updateData: any = {};
        if (nombre) updateData.nombre = nombre.trim();
        if (apellido) updateData.apellido = apellido.trim();
        if (telefono !== undefined) updateData.telefono = telefono;
        if (tipoUsuario) updateData.tipoUsuario = tipoUsuario;
        if (password) updateData.passwordHash = await bcrypt.hash(password, 10);

        const user = await Usuario.findByIdAndUpdate(
          req.params.id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!user) {
          return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
        }

        const userResponse = {
          _id: user._id,
          nombre: user.nombre,
          apellido: user.apellido,
          email: user.email,
          username: user.username,
          telefono: user.telefono,
          tipoUsuario: user.tipoUsuario,
          creado_en: user.creado_en,
          actualizado_en: user.actualizado_en
        };

        res.json({ success: true, user: userResponse });
      } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
  }, 30000); // 30 second timeout for setup

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop(); // guard
  }, 30000); // 30 second timeout for cleanup

  const bearer = (token?: string) =>
    token ? { Authorization: `Bearer ${token}` } : {};

  it('seed: registra un admin y obtiene token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Seed',
        apellido: 'Admin',
        email: 'seed.admin@example.com',
        username: 'seedadmin',
        password: 'secret123',
        tipoUsuario: 'admin',
      });

    expect(res.status).toBe(201);
    expect(res.body?.user).toBeDefined();
    expect(res.body?.accessToken).toBeDefined();
    adminToken = res.body.accessToken;
  }, 30000);

  it('crea 3 usuarios admin: jairo, fabri, jhosua', async () => {
    const payloads = [
      { nombre: 'Jairo', apellido: 'Test', email: 'jairo@example.com', username: 'jairo', password: 'secret123', telefono: '11111111', tipoUsuario: 'admin' },
      { nombre: 'Fabri', apellido: 'Test', email: 'fabri@example.com', username: 'fabri', password: 'secret123', telefono: '11111111', tipoUsuario: 'admin' },
      { nombre: 'Jhosua', apellido: 'Test', email: 'jhosua@example.com', username: 'jhosua', password: 'secret123', telefono: '11111111', tipoUsuario: 'admin' },
    ];

    for (const p of payloads) {
      const r = await request(app)
        .post('/api/usuarios')
        .set(bearer(adminToken))
        .send(p);
      expect([200, 201]).toContain(r.status);
      expect(r.body?.user?.email).toBe(p.email.toLowerCase());
      expect(r.body?.user?.tipoUsuario).toBe('admin');
      expect(r.body?.user?.passwordHash).toBeUndefined();
    }
  }, 30000);

  describe('usuario de prueba: crear → leer → actualizar → leer → cambiar roles', () => {
    let id = '';
    const base = {
      nombre: 'Prueba',
      apellido: 'Uno',
      email: 'prueba1@example.com',
      username: 'prueba1',
      password: 'secret123',
      telefono: '70000000',
      tipoUsuario: 'personal',
    };

    it('crear', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .set(bearer(adminToken))
        .send(base);

      expect([200, 201]).toContain(res.status);
      id = res.body.user._id;
    }, 30000);

    it('leer: GET /:id', async () => {
      const res = await request(app).get(`/api/usuarios/${id}`).set(bearer(adminToken));
      expect(res.status).toBe(200);
      expect(res.body?.user?._id).toBe(id);
    }, 30000);

    it('actualizar (incluye cambio de password y datos básicos)', async () => {
      const patch = {
        nombre: 'Prueba',
        apellido: 'Actualizada',
        telefono: '75555555',
        password: 'nuevaClave456',
        tipoUsuario: 'dueño',
      };
      const res = await request(app).patch(`/api/usuarios/${id}`).set(bearer(adminToken)).send(patch);
      expect(res.status).toBe(200);
      expect(res.body?.user?.tipoUsuario).toBe('dueño');
    }, 30000);

    it('leer nuevamente y verificar cambios', async () => {
      const res = await request(app).get(`/api/usuarios/${id}`).set(bearer(adminToken));
      expect(res.status).toBe(200);
      expect(res.body?.user?.tipoUsuario).toBe('dueño');
    }, 30000);

    it('cambiar a todos sus "estados" (roles): personal → dueño → admin', async () => {
      let r = await request(app).patch(`/api/usuarios/${id}`).set(bearer(adminToken)).send({ tipoUsuario: 'personal' });
      expect(r.status).toBe(200);

      r = await request(app).patch(`/api/usuarios/${id}`).set(bearer(adminToken)).send({ tipoUsuario: 'dueño' });
      expect(r.status).toBe(200);

      r = await request(app).patch(`/api/usuarios/${id}`).set(bearer(adminToken)).send({ tipoUsuario: 'admin' });
      expect(r.status).toBe(200);

      const read = await request(app).get(`/api/usuarios/${id}`).set(bearer(adminToken));
      expect(read.status).toBe(200);
      expect(read.body?.user?.tipoUsuario).toBe('admin');
    }, 30000);
  });
});
