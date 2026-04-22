const multer = require('multer');
const { initFirebase, admin } = require('./lib/firebase');

// Multier config for memory storage (Vercel has no disk access)
const storage = multer.memoryStorage();
const upload = multer({ storage });

export const config = {
  api: {
    bodyParser: false, // Disabling bodyParser to let multer handle multipart/form-data
  },
};

// Helper function to run middleware in serverless
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  await runMiddleware(req, res, upload.single('file'));

  const file = req.file;
  const { uid, folder } = req.body;

  if (!file) return res.status(400).send('No file uploaded');

  const app = initFirebase();
  const bucket = admin.storage().bucket();

  try {
    const filename = `${folder || 'uploads'}/${uid || 'guest'}_${Date.now()}_${file.originalname}`;
    const blob = bucket.file(filename);

    const blobStream = blob.createWriteStream({
      metadata: { contentType: file.mimetype },
      resumable: false,
    });

    blobStream.on('error', (err) => res.status(500).json({ error: err.message }));

    blobStream.on('finish', async () => {
      // Set public access or get signed URL
      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
      res.status(200).json({ url: publicUrl });
    });

    blobStream.end(file.buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
