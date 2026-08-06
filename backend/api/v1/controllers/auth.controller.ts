import prisma from "../../../config/db";
import {Request, Response} from "express";
import bcrypt from "bcrypt"
import {generateAccessToken, generateRefreshToken} from "../utils/jwt";

export const register = async (req: Request, res: Response) => {
    try {
        const {email, password, userName} = req.body;
        const existEmail = await prisma.users.findUnique({where: {email: email}});
        if (existEmail) {
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
        const {password_hash: _passwordHash, ...safeUser} = user;
        res.status(201).json({message: "Đăng ký thành công", user: safeUser});
    } catch (error) {
        res.status(500).json({message: "Lỗi hệ thống"});
    }
}

export const login = async (req: Request, res: Response) => {
    try {
        const {email, password} = req.body;
        const user = await prisma.users.findUnique({
            where: {email: email}
        });
        if (!user) {
            return res.status(404).json({message: "Người dùng không tồn tại"});
        }
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({message: "Mật khẩu không đúng"});
        }

        const refreshToken = generateRefreshToken({
            userId: user.id,
            email: user.email,
            userName: user.display_name,
            role: user.role ? user.role : "user"
        });
        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
        });

        const accessToken = generateAccessToken({
            userId: user.id,
            email: user.email,
            userName: user.display_name,
            role: user.role ? user.role : "user"
        });

        const {password_hash: _passwordHash, ...safeUser} = user;
        res.status(200).json({message: "Đăng nhập thành công", user: safeUser, token: accessToken});
    } catch (error) {
        res.status(500).json({message: "Lỗi hệ thống"});
    }
}
