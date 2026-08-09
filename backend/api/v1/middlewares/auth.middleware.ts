import {NextFunction, Request, Response} from "express";
import {IPayload, verifyAccessToken} from "../utils/jwt.utils";

export interface AuthenticatedRequest extends Request {
    user?: IPayload;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({message: "Chưa có token xác thực"});
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({message: "Token xác thực không hợp lệ"});
    }

    const user = verifyAccessToken(token);
    if (!user) {
        return res.status(401).json({message: "Token xác thực không hợp lệ"});
    }
    req.user = user;
    next();
}