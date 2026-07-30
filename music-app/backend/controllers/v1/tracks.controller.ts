import {Request, Response} from "express";
import Track from "../../models/v1/tracks.model.js";

export const tracksPost = async (req: Request, res: Response) => {
    try {
        const {title, description, genre, audioUrl, avatarUrl, lyricsUrl, audioDuration} = req.body;
        const trackData = {
            title,
            description,
            genre,
            audioUrl,
            coverImageUrl: avatarUrl,
            lyricsUrl,
            duration: audioDuration,
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

export const getTrackId = async (req: Request, res: Response) => {
    try {
        const id = req.params.trackId;
        const track = await Track.findById(id);

        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            })
            return;
        }
        res.status(200).json({
            message: "Lấy thông tin bài hát thành công.",
            data: track
        })
    } catch (err) {
        res.status(400).json({
            message: "Id bài hát không hợp lệ"
        })
    }
}