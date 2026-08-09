import multer from "multer";
import {NextFunction, Request, Response} from "express";
import cloudinary from "../../../config/cloudinary";
import {AuthenticatedRequest} from "./auth.middleware";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB max for audio/image
    },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype.startsWith("image/") || file.mimetype.startsWith("audio/") || file.mimetype.startsWith("video/")) {
            cb(null, true);
        } else {
            cb(new Error("Chỉ chấp nhận file định dạng hình ảnh hoặc âm thanh"));
        }
    }
});

export const uploadSingle = (fieldName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const uploadHandler = upload.single(fieldName);
        uploadHandler(req, res, (err: any) => {
            if (err) {
                if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({message: "Kích thước file vượt quá giới hạn cho phép"});
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
        const url = req.originalUrl || req.baseUrl || "";
        const isAudio = req.file.mimetype.startsWith("audio/") || req.file.mimetype.startsWith("video/") || url.includes("tracks");

        let folder = "avatars";
        let resource_type: "image" | "video" | "raw" | "auto" = "image";
        let type: "upload" | "authenticated" | "private" = "upload";

        if (url.includes("albums")) {
            folder = "albums";
        } else if (url.includes("artists")) {
            folder = "artists";
        } else if (isAudio) {
            folder = "tracks";
            resource_type = "video";
            type = "authenticated"; // Upload private audio file
        }

        const streamUpload = (fileBuffer: Buffer): Promise<{secure_url: string; public_id: string; duration?: number}> => {
            return new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        resource_type,
                        type
                    },
                    (error, result) => {
                        if (result) {
                            resolve(result as {secure_url: string; public_id: string; duration?: number});
                        } else {
                            reject(error);
                        }
                    }
                );
                stream.end(fileBuffer);
            });
        };

        const result = await streamUpload(req.file.buffer);
        if (isAudio) {
            // For private Cloudinary assets, store the public_id or secure_url
            req.body.audio_url = result.public_id;
            if (result.duration && (!req.body.duration_seconds || isNaN(Number(req.body.duration_seconds)))) {
                req.body.duration_seconds = Math.round(result.duration);
            }
        } else {
            req.body.avatar_url = result.secure_url;
            req.body.cover_url = result.secure_url;
        }
        next();
    } catch (error) {
        return res.status(500).json({message: "Lỗi khi tải file lên Cloudinary"});
    }
};
