import multer from 'multer';

const storage = multer.memoryStorage();

const allowedMimes = [
  // imágenes
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  // pdf
  'application/pdf',
  // videos
  'video/mp4', 'video/webm', 'video/quicktime'
];

export const upload = multer({
  storage,
  limits: { fileSize: (Number(process.env.UPLOAD_MAX_FILE_MB) || 10) * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedMimes.includes(file.mimetype) || file.mimetype.startsWith('image/')) return cb(null, true);
    cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
  }
});
