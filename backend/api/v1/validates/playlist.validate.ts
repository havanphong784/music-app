import {NextFunction, Request, Response} from "express";
import validator from "validator";

export const getPlaylists = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {page, limit} = req.query;

    if (page !== undefined) {
        const pageNum = Number(page);
        if (isNaN(pageNum) || !Number.isInteger(pageNum) || pageNum < 1) {
            return res.status(400).json({message: "Trang (page) phải là số nguyên dương"});
        }
    }

    if (limit !== undefined) {
        const limitNum = Number(limit);
        if (isNaN(limitNum) || !Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({message: "Giới hạn (limit) phải là số nguyên dương từ 1 đến 100"});
        }
    }

    next();
};

export const getPlaylistById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID danh sách phát không đúng định dạng UUID"});
    }
    next();
};

export const createPlaylist = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {title, cover_url, is_public} = req.body;

    if (!title || typeof title !== "string" || !title.trim() || title.trim().length > 255) {
        return res.status(400).json({message: "Tên danh sách phát (title) không được để trống và tối đa 255 ký tự"});
    }

    if (cover_url !== undefined && cover_url !== null && cover_url !== "") {
        if (typeof cover_url !== "string" || !validator.isURL(cover_url)) {
            return res.status(400).json({message: "Đường dẫn ảnh bìa không hợp lệ"});
        }
    }

    if (is_public !== undefined && typeof is_public !== "boolean" && is_public !== "true" && is_public !== "false") {
        return res.status(400).json({message: "Trạng thái công khai (is_public) phải là boolean (true/false)"});
    }

    next();
};

export const updatePlaylist = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {title, cover_url, is_public} = req.body;
    const hasFile = !!req.file;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID danh sách phát không đúng định dạng UUID"});
    }

    if (title === undefined && cover_url === undefined && is_public === undefined && !hasFile) {
        return res.status(400).json({message: "Cần cung cấp ít nhất một thông tin để cập nhật (title, cover_url, is_public hoặc file ảnh)"});
    }

    if (title !== undefined) {
        if (typeof title !== "string" || !title.trim() || title.trim().length > 255) {
            return res.status(400).json({message: "Tên danh sách phát (title) không được để trống và tối đa 255 ký tự"});
        }
    }

    if (cover_url !== undefined && cover_url !== null && cover_url !== "") {
        if (typeof cover_url !== "string" || !validator.isURL(cover_url)) {
            return res.status(400).json({message: "Đường dẫn ảnh bìa không hợp lệ"});
        }
    }

    if (is_public !== undefined && typeof is_public !== "boolean" && is_public !== "true" && is_public !== "false") {
        return res.status(400).json({message: "Trạng thái công khai (is_public) phải là boolean (true/false)"});
    }

    next();
};

export const addTrack = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {track_id, position} = req.body;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID danh sách phát không đúng định dạng UUID"});
    }

    if (!track_id || typeof track_id !== "string" || !validator.isUUID(track_id)) {
        return res.status(400).json({message: "track_id không đúng định dạng UUID"});
    }

    if (position !== undefined && (isNaN(Number(position)) || !Number.isInteger(Number(position)) || Number(position) < 1)) {
        return res.status(400).json({message: "Vị trí bài hát (position) phải là số nguyên dương"});
    }

    next();
};

export const reorderTracks = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {items} = req.body;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID danh sách phát không đúng định dạng UUID"});
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({message: "Danh sách bài hát cần sắp xếp (items) không được để trống"});
    }

    for (const item of items) {
        if (!item.track_id || typeof item.track_id !== "string" || !validator.isUUID(item.track_id)) {
            return res.status(400).json({message: "Mỗi phần tử items phải chứa track_id đúng định dạng UUID"});
        }
        if (item.position === undefined || isNaN(Number(item.position)) || !Number.isInteger(Number(item.position)) || Number(item.position) < 1) {
            return res.status(400).json({message: "Mỗi phần tử items phải chứa position là số nguyên dương"});
        }
    }

    next();
};

export const removeTrack = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id, trackId} = req.params;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID danh sách phát không đúng định dạng UUID"});
    }

    if (!trackId || typeof trackId !== "string" || !validator.isUUID(trackId)) {
        return res.status(400).json({message: "trackId không đúng định dạng UUID"});
    }

    next();
};
