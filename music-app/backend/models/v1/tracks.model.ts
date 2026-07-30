import mongoose, {Schema} from "mongoose";
// @ts-ignore
import slug from 'mongoose-slug-updater';

mongoose.plugin(slug);

export interface ITrack {
    title: string;
    slug: string;
    description?: string;
    audioUrl: string;
    coverImageUrl?: string;
    lyricsUrl?: string;
    duration: number;
    genre: string;
    artist: string;
    playCount: number;
    likeCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const trackSchema = new Schema<ITrack>(
    {
        title: {type: String, required: true, trim: true},
        slug: {type: String, slug: "title", unique: true},
        description: {type: String, default: ""},
        audioUrl: {type: String, required: true},
        coverImageUrl: {type: String, default: ""},
        lyricsUrl: {type: String, default: ""},
        duration: {type: Number, required: true},
        genre: {type: String, required: true, lowercase: true, index: true},
        artist: {
            type: String,
            ref: "User",
            required: true,
            index: true,
        },
        playCount: {type: Number, default: 0},
        likeCount: {type: Number, default: 0},
    },
    {timestamps: true}
);

const Track = mongoose.model<ITrack>("Track", trackSchema);

export default Track;