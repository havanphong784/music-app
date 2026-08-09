import {NextFunction, Response} from "express";
import {AuthenticatedRequest} from "./auth.middleware";
import redis from "../config/redis";

const WINDOW_SECONDS = 30;

export const limitTrackPlays = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listener = req.user?.userId || req.ip || "unknown";
    const key = `play-rate:${listener}:${req.params.id}`;

    try {
        const stored = await redis.set(key, "1", {NX: true, EX: WINDOW_SECONDS});
        if (stored === null) {
            return res.status(429).json({
                message: "Lượt phát đã được ghi nhận gần đây, vui lòng thử lại sau"
            });
        }
        res.once("finish", () => {
            if (res.statusCode >= 400) void redis.del(key);
        });
        next();
    } catch (error) {
        next(error);
    }
};
