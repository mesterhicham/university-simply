exports.uploadFile = (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Please upload a file' });
    }

    const host = req.get('host') || 'localhost:5001';
    // Validate host against allowed pattern to prevent host header poisoning
    const safeHost = /^[a-zA-Z0-9.:_-]+$/.test(host) ? host : 'localhost:5001';
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${safeHost}`;
    const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;
    res.json({
        message: 'File uploaded successfully',
        filename: req.file.filename,
        url: fileUrl
    });
};
