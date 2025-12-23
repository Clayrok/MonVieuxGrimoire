const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
    destination: (req, file, callback) => {
        callback(null, 'upload');
    },
    filename: (req, file, callback) => {
        const name = file.originalname.split(' ').join('_');
        callback(null, Date.now() + '_' + name);
    }
});

const fileFilter = (req, file, callback) => {
    if (file.mimetype.startsWith('image/')) {
        callback(null, true);
    } else {
        callback(new Error('Seules les images sont autorisées.'), false);
    }
};

module.exports = multer({ storage: storage, fileFilter: fileFilter }).single('image');

module.exports.compressImage = (req, res, next) => {
    if (!req.file) {
        return next();
    }

    const inputPath = req.file.path;
    const outputPath = inputPath.replace(/\.[^/.]+$/, '.webp');
    const filename = path.basename(outputPath);

    sharp(inputPath)
        .resize(600, null, {
            withoutEnlargement: true,
            fit: 'inside'
        })
        .webp({ quality: 50 })
        .toFile(outputPath)
        .then(() => {
            fs.rmSync(inputPath);

            req.file.filename = filename;
            req.file.path = outputPath;
            req.file.originalname = req.file.originalname.replace(/\.[^/.]+$/, '.webp');
            req.file.mimetype = 'image/webp';

            next();
        })
        .catch(error => {
            console.error('La compression a échoué :', error);
            next({ message: error.message });
        });
};