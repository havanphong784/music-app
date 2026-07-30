import {NextFunction, Request, Response} from "express";
import {verifyAccessToken} from "../../utils/jwt.utils.js";

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({message: "Không tìm thấy Access Token"});
    }

    const token = authHeader.slice(7);
    const payload = verifyAccessToken(token);
    if (!payload) {
        return res.status(403).json({message: 'Access Token không hợp lệ hoặc đã hết hạn'});
    }

    (req as any).user = payload;

    next();
}
