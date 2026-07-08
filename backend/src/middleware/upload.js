import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
const evidenceDir = path.join(uploadsDir, 'evidence');
if (!fs.existsSync(evidenceDir)) fs.mkdirSync(evidenceDir, { recursive: true });
const avatarDir = path.join(uploadsDir, 'avatars');
if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
const receiptDir = path.join(uploadsDir, 'receipts');
if (!fs.existsSync(receiptDir)) fs.mkdirSync(receiptDir, { recursive: true });

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
const ALLOWED_IMAGE_MIME = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB
const MAX_AVATAR_BYTES = 3 * 1024 * 1024; // 3MB

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

const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, avatarDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, unique);
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      return cb(new Error('فقط فایل عکس (PNG/JPEG/WebP) مجاز است.'));
    }
    cb(null, true);
  },
}).single('avatar_file');

export function publicAvatarUrl(filename) {
  return `/uploads/avatars/${filename}`;
}

const receiptStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, receiptDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
    cb(null, unique);
  },
});

// Payout receipt/proof-of-transfer that an admin can optionally attach when
// marking a ticket-withdrawal request as paid.
export const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('فقط فایل عکس (PNG/JPEG/WebP) یا PDF مجاز است.'));
    }
    cb(null, true);
  },
}).single('receipt_file');

export function publicReceiptUrl(filename) {
  return `/uploads/receipts/${filename}`;
}
