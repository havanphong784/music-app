import {NextFunction, Request, Response} from "express";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = (req: Request, res: Response, next: NextFunction) => {
    const {name, email, password} = req.body ?? {};
    if (
        typeof name !== "string" || !name.trim() ||
        typeof email !== "string" || !email.trim() ||
        typeof password !== "string"
    ) {
        return res.status(400).json({
            message: "Thiếu thông tin",
        })
    }
    if (name.trim().length > 100) {
        return res.status(400).json({
            message: "Tên không được vượt quá 100 kí tự",
        })
    }
    if (!emailPattern.test(email.trim())) {
        return res.status(400).json({
            message: "Email không hợp lệ",
        })
    }
    if (password.length < 8 || password.length > 128) {
        return res.status(400).json({
            message: "Mật khẩu phải từ 8 đến 128 kí tự",
        })
    }
    req.body.name = name.trim();
    req.body.email = email.trim().toLowerCase();
    next();
}

export const login = (req: Request, res: Response, next: NextFunction) => {
    const {email, password} = req.body ?? {};
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
        return res.status(400).json({
            message: "Thiếu email hoặc mật khẩu",
        })
    }
    if (!emailPattern.test(email.trim())) {
        return res.status(400).json({
            message: "Email không hợp lệ",
        })
    }
    req.body.email = email.trim().toLowerCase();
    next();
}

export const forgotPassword = (req: Request, res: Response, next: NextFunction) => {
    const {email} = req.body ?? {};
    if (typeof email !== "string" || !emailPattern.test(email.trim())) {
        return res.status(400).json({message: "Email không hợp lệ"});
    }

    req.body.email = email.trim().toLowerCase();
    next();
}

export const resetPassword = (req: Request, res: Response, next: NextFunction) => {
    const {token, password} = req.body ?? {};
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
        return res.status(400).json({message: "Token đặt lại mật khẩu không hợp lệ"});
    }
    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
        return res.status(400).json({message: "Mật khẩu phải từ 8 đến 128 kí tự"});
    }

    req.body.token = token.toLowerCase();
    next();
}
