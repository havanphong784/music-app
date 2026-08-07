import prisma from "../../../config/db";
import {Request, Response} from "express";
import bcrypt from "bcrypt"
import {generateAccessToken, generateRefreshToken, verifyRefreshToken} from "../utils/jwt.utils";
import {consumeRefreshToken, revokeRefreshToken, saveRefreshToken} from "../services/refreshToken.services";

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

        const {token: refreshToken, jti} = generateRefreshToken({
            userId: user.id,
            email: user.email,
            userName: user.display_name,
            role: user.role ? user.role : "user"
        });

        await saveRefreshToken(jti, refreshToken);

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            path: "/api/v1/auth",
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

export const refresh = async (req: Request, res: Response) => {
    const oldToken = req.cookies.refreshToken;
    if (!oldToken) {
        return res.status(401).json({message: "Thiếu refresh token"});
    }

    const payload = verifyRefreshToken(oldToken);
    if (!payload || typeof payload.jti !== "string") {
        return res.status(401).json({message: "Refresh token không hợp lệ"});
    }

    const valid = await consumeRefreshToken(payload.jti, oldToken);
    if (!valid) {
        res.clearCookie("refreshToken", {
            path: "/api/v1/auth"
        });

        return res.status(401).json({
            message: "Refresh token đã hết hạn hoặc đã được sử dụng"
        });
    }

    const tokenPayload = {
        userId: payload.userId,
        email: payload.email,
        userName: payload.userName,
        role: payload.role
    };

    const accessToken = generateAccessToken(tokenPayload);
    const nextRefresh = generateRefreshToken(tokenPayload);

    await saveRefreshToken(nextRefresh.jti, nextRefresh.token);

    res.cookie("refreshToken", nextRefresh.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/auth",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({token: accessToken});
};

export const logout = async (req: Request, res: Response) => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        const payload = verifyRefreshToken(refreshToken);
        if (payload && typeof payload.jti === "string") {
            await revokeRefreshToken(
                payload.jti
            );
        }
    }

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/v1/auth"
    });

    return res.status(200).json({
        message: "Đăng xuất thành công"
    });
};
