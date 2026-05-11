import { initFirebase, admin } from '../lib/firebase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { fileUrl } = req.body;
  if (!fileUrl) return res.status(400).send('No file URL');

  try {
    initFirebase();
    
    let filePath = fileUrl;
    if (fileUrl.includes('/o/')) {
      filePath = decodeURIComponent(fileUrl.split('/o/')[1].split('?')[0]);
    } else if (fileUrl.includes('storage.googleapis.com')) {
      const parts = new URL(fileUrl).pathname.split('/');
      filePath = parts.slice(2).join('/');
    }

    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    res.status(200).json({ signedUrl });
  } catch (err) {
    console.error('Signed URL Error:', err);
    res.status(500).json({ error: err.message });
  }
}
