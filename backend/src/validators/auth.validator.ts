import {NextFunction, Request, Response} from "express";
import validator from "validator";

export interface RequestBody {
    email?: string;
    password?: string;
    display_name?: string;
    userName?: string;
}

export const register = async (req: Request<{}, {}, RequestBody>, res: Response, next: NextFunction): Promise<Response | void> => {
    const {email, password, display_name, userName} = req.body;
    const name = display_name || userName;

    if (!email || typeof email !== "string" || !email.trim()) {
        return res.status(400).json({message: "Email không được để trống"});
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({message: "Email không hợp lệ"});
    }
    if (!password || typeof password !== "string" || !password.trim()) {
        return res.status(400).json({message: "Mật khẩu không được để trống"});
    }
    if (!validator.isLength(password, {min: 6, max: 100})) {
        return res.status(400).json({message: "Mật khẩu phải từ 6 đến 100 ký tự"});
    }
    if (!name || typeof name !== "string" || !name.trim() || name.trim().length > 100) {
        return res.status(400).json({message: "Tên hiển thị không được để trống và tối đa 100 ký tự"});
    }
    next();
}

export const login = async (req: Request<{}, {}, RequestBody>, res: Response, next: NextFunction): Promise<Response | void> => {
    const {email, password} = req.body;
    if (!email || typeof email !== "string" || email.trim() === "" || !validator.isEmail(email)) {
        return res.status(400).json({message: "Email không hợp lệ"});
    }
    if (!password || typeof password !== "string" || password.trim() === "") {
        return res.status(400).json({message: "Mật khẩu không được để trống"});
    }
    if (!validator.isLength(password, {min: 6, max: 100})) {
        return res.status(400).json({message: "Mật khẩu phải từ 6 đến 100 ký tự"});
    }
    next();
}