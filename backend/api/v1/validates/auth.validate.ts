import {NextFunction, Request, Response} from "express";
import validator from "validator";

interface RequestBody {
    email?: string,
    password?: string,
    userName?: string
}

export const register = async (req: Request<{}, {}, RequestBody>, res: Response, next: NextFunction): Promise<Response | void> => {
    const {email, password, userName} = req.body;
    if (!email || typeof email !== "string" || !email.trim() || email.trim() === "") {
        return res.status(400).json({message: "Email không được để trống"});
    }
    if (!validator.isEmail(email)) {
        return res.status(400).json({message: "Email không hợp lệ"});
    }
    if (!password || typeof password !== "string" || !password.trim() || password.trim() === "") {
        return res.status(400).json({message: "Mật khẩu không được để trống"});
    }
    if (!validator.isLength(password, {min: 6, max: 100})) {
        return res.status(400).json({message: "Mật khẩu phải từ 6 đến 100 ký tự"});
    }
    if (!userName || typeof userName !== "string" || !userName.trim() || userName.trim() === "" || userName.length > 20) {
        return res.status(400).json({message: "Tên người dùng không được để trống và phải dưới 20 ký tự"});
    }
    next();
}