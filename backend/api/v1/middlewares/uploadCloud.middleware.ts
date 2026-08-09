import multer from "multer";
import {NextFunction, Request, Response} from "express";
import cloudinary from "../../../config/cloudinary";
import {AuthenticatedRequest} from "./auth.middleware";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ chấp nhận file định dạng hình ảnh"));
        }
    }
});

export const uploadSingle = (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const uploadHandler = upload.single(fieldName);
        uploadHandler(req, res, (err: any) => {
            if (err) {
                if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({message: "Kích thước file không được vượt quá 5MB"});
                }
                return res.status(400).json({message: err.message || "Lỗi khi upload file"});
            }
            next();
        });
    };
};

export const uploadToCloudinary = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.file) {
        return next();
    }

    try {
        const streamUpload = (fileBuffer: Buffer): Promise<{secure_url: string}> => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder: "avatars",
                        resource_type: "image"
                    },
                    (error, result) => {
                        if (result) {
                            resolve(result as {secure_url: string});
                        } else {
                            reject(error);
                        }
                    }
                );
                stream.end(fileBuffer);
            });
        };

        const result = await streamUpload(req.file.buffer);
        req.body.avatar_url = result.secure_url;
        next();
    } catch (error) {
        return res.status(500).json({message: "Lỗi khi tải ảnh lên Cloudinary"});
    }
};
