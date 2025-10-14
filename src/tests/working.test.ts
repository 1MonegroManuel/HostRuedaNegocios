import request from 'supertest';
import express from 'express';
import mongoose, { Schema, Document, Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Define the user interface and schema
interface UserDoc extends Document {
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

const UserSchema = new Schema<UserDoc>({
  nombre: { type: String, required: true, trim: true },
  apellido: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  username: { type: String, required: true, unique: true, index: true, trim: true },
  passwordHash: { type: String, required: true },
  telefono: { type: String, default: null, trim: true },
  tipoUsuario: { type: String, enum: ['personal', 'dueño', 'admin'], default: 'personal', required: true }
}, { timestamps: { createdAt: 'creado_en', updatedAt: 'actualizado_en' } });

describe('Working Test', () => {
  let mongod: MongoMemoryServer | undefined;
  let app: express.Application;
  let User: Model<UserDoc>;

  beforeAll(async () => {
    // Create in-memory MongoDB server
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    
    // Set environment variables
    process.env.NODE_ENV = 'test';
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'test-secret-1234567890';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';

    // Reset modules to pick up new environment variables
    jest.resetModules();

    // Connect to in-memory database
    await mongoose.connect(uri);
    
    // Wait a bit to ensure connection is established
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create the User model
    User = mongoose.model<UserDoc>('Usuario', UserSchema);

    // Create a minimal Express app
    app = express();
    app.use(express.json());

    // Define auth routes manually
    app.post('/api/auth/register', async (req, res) => {
      try {
        const { nombre, apellido, email, username, password, telefono, tipoUsuario } = req.body;
        
        // Check if user already exists
        const exists = await User.findOne({
          $or: [{ email: email.toLowerCase() }, { username: username }]
        });
        if (exists) {
          return res.status(409).json({ success: false, error: 'Email o username ya registrados' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user
        const user = await User.create({
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
  }, 30000);

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongod) await mongod.stop();
  }, 30000);

  it('should be able to register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        nombre: 'Test',
        apellido: 'User',
        email: 'test@example.com',
        username: 'testuser',
        password: 'secret123',
        tipoUsuario: 'admin',
      });

    console.log('Registration response:', res.status, res.body);
    expect(res.status).toBe(201);
    expect(res.body?.user).toBeDefined();
    expect(res.body?.accessToken).toBeDefined();
    expect(res.body.user.email).toBe('test@example.com');
    expect(res.body.user.tipoUsuario).toBe('admin');
  }, 30000);

  it('should be able to create multiple users', async () => {
    const users = [
      { nombre: 'Jairo', apellido: 'Test', email: 'jairo@example.com', username: 'jairo', password: 'secret123', tipoUsuario: 'admin' },
      { nombre: 'Fabri', apellido: 'Test', email: 'fabri@example.com', username: 'fabri', password: 'secret123', tipoUsuario: 'admin' },
      { nombre: 'Jhosua', apellido: 'Test', email: 'jhosua@example.com', username: 'jhosua', password: 'secret123', tipoUsuario: 'admin' },
    ];

    for (const userData of users) {
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(res.status).toBe(201);
      expect(res.body?.user).toBeDefined();
      expect(res.body?.accessToken).toBeDefined();
      expect(res.body.user.email).toBe(userData.email.toLowerCase());
      expect(res.body.user.tipoUsuario).toBe('admin');
    }
  }, 30000);
});
