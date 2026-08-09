import {NextFunction, Response} from "express";
import {AuthenticatedRequest} from "./auth.middleware";

const WINDOW_MS = 30_000;
const recentPlays = new Map<string, number>();

export const limitTrackPlays = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const listener = req.user?.userId || req.ip || "unknown";
    const key = `${listener}:${req.params.id}`;
    const now = Date.now();
    const lastPlay = recentPlays.get(key);

    if (lastPlay && now - lastPlay < WINDOW_MS) {
        return res.status(429).json({
            message: "Lượt phát đã được ghi nhận gần đây, vui lòng thử lại sau"
        });
    }

    recentPlays.set(key, now);

    // Keep the in-memory limiter bounded without requiring another service.
    if (recentPlays.size > 10_000) {
        for (const [entryKey, timestamp] of recentPlays) {
            if (now - timestamp >= WINDOW_MS) recentPlays.delete(entryKey);
        }
    }

    next();
};
