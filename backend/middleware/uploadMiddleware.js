const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Setup storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + crypto.randomBytes(6).toString('hex');
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, 'file-' + uniqueSuffix + ext);
    }
});

// C1 FIX: Strict file filter — requires BOTH valid extension AND matching mimetype
// M3 FIX: Block SVG, HTML, PHP, and other dangerous file types
const ALLOWED_FILE_TYPES = {
    // Images (no SVG — SVG can contain scripts)
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

// Explicitly blocked extensions (defense in depth)
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

    // Block dangerous extensions first
    if (BLOCKED_EXTENSIONS.includes(ext)) {
        return cb(new Error(`File type .${ext} is not allowed for security reasons`));
    }

    // C1 FIX: Require BOTH valid extension AND matching mimetype (AND instead of OR)
    const allowedMimes = ALLOWED_FILE_TYPES[ext];
    if (!allowedMimes) {
        return cb(new Error(`File type .${ext} is not allowed`));
    }

    if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error(`Invalid content type ${file.mimetype} for .${ext} file`));
    }

    cb(null, true);
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
    fileFilter: fileFilter
});

module.exports = upload;
