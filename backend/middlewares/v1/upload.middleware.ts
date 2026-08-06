import multer from 'multer';
import {NextFunction, Request, Response} from 'express';
import cloudinary from '../../config/cloudinary.config.js';

const storage = multer.memoryStorage();

export const uploadMultipleFiles = multer({
    storage,
    limits: {fileSize: 50 * 1024 * 1024}, // 50MB
    fileFilter: (req, file, cb) => {
        if (
            file.mimetype.startsWith('audio/') ||
            file.mimetype.startsWith('image/') ||
            file.mimetype === 'text/plain' ||
            file.mimetype === 'application/pdf'
        ) {
            cb(null, true);
        } else {
            cb(new Error(`Định dạng file không được hỗ trợ cho ${file.fieldname}!`));
        }
    },
});

const streamUpload = (
    fileBuffer: Buffer,
    folder: string,
    resourceType: "auto" | "video" | "image" | "raw" = "auto",
    type: "upload" | "authenticated" | "private" = "upload"
): Promise<any> => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {folder, resource_type: resourceType, type},
            (error: any, result: any) => {
                if (result) resolve(result);
                else reject(error);
            }
        );
        stream.end(fileBuffer);
    });
};

export const uploadToCloudinaryMultiple = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return next();
    }

    try {
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        const uploadPromises: Promise<void>[] = [];
        const uploadResults: Record<string, string | number> = {};

        for (const fieldName in files) {
            const file = files[fieldName][0];
            let resourceType: "auto" | "video" | "image" | "raw" = "auto";
            let accessType: "upload" | "authenticated" | "private" = "upload";

            if (fieldName === 'audio') {
                resourceType = 'video';
                accessType = 'authenticated';
            }
            if (fieldName === 'avatar') resourceType = 'image';
            if (fieldName === 'lyrics') resourceType = 'raw';

            const uploadTask = streamUpload(file.buffer, `music-app/${fieldName}`, resourceType, accessType)
                .then((result) => {
                    if (fieldName !== 'audio') {
                        uploadResults[`${fieldName}Url`] = result.secure_url;
                    }
                    uploadResults[`${fieldName}PublicId`] = result.public_id;

                    if (fieldName === 'audio') {
                        uploadResults[`audioDuration`] = result.duration;
                    }
                });

            uploadPromises.push(uploadTask);
        }

        await Promise.all(uploadPromises);

        req.body = {...req.body, ...uploadResults};

        next();
    } catch (error) {
        next(error);
    }
};
