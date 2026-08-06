import prisma from "../../../config/db";
import {Request, Response} from "express";
import bcrypt from "bcrypt"

export const register = async (req: Request, res: Response) => {
    try {
        const {email, password, userName} = req.body;
        const existEmail = await prisma.users.findUnique({where: {email: email}});
        if (!existEmail) {
            return res.status(400).json({message: "Email đã tồn tại"});
        }

        const passHash = await bcrypt.hash(password, 10);
        const user = await prisma.users.create({
            data: {
                email: email,
                password_hash: passHash,
                display_name: userName
            }
        });
        res.status(201).json({message: "Đăng ký thành công", user});
    } catch (error) {
        res.status(500).json({message: "Lỗi hệ thống"});
    }
}