import {Request, Response} from "express";
import User from "../../models/v1/user.model.js";
import bcrypt from 'bcrypt';
import {generateAcceptToken, generateRefreshToken, verifyRefreshToken} from "../../utils/jwt.utils.js";
import RefreshToken from "../../models/v1/refreshToken.model.js";

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

export const login = async (req: Request, res: Response): Promise<void> => {
    const {email, password} = req.body;
    const user = await User.findOne({email: email, deleted: false});
    if (!user) {
        res.status(401).json({
            message: "Email không tồn tại"
        })
        return;
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
        res.status(401).json({
            message: "Sai mật khẩu."
        })
        return;
    }

    const refreshToken = generateRefreshToken({userId: user.id, email: email, role: user.role});
    await RefreshToken.create({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const accessToken = generateAcceptToken({userId: user.id, email: email, role: user.role});

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
        message: "Đăng nhập thành công.",
        accessToken,
    })

}

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        res.status(401).json({message: 'Không tìm thấy Refresh Token'});
        return;
    }

    const storedToken = await RefreshToken.findOne({
        token: refreshToken,
        expiresAt: {$gt: new Date()}
    });
    if (!storedToken) {
        res.status(403).json({message: 'Refresh Token đã bị hủy hoặc không hợp lệ'});
        return;
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
        await RefreshToken.deleteOne({token: refreshToken});
        res.status(403).json({message: 'Refresh Token đã hết hạn'});
        return;
    }

    const accessToken = generateAcceptToken({
        userId: payload.userId,
        email: payload.email,
        role: payload.role
    });
    res.status(200).json({accessToken});
}

export const logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        await RefreshToken.deleteOne({token: refreshToken});
    }

    res.clearCookie("refreshToken");

    res.status(200).json({message: "Đăng xuất thành công."});
}
