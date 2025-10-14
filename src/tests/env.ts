// Setup environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-1234567890'; // >=16 chars
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.MONGODB_URI = 'mongodb://dummy/fake-tests';
process.env.DB_NAME = 'test_db';
process.env.ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.RATE_LIMIT_WINDOW_MS = '900000'; // 15 minutes
process.env.RATE_LIMIT_MAX = '100';
process.env.CLOUDINARY_CLOUD_NAME = '';
process.env.CLOUDINARY_API_KEY = '';
process.env.CLOUDINARY_API_SECRET = '';
process.env.CLOUDINARY_FOLDER = '';
process.env.UPLOAD_MAX_FILE_MB = '10';
