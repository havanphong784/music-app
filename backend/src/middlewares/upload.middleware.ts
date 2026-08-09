import multer from "multer";
import {NextFunction, Request, Response} from "express";
import cloudinary from "../config/cloudinary";
import {AuthenticatedRequest} from "./auth.middleware";
import {destroyCloudinaryAsset, UploadedCloudinaryAsset} from "../utils/cloudinary-asset";

const storage = multer.memoryStorage();

type UploadMediaType = "image" | "audio";

export const isAllowedMimeType = (mimeType: string, mediaType: UploadMediaType) =>
    mimeType.startsWith(`${mediaType}/`);

export const hasValidFileSignature = (buffer: Buffer, mediaType: UploadMediaType) => {
    if (mediaType === "image") {
        const png = buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
        const jpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
        const gif = buffer.subarray(0, 4).toString("ascii") === "GIF8";
        const webp = buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
        return png || jpeg || gif || webp;
    }

    const id3 = buffer.subarray(0, 3).toString("ascii") === "ID3";
    const mp3Frame = buffer[0] === 0xff && (buffer[1] & 0xe0) === 0xe0;
    const wav = buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WAVE";
    const flac = buffer.subarray(0, 4).toString("ascii") === "fLaC";
    return id3 || mp3Frame || wav || flac;
};

export const uploadSingle = (fieldName: string, mediaType: UploadMediaType) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const upload = multer({
            storage,
            limits: {
                fileSize: mediaType === "audio" ? 50 * 1024 * 1024 : 10 * 1024 * 1024
            },
            fileFilter: (_req, file, cb) => {
                if (isAllowedMimeType(file.mimetype, mediaType)) {
                    return cb(null, true);
                }
                cb(new Error(mediaType === "audio"
                    ? "Chỉ chấp nhận file âm thanh"
                    : "Chỉ chấp nhận file hình ảnh"));
            }
        });
        const uploadHandler = upload.single(fieldName);
        uploadHandler(req, res, (err: any) => {
            if (err) {
                if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
                    return res.status(400).json({message: "Kích thước file vượt quá giới hạn cho phép"});
                }
                return res.status(400).json({message: err.message || "Lỗi khi upload file"});
            }
            if (req.file && !hasValidFileSignature(req.file.buffer, mediaType)) {
                return res.status(400).json({message: "Nội dung file không khớp với định dạng cho phép"});
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
        const isAudio = req.file.mimetype.startsWith("audio/");

        let folder = "avatars";
        let resource_type: "image" | "video" | "raw" | "auto" = "image";
        let type: "upload" | "authenticated" | "private" = "upload";

        if (url.includes("albums")) {
            folder = "albums";
        } else if (url.includes("artists")) {
            folder = "artists";
        } else if (url.includes("playlists")) {
            folder = "playlists";
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
        const uploadedAsset: UploadedCloudinaryAsset = {
            publicId: result.public_id,
            resourceType: isAudio ? "video" : "image",
            deliveryType: isAudio ? "authenticated" : "upload"
        };
        req.uploadedAsset = uploadedAsset;
        let responseFinished = false;
        res.once("finish", () => {
            responseFinished = true;
            if (res.statusCode >= 400) void destroyCloudinaryAsset(uploadedAsset);
        });
        res.once("close", () => {
            if (!responseFinished) void destroyCloudinaryAsset(uploadedAsset);
        });
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
