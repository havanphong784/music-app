import {NextFunction, Request, Response} from "express";
import validator from "validator";

export const getAlbums = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {page, limit, sort} = req.query;

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

    if (sort !== undefined) {
        const allowedSorts = ["newest", "oldest", "title_asc", "title_desc"];
        if (typeof sort !== "string" || !allowedSorts.includes(sort)) {
            return res.status(400).json({message: "Tham số sort không hợp lệ (hợp lệ: 'newest', 'oldest', 'title_asc', 'title_desc')"});
        }
    }

    next();
};

export const getAlbumById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID album không đúng định dạng UUID"});
    }
    next();
};

export const createAlbum = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {title, release_date, cover_url, artist_id} = req.body;

    if (!title || typeof title !== "string" || !title.trim() || title.trim().length > 255) {
        return res.status(400).json({message: "Tiêu đề album (title) không được để trống và tối đa 255 ký tự"});
    }

    if (release_date !== undefined && release_date !== null && release_date !== "") {
        if (typeof release_date !== "string" || !validator.isDate(release_date, {format: "YYYY-MM-DD", strictMode: true})) {
            return res.status(400).json({message: "Ngày phát hành (release_date) phải có định dạng YYYY-MM-DD"});
        }
    }

    if (artist_id !== undefined && artist_id !== null && (typeof artist_id !== "string" || !validator.isUUID(artist_id))) {
        return res.status(400).json({message: "artist_id không đúng định dạng UUID"});
    }

    if (cover_url !== undefined && cover_url !== null && cover_url !== "") {
        if (typeof cover_url !== "string" || !validator.isURL(cover_url)) {
            return res.status(400).json({message: "Đường dẫn ảnh bìa (cover_url) không hợp lệ"});
        }
    }

    next();
};

export const updateAlbum = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {title, release_date, cover_url, artist_id} = req.body;
    const hasFile = !!req.file;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID album không đúng định dạng UUID"});
    }

    if (title === undefined && release_date === undefined && cover_url === undefined && artist_id === undefined && !hasFile) {
        return res.status(400).json({message: "Cần cung cấp ít nhất một thông tin để cập nhật"});
    }

    if (title !== undefined) {
        if (typeof title !== "string" || !title.trim() || title.trim().length > 255) {
            return res.status(400).json({message: "Tiêu đề album (title) không được để trống và tối đa 255 ký tự"});
        }
    }

    if (release_date !== undefined && release_date !== null && release_date !== "") {
        if (typeof release_date !== "string" || !validator.isDate(release_date, {format: "YYYY-MM-DD", strictMode: true})) {
            return res.status(400).json({message: "Ngày phát hành (release_date) phải có định dạng YYYY-MM-DD"});
        }
    }

    if (artist_id !== undefined && artist_id !== null && (typeof artist_id !== "string" || !validator.isUUID(artist_id))) {
        return res.status(400).json({message: "artist_id không đúng định dạng UUID"});
    }

    if (cover_url !== undefined && cover_url !== null && cover_url !== "") {
        if (typeof cover_url !== "string" || !validator.isURL(cover_url)) {
            return res.status(400).json({message: "Đường dẫn ảnh bìa (cover_url) không hợp lệ"});
        }
    }

    next();
};
