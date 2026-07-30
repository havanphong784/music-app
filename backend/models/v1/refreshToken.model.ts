import mongoose from "mongoose";

export interface IRefreshToken {
    userId: string;
    token: string;
    expiresAt: Date;
}

const refreshTokenSchema = new mongoose.Schema<IRefreshToken>({
    userId: {type: String, ref: 'User', required: true},
    token: {type: String, required: true, unique: true},
    expiresAt: {type: Date, required: true}
}, {timestamps: true});

refreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

const RefreshToken = mongoose.model<IRefreshToken>('RefreshToken', refreshTokenSchema, "refreshTokens");

export default RefreshToken;