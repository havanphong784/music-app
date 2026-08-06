import {NextFunction, Request, Response} from "express";
import Track, {ITrack} from "../../models/v1/tracks.model.js";
import Comment from "../../models/v1/comment.model.js";
import cloudinaryConfig from "../../config/cloudinary.config.js";
import {Like} from "../../models/v1/like.model.js";
import mongoose from "mongoose";

const TRACK_PUBLIC_FIELDS = [
    "title",
    "slug",
    "description",
    "coverImageUrl",
    "lyricsUrl",
    "duration",
    "genre",
    "artist",
    "playCount",
    "likeCount",
    "createdAt",
    "updatedAt"
].join(" ");

const TRACK_SORT_FIELDS = new Set(["createdAt", "playCount", "likeCount", "title"]);
const USER_PUBLIC_FIELDS = "name avatar createdAt";

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parsePagination = (page: unknown, limit: unknown) => {
    const parsedPage = typeof page === "string" ? Number(page) : Number.NaN;
    const parsedLimit = typeof limit === "string" ? Number(limit) : Number.NaN;

    return {
        page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
        limit: Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20
    };
};

const serializeComment = (comment: Record<string, any>) => ({
    _id: comment._id,
    trackId: comment.trackId,
    content: comment.content,
    parentId: comment.parentId ?? null,
    author: comment.userId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt
});

const cleanupTrackAssets = async (track: ITrack) => {
    const tasks: Promise<unknown>[] = [];

    if (track.audioPublicId) {
        tasks.push(cloudinaryConfig.uploader.destroy(track.audioPublicId, {
            resource_type: "video",
            type: "authenticated",
            invalidate: true
        }));
    }
    if (track.coverImagePublicId) {
        tasks.push(cloudinaryConfig.uploader.destroy(track.coverImagePublicId, {
            resource_type: "image",
            invalidate: true
        }));
    }
    if (track.lyricsPublicId) {
        tasks.push(cloudinaryConfig.uploader.destroy(track.lyricsPublicId, {
            resource_type: "raw",
            invalidate: true
        }));
    }

    const results = await Promise.allSettled(tasks);
    results
        .filter(result => result.status === "rejected")
        .forEach(result => console.error("Cloudinary cleanup failed:", result.reason));
};

export const tracksGet = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {sortKey, sortValue, keyword, genre, page, limit} = req.query;

        const find: Record<string, any> = {};

        if (keyword && typeof keyword === "string" && keyword.trim() !== "") {
            find.title = new RegExp(escapeRegExp(keyword.trim()), "i");
        }

        if (genre && typeof genre === "string" && genre.trim() !== "") {
            find.genre = genre.trim().toLowerCase();
        }

        const sort: Record<string, 1 | -1> = {};
        if (typeof sortKey === "string" && TRACK_SORT_FIELDS.has(sortKey)) {
            const isAsc = sortValue === "asc" || sortValue === "1";
            sort[sortKey] = isAsc ? 1 : -1;
        } else {
            sort.createdAt = -1;
        }

        const {page: pageNum, limit: limitNum} = parsePagination(page, limit);
        const skip = (pageNum - 1) * limitNum;

        const totalCount = await Track.countDocuments(find);
        const totalPages = Math.ceil(totalCount / limitNum);

        const tracks = await Track.find(find)
            .select(TRACK_PUBLIC_FIELDS)
            .populate("artist", USER_PUBLIC_FIELDS)
            .sort(sort)
            .skip(skip)
            .limit(limitNum);

        res.status(200).json({
            message: "Lấy danh sách bài hát thành công.",
            data: tracks,
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalCount,
                totalPages
            }
        });
    } catch (error) {
        next(error);
    }
};

