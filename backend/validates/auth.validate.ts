import {NextFunction, Request, Response} from "express";

export const register = (req: Request, res: Response, next: NextFunction) => {
    const {name, email, password} = req.body;
    if (
        typeof name !== "string" || !name.trim() ||
        typeof email !== "string" || !email.trim() ||
        typeof password !== "string"
    ) {
        return res.status(400).json({
            message: "Thiếu thông tin",
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
    const {email, password} = req.body;
    if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
        return res.status(400).json({
            message: "Thiếu email hoặc mật khẩu",
        })
    }
    req.body.email = email.trim().toLowerCase();
    next();
}
