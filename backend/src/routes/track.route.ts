import express from "express";
import {optionalAuth, requireAuth, requireTrackCreatorOrAdmin, requireTrackManagerOrAdmin} from "../middlewares/auth.middleware";
import {uploadSingle, uploadToCloudinary} from "../middlewares/upload.middleware";
import {limitTrackPlays} from "../middlewares/playback.middleware";
import {requireValidTrackReferences} from "../middlewares/track.middleware";
import * as validate from "../validators/track.validator";
import * as controller from "../controllers/track.controller";

const router = express.Router();

router.get("/", validate.getTracks, controller.getTracks);
router.get("/:id", validate.getTrackById, controller.getTrackById);
router.get("/:id/stream", validate.streamTrack, controller.streamTrack);

router.post(
    "/",
    requireAuth,
    uploadSingle("audio", "audio"),
    validate.createTrack,
    requireValidTrackReferences,
    requireTrackCreatorOrAdmin,
    uploadToCloudinary,
    controller.createTrack
);

router.patch(
    "/:id",
    requireAuth,
    validate.getTrackById,
    requireTrackManagerOrAdmin,
    uploadSingle("audio", "audio"),
    validate.updateTrack,
    requireValidTrackReferences,
    uploadToCloudinary,
    controller.updateTrack
);

router.delete("/:id", requireAuth, validate.getTrackById, requireTrackManagerOrAdmin, controller.deleteTrack);

router.post("/:id/play", optionalAuth, validate.getTrackById, limitTrackPlays, controller.recordPlay);

router.post("/:id/artists", requireAuth, validate.addTrackArtist, requireTrackManagerOrAdmin, controller.addTrackArtist);
router.delete("/:id/artists/:artistId", requireAuth, validate.removeTrackArtist, requireTrackManagerOrAdmin, controller.removeTrackArtist);

router.post("/:id/genres", requireAuth, validate.addTrackGenre, requireTrackManagerOrAdmin, controller.addTrackGenre);
router.delete("/:id/genres/:genreId", requireAuth, validate.removeTrackGenre, requireTrackManagerOrAdmin, controller.removeTrackGenre);

export default router;
