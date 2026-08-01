import {CookieOptions, Request, Response} from "express";
import User from "../../models/v1/user.model.js";
import bcrypt from 'bcrypt';
import {generateAcceptToken, generateRefreshToken, verifyRefreshToken} from "../../utils/jwt.utils.js";
import RefreshToken from "../../models/v1/refreshToken.model.js";

const refreshCookieOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.COOKIE_SAME_SITE === "none" ? "none" : "lax",
    path: "/api/v1/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000
};

const clearRefreshCookie = (res: Response) => {
    const {maxAge: _maxAge, ...clearOptions} = refreshCookieOptions;
    res.clearCookie("refreshToken", clearOptions);
};

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
    const user = await User.findOne({email: email, deleted: false}).select("+password");
    if (!user) {
        res.status(401).json({
            message: "Email hoặc mật khẩu không đúng"
        })
        return;
    }

    const passwordMatched = await bcrypt.compare(password, user.password);
    if (!passwordMatched) {
        res.status(401).json({
            message: "Email hoặc mật khẩu không đúng"
        })
        return;
    }

    const userInfo = {userId: user.id, email: email, role: user.role};

    const refreshToken = generateRefreshToken(userInfo);
    await RefreshToken.create({
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    const accessToken = generateAcceptToken(userInfo);

    res.cookie("refreshToken", refreshToken, refreshCookieOptions);

    res.status(200).json({
        message: "Đăng nhập thành công.",
        accessToken,
        user: userInfo
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
        clearRefreshCookie(res);
        res.status(403).json({message: 'Refresh Token đã hết hạn'});
        return;
    }

    if (storedToken.userId !== payload.userId) {
        await RefreshToken.deleteOne({_id: storedToken._id});
        clearRefreshCookie(res);
        res.status(403).json({message: "Refresh Token không hợp lệ"});
        return;
    }

    const currentUser = await User.findOne({_id: payload.userId, deleted: false});
    if (!currentUser) {
        await RefreshToken.deleteOne({_id: storedToken._id});
        clearRefreshCookie(res);
        res.status(403).json({message: "Tài khoản không còn hoạt động"});
        return;
    }

    const user = {
        userId: currentUser.id,
        email: currentUser.email,
        role: currentUser.role
    };

    const nextRefreshToken = generateRefreshToken(user);
    const rotationResult = await RefreshToken.updateOne({
        _id: storedToken._id,
        token: refreshToken
    }, {
        $set: {
            token: nextRefreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });
    if (rotationResult.modifiedCount !== 1) {
        res.status(403).json({message: "Refresh Token đã được sử dụng"});
        return;
    }
    res.cookie("refreshToken", nextRefreshToken, refreshCookieOptions);

    const accessToken = generateAcceptToken(user);
    res.status(200).json({
        message: 'Refresh Token',
        accessToken,
        user
    });
}

export const logout = async (req: Request, res: Response): Promise<void> => {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
        await RefreshToken.deleteOne({token: refreshToken});
    }

    clearRefreshCookie(res);

    res.status(200).json({message: "Đăng xuất thành công."});
}
