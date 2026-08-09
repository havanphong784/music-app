import {NextFunction, Request, Response} from "express";
import validator from "validator";

export const getArtists = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {page, limit, verified} = req.query;

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

    if (verified !== undefined) {
        if (verified !== "true" && verified !== "false" && typeof verified !== "boolean") {
            return res.status(400).json({message: "Giá trị verified phải là 'true' hoặc 'false'"});
        }
    }

    next();
};

export const getArtistById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID nghệ sĩ không đúng định dạng UUID"});
    }
    next();
};

export const createArtist = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {name, bio, avatar_url, verified} = req.body;

    if (!name || typeof name !== "string" || !name.trim() || name.trim().length > 255) {
        return res.status(400).json({message: "Tên nghệ sĩ không được để trống và tối đa 255 ký tự"});
    }

    if (bio !== undefined && bio !== null && typeof bio !== "string") {
        return res.status(400).json({message: "Tiểu sử (bio) phải là chuỗi văn bản"});
    }

    if (avatar_url !== undefined && avatar_url !== null && avatar_url !== "") {
        if (typeof avatar_url !== "string" || !validator.isURL(avatar_url)) {
            return res.status(400).json({message: "Đường dẫn ảnh đại diện không hợp lệ"});
        }
    }

    if (verified !== undefined && typeof verified !== "boolean" && verified !== "true" && verified !== "false") {
        return res.status(400).json({message: "verified phải là boolean"});
    }

    next();
};

export const updateArtist = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {name, bio, avatar_url, verified} = req.body;
    const hasFile = !!req.file;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID nghệ sĩ không đúng định dạng UUID"});
    }

    if (name === undefined && bio === undefined && avatar_url === undefined && verified === undefined && !hasFile) {
        return res.status(400).json({message: "Cần cung cấp ít nhất một thông tin để cập nhật (name, bio, avatar_url, verified hoặc file ảnh)"});
    }

    if (name !== undefined) {
        if (typeof name !== "string" || !name.trim() || name.trim().length > 255) {
            return res.status(400).json({message: "Tên nghệ sĩ không được để trống và tối đa 255 ký tự"});
        }
    }

    if (bio !== undefined && bio !== null && typeof bio !== "string") {
        return res.status(400).json({message: "Tiểu sử (bio) phải là chuỗi văn bản"});
    }

    if (avatar_url !== undefined && avatar_url !== null && avatar_url !== "") {
        if (typeof avatar_url !== "string" || !validator.isURL(avatar_url)) {
            return res.status(400).json({message: "Đường dẫn ảnh đại diện không hợp lệ"});
        }
    }

    if (verified !== undefined && typeof verified !== "boolean" && verified !== "true" && verified !== "false") {
        return res.status(400).json({message: "verified phải là boolean"});
    }

    next();
};

export const addMember = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {user_id, role} = req.body;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID nghệ sĩ không đúng định dạng UUID"});
    }

    if (!user_id || typeof user_id !== "string" || !validator.isUUID(user_id)) {
        return res.status(400).json({message: "user_id không đúng định dạng UUID"});
    }

    if (role !== undefined && role !== "manager") {
        return res.status(400).json({message: "Vai trò (role) chỉ chấp nhận 'manager'"});
    }

    next();
};

export const removeMember = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id, userId} = req.params;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID nghệ sĩ không đúng định dạng UUID"});
    }

    if (!userId || typeof userId !== "string" || !validator.isUUID(userId)) {
        return res.status(400).json({message: "userId không đúng định dạng UUID"});
    }

    next();
};
