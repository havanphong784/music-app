import {NextFunction, Request, Response} from "express";
import validator from "validator";

export const getTracks = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {page, limit, album_id, genre_id} = req.query;

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

    if (album_id !== undefined && (typeof album_id !== "string" || !validator.isUUID(album_id))) {
        return res.status(400).json({message: "album_id không đúng định dạng UUID"});
    }

    if (genre_id !== undefined && (isNaN(Number(genre_id)) || !Number.isInteger(Number(genre_id)))) {
        return res.status(400).json({message: "genre_id phải là số nguyên"});
    }

    next();
};

export const getTrackById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID bài hát không đúng định dạng UUID"});
    }
    next();
};

export const streamTrack = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID bài hát không đúng định dạng UUID"});
    }
    next();
};

export const createTrack = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {title, duration_seconds, audio_url, album_id} = req.body;
    const hasFile = !!req.file;

    if (!title || typeof title !== "string" || !title.trim() || title.trim().length > 255) {
        return res.status(400).json({message: "Tiêu đề bài hát (title) không được để trống và tối đa 255 ký tự"});
    }

    if (!hasFile && (!audio_url || typeof audio_url !== "string" || !audio_url.trim())) {
        return res.status(400).json({message: "Cần cung cấp audio_url hoặc upload file âm thanh"});
    }

    if (duration_seconds !== undefined && (isNaN(Number(duration_seconds)) || Number(duration_seconds) < 0)) {
        return res.status(400).json({message: "Thời lượng bài hát (duration_seconds) phải là số dương"});
    }

    if (album_id !== undefined && album_id !== null && (typeof album_id !== "string" || !validator.isUUID(album_id))) {
        return res.status(400).json({message: "album_id không đúng định dạng UUID"});
    }

    next();
};

export const updateTrack = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {title, duration_seconds, audio_url, lyrics, album_id} = req.body;
    const hasFile = !!req.file;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID bài hát không đúng định dạng UUID"});
    }

    if (title === undefined && duration_seconds === undefined && audio_url === undefined && lyrics === undefined && album_id === undefined && !hasFile) {
        return res.status(400).json({message: "Cần cung cấp ít nhất một thông tin để cập nhật (title, duration_seconds, audio_url, lyrics, album_id hoặc file audio)"});
    }

    if (title !== undefined) {
        if (typeof title !== "string" || !title.trim() || title.trim().length > 255) {
            return res.status(400).json({message: "Tiêu đề bài hát (title) không được để trống và tối đa 255 ký tự"});
        }
    }

    if (duration_seconds !== undefined && (isNaN(Number(duration_seconds)) || Number(duration_seconds) < 0)) {
        return res.status(400).json({message: "Thời lượng bài hát (duration_seconds) phải là số dương"});
    }

    if (album_id !== undefined && album_id !== null && (typeof album_id !== "string" || !validator.isUUID(album_id))) {
        return res.status(400).json({message: "album_id không đúng định dạng UUID"});
    }

    next();
};

export const addTrackArtist = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {artist_id, role} = req.body;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID bài hát không đúng định dạng UUID"});
    }

    if (!artist_id || typeof artist_id !== "string" || !validator.isUUID(artist_id)) {
        return res.status(400).json({message: "artist_id không đúng định dạng UUID"});
    }

    if (role !== undefined && !["primary", "featured"].includes(role)) {
        return res.status(400).json({message: "Vai trò nghệ sĩ (role) phải là 'primary' hoặc 'featured'"});
    }

    next();
};

export const removeTrackArtist = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id, artistId} = req.params;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID bài hát không đúng định dạng UUID"});
    }

    if (!artistId || typeof artistId !== "string" || !validator.isUUID(artistId)) {
        return res.status(400).json({message: "artistId không đúng định dạng UUID"});
    }

    next();
};

export const addTrackGenre = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {genre_id} = req.body;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID bài hát không đúng định dạng UUID"});
    }

    if (genre_id === undefined || isNaN(Number(genre_id)) || !Number.isInteger(Number(genre_id))) {
        return res.status(400).json({message: "genre_id không hợp lệ (phải là số nguyên)"});
    }

    next();
};

export const removeTrackGenre = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id, genreId} = req.params;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID bài hát không đúng định dạng UUID"});
    }

    if (!genreId || isNaN(Number(genreId)) || !Number.isInteger(Number(genreId))) {
        return res.status(400).json({message: "genreId không hợp lệ (phải là số nguyên)"});
    }

    next();
};
