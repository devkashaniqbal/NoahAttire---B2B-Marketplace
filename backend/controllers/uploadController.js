const crypto = require('crypto');
const path = require('path');
const { getFirebaseBucket } = require('../config/firebaseAdmin');

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const ext = path.extname(req.file.originalname || '') || '.jpg';
    const filename = `b2b-marketplace/${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;

    const bucket = getFirebaseBucket();
    const file = bucket.file(filename);

    await file.save(req.file.buffer, {
      metadata: { contentType: req.file.mimetype },
    });
    await file.makePublic();

    const url = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    res.json({ url, publicId: filename });
  } catch (err) {
    next(err);
  }
};
