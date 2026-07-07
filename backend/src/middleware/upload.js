import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const evidenceDir = path.join(uploadsDir, 'evidence');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, evidenceDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, unique);
  },
});

// Photo/text evidence for disputed رو-در-رو results — "عکس از مستندات بازی
// برای کارشناس وب‌سایت می‌فرستد". Accepts PNG/JPEG/WebP/PDF up to 8MB.
export const uploadEvidence = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('فقط فایل عکس (PNG/JPEG/WebP) یا PDF مجاز است.'));
    }
    cb(null, true);
  },
}).single('evidence_file');

export function publicEvidenceUrl(filename) {
  return `/uploads/evidence/${filename}`;
}
