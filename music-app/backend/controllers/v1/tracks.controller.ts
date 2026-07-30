import {Request, Response} from "express";
import Track from "../../models/v1/tracks.model.js";

export const tracksPost = async (req: Request, res: Response) => {
    try {
        const trackData = {
            ...req.body,
            coverImageUrl: req.body.avatarUrl,
            duration: req.body.audioDuration,
            artist: (req as any).user?.userId
        };

        const track = new Track(trackData);
        await track.save();
        res.status(200).json({
            message: "Tạo bài hát thành công",
            data: track
        })
    } catch (err: any) {
        res.status(500).json({
            message: "Lỗi tạo bài hát",
            error: err.message
        })
    }
}