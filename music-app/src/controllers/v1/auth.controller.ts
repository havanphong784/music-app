import {Request, Response} from "express";
import User from "../../models/v1/user.model.js";
import bcrypt from 'bcrypt';

export const register = async (req: Request, res: Response): Promise<void> => {
    let {name, email, password} = req.body;

    const existingUser = await User.findOne({email: email});
    if (existingUser) {
        res.status(409).json({
            message: "User đã tồn tại.",
        });
        return;
    }

    password = await bcrypt.hash(password, 12);
    const user = new User({name: name, email: email, password: password});
    await user.save();
    res.status(200).json({
        message: "Tạo tài khoản thành công.",
    });
}