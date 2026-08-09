import {NextFunction, Response} from "express";
import prisma from "../../../config/db";
import {AuthenticatedRequest} from "./auth.middleware";

export const requireValidTrackReferences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const artistId = req.body.artist_id as string | undefined;
    const albumId = req.body.album_id as string | null | undefined;

    try {
        const [artist, album] = await Promise.all([
            artistId ? prisma.artists.findUnique({where: {id: artistId}, select: {id: true}}) : null,
            albumId ? prisma.albums.findUnique({where: {id: albumId}, select: {id: true}}) : null
        ]);

        if (artistId && !artist) {
            return res.status(404).json({message: "Nghệ sĩ không tồn tại"});
        }
        if (albumId && !album) {
            return res.status(404).json({message: "Album không tồn tại"});
        }
        next();
    } catch (error) {
        next(error);
    }
};