export const tracksPost = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {
            title,
            description,
            genre,
            audioUrl,
            audioPublicId,
            avatarUrl,
            avatarPublicId,
            lyricsUrl,
            lyricsPublicId,
            audioDuration
        } = req.body ?? {};
        const trackData = {
            title,
            description,
            genre,
            audioUrl,
            audioPublicId,
            coverImageUrl: avatarUrl,
            coverImagePublicId: avatarPublicId,
            lyricsUrl,
            lyricsPublicId,
            duration: audioDuration,
            artist: (req as any).user?.userId
        };

        const track = new Track(trackData);
        await track.save();
        const publicTrack = await Track.findById(track._id)
            .select(TRACK_PUBLIC_FIELDS)
            .populate("artist", USER_PUBLIC_FIELDS);

        res.status(201).json({
            message: "Tạo bài hát thành công",
            data: publicTrack
        })
    } catch (error) {
        next(error);
    }
}

export const getTrackId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = String(req.params.trackId);
        const track = await Track.findById(id)
            .select(TRACK_PUBLIC_FIELDS)
            .populate("artist", USER_PUBLIC_FIELDS);

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
    } catch (error) {
        next(error);
    }
}

export const patchTrackId = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = String(req.params.trackId);
        const track = await Track.findById(id);

        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        const currentUserId = (req as any).user?.userId;
        if (track.artist.toString() !== currentUserId) {
            res.status(403).json({
                message: "Không có quyền chỉnh sửa bài hát này."
            });
            return;
        }

        const {
            title,
            description,
            genre,
            audioUrl,
            audioPublicId,
            avatarUrl,
            avatarPublicId,
            lyricsUrl,
            lyricsPublicId,
            audioDuration
        } = req.body ?? {};
        const updateData: Partial<ITrack> = {};

        if (title !== undefined) updateData.title = title.trim();
        if (description !== undefined) updateData.description = description;
        if (genre !== undefined) updateData.genre = genre.trim().toLowerCase();
        if (audioUrl !== undefined) updateData.audioUrl = audioUrl;
        if (audioPublicId !== undefined) updateData.audioPublicId = audioPublicId;
        if (avatarUrl !== undefined) updateData.coverImageUrl = avatarUrl;
        if (avatarPublicId !== undefined) updateData.coverImagePublicId = avatarPublicId;
        if (lyricsUrl !== undefined) updateData.lyricsUrl = lyricsUrl;
        if (lyricsPublicId !== undefined) updateData.lyricsPublicId = lyricsPublicId;
        if (audioDuration !== undefined) updateData.duration = audioDuration;

        await Track.updateOne({_id: id}, updateData);

        res.status(200).json({
            message: "Cập nhật bài hát thành công."
        });
    } catch (error) {
        next(error);
    }
};

export const deleteTrack = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = String(req.params.trackId);
        const track = await Track.findById(id);
        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        const currentUserId = (req as any).user?.userId;
        if (track.artist.toString() !== currentUserId) {
            res.status(403).json({
                message: "Không có quyền xóa bài hát này."
            });
            return;
        }

        await Promise.all([
            Track.deleteOne({_id: id}),
            Like.deleteMany({trackId: id}),
            Comment.deleteMany({trackId: id})
        ]);
        await cleanupTrackAssets(track);
        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};

export const getTrackStream = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = String(req.params.trackId);
        const track = await Track.findById(id);
        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        if (!track.audioPublicId) {
            res.status(400).json({
                message: "Bài hát chưa có ID âm thanh trên cloud (audioPublicId)."
            });
            return;
        }

        const expiresAt = Math.floor(Date.now() / 1000) + 60 * 5; // 5 phút
        const streamUrl = cloudinaryConfig.utils.private_download_url(track.audioPublicId, '', {
            resource_type: 'video',
            type: 'authenticated',
            expires_at: expiresAt
        });

        res.status(200).json({
            message: "Lấy stream track thành công.",
            streamUrl,
            expiresAt
        });
    } catch (error) {
        next(error);
    }
};

export const postTrackPlay = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const trackId = String(req.params.trackId);
        const track = await Track.findByIdAndUpdate(trackId, {$inc: {playCount: 1}}, {
            returnDocument: "after",
            runValidators: true
        }).select("_id playCount");
        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }
        res.status(200).json({
            message: "Ghi nhận lượt nghe thành công.",
            data: {
                trackId: track._id,
                playCount: track.playCount
            }
        });
    } catch (error) {
        next(error);
    }
};

