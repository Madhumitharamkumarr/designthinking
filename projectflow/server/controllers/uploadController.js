const { uploadToCloudinary } = require('../middleware/upload');

// @desc   Upload file to Cloudinary
// @route  POST /api/upload
// @access Authenticated
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await uploadToCloudinary(req.file.buffer, req.file.originalname);

    res.json({
      fileUrl: result.secure_url,
      fileName: req.file.originalname,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes,
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ message: 'File upload failed: ' + error.message });
  }
};

module.exports = { uploadFile };
