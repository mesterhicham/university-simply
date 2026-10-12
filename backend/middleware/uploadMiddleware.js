const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure public uploads directory exists
const publicUploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(publicUploadsDir)) {
    fs.mkdirSync(publicUploadsDir, { recursive: true });
}

// Ensure private uploads directory exists (never served via static route)
const privateUploadsDir = path.join(__dirname, '..', 'private_uploads');
if (!fs.existsSync(privateUploadsDir)) {
    fs.mkdirSync(privateUploadsDir, { recursive: true });
}

// Helper to create disk storage
const createStorage = (targetDir) => multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, targetDir);
    },
    filename: (req, file, cb) => {
        const uniqueId = crypto.randomUUID();
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `file-${uniqueId}${ext}`);
    }
});

// Allowed file types mapping
const ALLOWED_FILE_TYPES = {
    // Images
    'jpeg': ['image/jpeg'],
    'jpg': ['image/jpeg'],
    'png': ['image/png'],
    'webp': ['image/webp'],
    'gif': ['image/gif'],
    'bmp': ['image/bmp'],
    'avif': ['image/avif'],
    // Documents
    'pdf': ['application/pdf'],
    'doc': ['application/msword'],
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'xls': ['application/vnd.ms-excel'],
    'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    'ppt': ['application/vnd.ms-powerpoint'],
    'pptx': ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
    'txt': ['text/plain'],
    // Media
    'mp3': ['audio/mpeg', 'audio/mp3'],
    'wav': ['audio/wav', 'audio/x-wav'],
    'ogg': ['audio/ogg'],
    'mp4': ['video/mp4'],
    'webm': ['video/webm', 'audio/webm'],
    'mov': ['video/quicktime'],
};

// Explicitly blocked dangerous extensions
const BLOCKED_EXTENSIONS = [
    'php', 'phtml', 'php3', 'php4', 'php5', 'phps',
    'exe', 'bat', 'cmd', 'com', 'msi', 'scr', 'ps1', 'vbs',
    'jsp', 'asp', 'aspx', 'cgi', 'pl', 'py', 'rb', 'sh',
    'svg', 'html', 'htm', 'xhtml', 'shtml',
    'htaccess', 'htpasswd',
    'jar', 'war', 'class',
];

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');

    if (BLOCKED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`File type .${ext} is blocked for security reasons`));
    }

    const allowedMimes = ALLOWED_FILE_TYPES[ext];
    if (!allowedMimes) {
        return cb(new Error(`File extension .${ext} is not permitted`));
    }

    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error(`Invalid content type ${file.mimetype} for .${ext} file`));
    }

    cb(null, true);
};

// File signature (Magic Bytes) inspection
function verifyFileSignature(filePath, ext) {
    try {
        const buffer = Buffer.alloc(16);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, buffer, 0, 16, 0);
        fs.closeSync(fd);

        if (ext === 'jpg' || ext === 'jpeg') {
            return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
        }
        if (ext === 'png') {
            return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
        }
        if (ext === 'gif') {
            return buffer.toString('ascii', 0, 4) === 'GIF8';
        }
        if (ext === 'pdf') {
            return buffer.toString('ascii', 0, 4) === '%PDF';
        }
        if (ext === 'webp') {
            return buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP';
        }
        if (['docx', 'xlsx', 'pptx'].includes(ext)) {
            return buffer[0] === 0x50 && buffer[1] === 0x4B;
        }
        if (ext === 'txt') {
            for (let i = 0; i < 16; i++) {
                if (buffer[i] === 0) return false;
            }
            return true;
        }
        if (ext === 'mp4') {
            return buffer.toString('ascii', 4, 8) === 'ftyp';
        }
        return true;
    } catch (_) {
        return false;
    }
}

// Middleware to enforce magic bytes verification
function validateMagicBytes(req, res, next) {
    if (!req.file) return next();
    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const isValid = verifyFileSignature(req.file.path, ext);
    if (!isValid) {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
        return res.status(400).json({ error: 'File content does not match the declared extension (invalid file signature).' });
    }
    next();
}

const publicUpload = multer({
    storage: createStorage(publicUploadsDir),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
    fileFilter
});

const privateUpload = multer({
    storage: createStorage(privateUploadsDir),
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter
});

module.exports = {
    upload: publicUpload,
    publicUpload,
    privateUpload,
    validateMagicBytes,
    publicUploadsDir,
    privateUploadsDir
};
