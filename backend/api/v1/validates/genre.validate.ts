import {NextFunction, Request, Response} from "express";

export const getGenres = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
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

export const getGenreByIdOrSlug = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {idOrSlug} = req.params;
    if (!idOrSlug || typeof idOrSlug !== "string" || !idOrSlug.trim()) {
        return res.status(400).json({message: "idOrSlug không được để trống"});
    }
    next();
};

export const createGenre = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {name, slug} = req.body;

    if (!name || typeof name !== "string" || !name.trim() || name.trim().length > 50) {
        return res.status(400).json({message: "Tên thể loại (name) không được để trống và tối đa 50 ký tự"});
    }

    if (slug !== undefined && slug !== null && slug !== "") {
        if (typeof slug !== "string" || slug.length > 50) {
            return res.status(400).json({message: "Slug tối đa 50 ký tự"});
        }
    }

    next();
};

export const updateGenre = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {name, slug} = req.body;

    if (!id || isNaN(Number(id)) || !Number.isInteger(Number(id))) {
        return res.status(400).json({message: "ID thể loại không hợp lệ (phải là số nguyên)"});
    }

    if (name === undefined && slug === undefined) {
        return res.status(400).json({message: "Cần cung cấp ít nhất một thông tin để cập nhật (name hoặc slug)"});
    }

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim() || name.trim().length > 50) {
            return res.status(400).json({message: "Tên thể loại (name) không được để trống và tối đa 50 ký tự"});
        }
    }

    if (slug !== undefined && slug !== null && slug !== "") {
        if (typeof slug !== "string" || slug.length > 50) {
            return res.status(400).json({message: "Slug tối đa 50 ký tự"});
        }
    }

    next();
};

export const deleteGenre = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;

    if (!id || isNaN(Number(id)) || !Number.isInteger(Number(id))) {
        return res.status(400).json({message: "ID thể loại không hợp lệ (phải là số nguyên)"});
    }

    next();
};