export const postTrackComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const {content, parentId} = req.body ?? {};
        if (typeof content !== "string" || content.trim() === "" || content.trim().length > 1000) {
            res.status(400).json({
                message: "Bình luận phải có từ 1 đến 1000 ký tự."
            });
            return;
        }
        const id = String(req.params.trackId);
        const track = await Track.findById(id);
        if (!track) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        const userId = (req as any).user?.userId;
        if (!userId) {
            res.status(401).json({
                message: "Bạn chưa đăng nhập."
            });
            return;
        }

        const comment = new Comment({
            userId: userId,
            parentId: parentId,
            trackId: id,
            content: content.trim()
        });

        await comment.save();
        const populatedComment = await Comment.findById(comment._id)
            .populate("userId", USER_PUBLIC_FIELDS)
            .lean();

        res.status(201).json({
            message: "Gửi bình luận thành công.",
            data: populatedComment ? serializeComment(populatedComment) : null
        });
    } catch (error) {
        next(error);
    }
};

export const getTrackComment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const trackId = String(req.params.trackId);
        const {page, limit, parentId} = req.query;
        const {page: pageNum, limit: limitNum} = parsePagination(page, limit);
        const find: Record<string, unknown> = {trackId};

        if (!mongoose.isValidObjectId(trackId)) {
            res.status(400).json({message: "Id bài hát không hợp lệ."});
            return;
        }

        if (typeof parentId === "string" && parentId.trim()) {
            if (!mongoose.isValidObjectId(parentId.trim())) {
                res.status(400).json({message: "Id bình luận cha không hợp lệ."});
                return;
            }
            find.parentId = parentId.trim();
        }

        const [totalCount, comments] = await Promise.all([
            Comment.countDocuments(find),
            Comment.find(find)
                .populate("userId", USER_PUBLIC_FIELDS)
                .sort({createdAt: -1})
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum)
                .lean()
        ]);

        res.status(200).json({
            message: "Lấy danh sách bình luận thành công.",
            data: comments.map(comment => serializeComment(comment)),
            pagination: {
                currentPage: pageNum,
                limit: limitNum,
                totalCount,
                totalPages: Math.ceil(totalCount / limitNum)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const postTrackLike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const trackId = String(req.params.trackId);
        const userId = req.user.userId;

        const trackExists = await Track.exists({_id: trackId});
        if (!trackExists) {
            res.status(404).json({message: "Bài hát không tồn tại."});
            return;
        }

        const newLike = await Like.create({userId, trackId});
        try {
            const track = await Track.findByIdAndUpdate(trackId, {$inc: {likeCount: 1}});
            if (!track) {
                await Like.deleteOne({_id: newLike._id});
                res.status(404).json({message: "Bài hát không tồn tại."});
                return;
            }
        } catch (error) {
            await Like.deleteOne({_id: newLike._id});
            throw error;
        }

        res.status(201).json({
            message: "Like bài hát thành công.",
            data: newLike,
        });
    } catch (error) {
        next(error);
    }
};


export const deleteTrackLike = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const trackId = String(req.params.trackId);
        const userId = req.user.userId;

        if (!userId) {
            res.status(401).json({
                message: "Bạn chưa đăng nhập."
            });
            return;
        }

        const trackExists = await Track.exists({_id: trackId});
        if (!trackExists) {
            res.status(404).json({
                message: "Bài hát không tồn tại."
            });
            return;
        }

        const like = await Like.findOneAndDelete({trackId, userId});
        if (!like) {
            res.status(404).json({
                message: "Bạn chưa like bài hát này."
            });
            return;
        }

        await Track.updateOne(
            {_id: trackId},
            [{$set: {likeCount: {$max: [{$subtract: ["$likeCount", 1]}, 0]}}}]
        );

        res.sendStatus(204);
    } catch (error) {
        next(error);
    }
};
