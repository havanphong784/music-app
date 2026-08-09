import {NextFunction, Request, Response} from "express";
import validator from "validator";

export const getPagination = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {page, limit} = req.query;

    if (page !== undefined) {
        const pageNum = Number(page);
        if (isNaN(pageNum) || !Number.isInteger(pageNum) || pageNum < 1) {
            return res.status(400).json({message: "Trang (page) phải là số nguyên dương"});
        }
    }

    if (limit !== undefined) {
        const limitNum = Number(limit);
        if (isNaN(limitNum) || !Number.isInteger(limitNum) || limitNum < 1 || limitNum > 100) {
            return res.status(400).json({message: "Giới hạn (limit) phải là số nguyên dương từ 1 đến 100"});
        }
    }

    next();
};

export const trackIdParam = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {trackId} = req.params;
    if (!trackId || typeof trackId !== "string" || !validator.isUUID(trackId)) {
        return res.status(400).json({message: "trackId không đúng định dạng UUID"});
    }
    next();
};

export const artistIdParam = async (req: Request, res: Response, next: NextFunction): Promise<Response | void> => {
    const {artistId} = req.params;
    if (!artistId || typeof artistId !== "string" || !validator.isUUID(artistId)) {
        return res.status(400).json({message: "artistId không đúng định dạng UUID"});
    }
    next();
};
