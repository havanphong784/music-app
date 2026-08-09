import {NextFunction, Request, Response} from "express";
import validator from "validator";

export const updateMe = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {display_name, avatar_url} = req.body;
    const hasFile = !!req.file;

    if (display_name === undefined && avatar_url === undefined && !hasFile) {
        return res.status(400).json({message: "Cần cung cấp ít nhất một thông tin để cập nhật (display_name, avatar_url hoặc file ảnh)"});
    }

    if (display_name !== undefined) {
        if (typeof display_name !== "string" || !display_name.trim() || display_name.trim().length > 100) {
            return res.status(400).json({message: "Tên hiển thị không được để trống và không quá 100 ký tự"});
        }
    }

    if (avatar_url !== undefined && avatar_url !== null && avatar_url !== "") {
        if (typeof avatar_url !== "string" || !validator.isURL(avatar_url)) {
            return res.status(400).json({message: "Đường dẫn ảnh đại diện không hợp lệ"});
        }
    }

    next();
};

export const getUserById = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID người dùng không đúng định dạng UUID"});
    }
    next();
};

import {validatePagination as getUsers} from "./common.validate";
export {getUsers};

export const updateUserRole = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {id} = req.params;
    const {role} = req.body;

    if (!id || typeof id !== "string" || !validator.isUUID(id)) {
        return res.status(400).json({message: "ID người dùng không đúng định dạng UUID"});
    }

    if (!role || typeof role !== "string" || !["user", "admin"].includes(role)) {
        return res.status(400).json({message: "Vai trò (role) không hợp lệ. Phải là 'user' hoặc 'admin'"});
    }

    next();
};
