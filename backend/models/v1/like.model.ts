import mongoose from "mongoose";

export interface ILike {
    userId: string,
    trackId: string,
}

const likeSchema = new mongoose.Schema<ILike>({
    userId: {
        type: String,
        ref: "User",
        required: true
    },
    trackId: {
        type: String,
        ref: "Track",
        required: true
    }
}, {timestamps: true});

likeSchema.index({userId: 1, trackId: 1}, {unique: true});

export const Like = mongoose.model<ILike>("Like", likeSchema, "likes");
