const express = require('express');
const multer  = require('multer');
const admin   = require('firebase-admin');
const router  = express.Router();

// Memory storage for small file uploads (optimized for serverless/lambda)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * POST /api/upload/resume
 * Handles resume photo/file uploads via backend relay to avoid CORS
 */
router.post('/resume', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const bucket = admin.storage().bucket();
    const fileName = `resumes/${req.body.uid || 'guest'}_${Date.now()}_${req.file.originalname}`;
    const file = bucket.file(fileName);

    const stream = file.createWriteStream({
      metadata: { contentType: req.file.mimetype },
      public: true
    });

    stream.on('error', (err) => {
      console.error('Relay Upload Error:', err);
      res.status(500).json({ error: 'Failed to stream to Firebase' });
    });

    stream.on('finish', async () => {
      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
      res.json({ url: publicUrl, fileName });
    });

    stream.end(req.file.buffer);
  } catch (err) {
    console.error('Relay Setup Error:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/upload/material
 * Handles PDF material uploads for tutors
 */
router.post('/material', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  
    try {
      const bucket = admin.storage().bucket();
      const fileName = `materials/${req.body.tutorId || 'unknown'}/${Date.now()}_${req.file.originalname}`;
      const file = bucket.file(fileName);
  
      const stream = file.createWriteStream({
        metadata: { contentType: req.file.mimetype },
        public: true
      });
  
      stream.on('error', (err) => {
        console.error('Material Relay Error:', err);
        res.status(500).json({ error: 'Failed to stream to Firebase' });
      });
  
      stream.on('finish', async () => {
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
        res.json({ url: publicUrl, fileName });
      });
  
      stream.end(req.file.buffer);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

module.exports = router;
