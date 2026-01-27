import mongoose from 'mongoose';
import Grid from 'gridfs-stream';
import { Readable } from 'stream';

let gfs;
let gridfsBucket;

// Initialize GridFS
export const initGridFS = (connection) => {
    gfs = Grid(connection.db, mongoose.mongo);
    gfs.collection('audiofiles');

    gridfsBucket = new mongoose.mongo.GridFSBucket(connection.db, {
        bucketName: 'audiofiles'
    });

    console.log('✓ GridFS initialized successfully');
};

/**
 * Upload file to GridFS
 * @param {Buffer} fileBuffer - File buffer
 * @param {Object} metadata - File metadata
 * @returns {Promise<string>} - File ID
 */
export const uploadToGridFS = (fileBuffer, metadata) => {
    return new Promise((resolve, reject) => {
        const readableStream = Readable.from(fileBuffer);

        const uploadStream = gridfsBucket.openUploadStream(metadata.filename, {
            metadata: {
                originalname: metadata.originalname,
                mimetype: metadata.mimetype,
                size: metadata.size,
                uploadDate: new Date(),
                userId: metadata.userId,
            }
        });

        readableStream.pipe(uploadStream);

        uploadStream.on('error', (error) => {
            reject(error);
        });

        uploadStream.on('finish', () => {
            resolve(uploadStream.id.toString());
        });
    });
};

/**
 * Download file from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Buffer>} - File buffer
 */
export const downloadFromGridFS = (fileId) => {
    return new Promise((resolve, reject) => {
        try {
            const chunks = [];
            const downloadStream = gridfsBucket.openDownloadStream(
                new mongoose.Types.ObjectId(fileId)
            );

            downloadStream.on('data', (chunk) => {
                chunks.push(chunk);
            });

            downloadStream.on('error', (error) => {
                reject(error);
            });

            downloadStream.on('end', () => {
                resolve(Buffer.concat(chunks));
            });
        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Delete file from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<void>}
 */
export const deleteFromGridFS = async (fileId) => {
    try {
        await gridfsBucket.delete(new mongoose.Types.ObjectId(fileId));
    } catch (error) {
        throw new Error(`Failed to delete file from GridFS: ${error.message}`);
    }
};

/**
 * Get file metadata from GridFS
 * @param {string} fileId - GridFS file ID
 * @returns {Promise<Object>} - File metadata
 */
export const getGridFSFileInfo = async (fileId) => {
    try {
        const files = await gridfsBucket
            .find({ _id: new mongoose.Types.ObjectId(fileId) })
            .toArray();

        if (!files || files.length === 0) {
            throw new Error('File not found');
        }

        return files[0];
    } catch (error) {
        throw new Error(`Failed to get file info: ${error.message}`);
    }
};

/**
 * Stream file from GridFS (for direct download)
 * @param {string} fileId - GridFS file ID
 * @param {Object} res - Express response object
 */
export const streamFromGridFS = (fileId, res) => {
    try {
        const downloadStream = gridfsBucket.openDownloadStream(
            new mongoose.Types.ObjectId(fileId)
        );

        downloadStream.on('error', (error) => {
            res.status(404).json({
                success: false,
                message: 'File not found',
                error: error.message
            });
        });

        downloadStream.on('file', (file) => {
            res.set({
                'Content-Type': file.metadata.mimetype,
                'Content-Disposition': `attachment; filename="${file.metadata.originalname}"`,
                'Content-Length': file.length
            });
        });

        downloadStream.pipe(res);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error streaming file',
            error: error.message
        });
    }
};

export default {
    initGridFS,
    uploadToGridFS,
    downloadFromGridFS,
    deleteFromGridFS,
    getGridFSFileInfo,
    streamFromGridFS
};
