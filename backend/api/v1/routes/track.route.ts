import express from "express";
import {optionalAuth, requireAuth} from "../middlewares/auth.middleware";
import {uploadSingle, uploadToCloudinary} from "../middlewares/uploadCloud.middleware";
import * as validate from "../validates/track.validate";
import * as controller from "../controllers/track.controller";

const router = express.Router();

router.get("/", validate.getTracks, controller.getTracks);
router.get("/:id", validate.getTrackById, controller.getTrackById);
router.get("/:id/stream", validate.streamTrack, controller.streamTrack);

router.post(
    "/",
    requireAuth,
    uploadSingle("audio"),
    validate.createTrack,
    uploadToCloudinary,
    controller.createTrack
);

router.patch(
    "/:id",
    requireAuth,
    uploadSingle("audio"),
    validate.updateTrack,
    uploadToCloudinary,
    controller.updateTrack
);

router.delete("/:id", requireAuth, validate.getTrackById, controller.deleteTrack);

router.post("/:id/play", optionalAuth, validate.getTrackById, controller.recordPlay);

router.post("/:id/artists", requireAuth, validate.addTrackArtist, controller.addTrackArtist);
router.delete("/:id/artists/:artistId", requireAuth, validate.removeTrackArtist, controller.removeTrackArtist);

router.post("/:id/genres", requireAuth, validate.addTrackGenre, controller.addTrackGenre);
router.delete("/:id/genres/:genreId", requireAuth, validate.removeTrackGenre, controller.removeTrackGenre);

export default router;
