import {NextFunction, Request, Response} from "express";

export const register = (req: Request, res: Response, next: NextFunction) => {
    const {name, email, password} = req.body;
    if (!name || !email || !password || !name.length) {
        return res.status(400).json({
            message: "Thiếu thông tin",
        })
    }
    if (password.length < 8) {
        return res.status(400).json({
            message: "Mật khẩu tối thiểu 8 kí tự",
        })
    }
    next();
}

export const login = (req: Request, res: Response, next: NextFunction) => {
    const {email, password} = req.body;
    if (!email || !password) {
        return res.status(400).json({
            message: "Thiếu thông tin",
        })
    }
    if (password.length < 8) {
        return res.status(400).json({
            message: "Mật khẩu tối thiểu 8 kí tự",
        })
    }
    next();
}