import multer from 'multer';
import path from 'path';
import fs from 'fs';
const dir = 'uploads';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
export const upload = multer({
  storage: multer.diskStorage({
    destination: dir,
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
  }),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, /image\/(png|jpe?g|webp|gif)/.test(file.mimetype));
  },
});
