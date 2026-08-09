import express from "express";
import {optionalAuth, requireAuth, requirePlaylistOwnerOrAdmin} from "../middlewares/auth.middleware";
import {uploadSingle, uploadToCloudinary} from "../middlewares/upload.middleware";
import * as validate from "../validators/playlist.validator";
import * as controller from "../controllers/playlist.controller";

const router = express.Router();

router.get("/", validate.getPlaylists, controller.getPublicPlaylists);
router.get("/:id", optionalAuth, validate.getPlaylistById, controller.getPlaylistById);

router.post(
    "/",
    requireAuth,
    uploadSingle("cover", "image"),
    validate.createPlaylist,
    uploadToCloudinary,
    controller.createPlaylist
);

router.patch(
    "/:id",
    requireAuth,
    validate.getPlaylistById,
    requirePlaylistOwnerOrAdmin,
    uploadSingle("cover", "image"),
    validate.updatePlaylist,
    uploadToCloudinary,
    controller.updatePlaylist
);

router.delete("/:id", requireAuth, validate.getPlaylistById, controller.deletePlaylist);

router.post("/:id/tracks", requireAuth, validate.addTrack, controller.addTrackToPlaylist);
router.put("/:id/tracks/reorder", requireAuth, validate.reorderTracks, controller.reorderPlaylistTracks);
router.delete("/:id/tracks/:trackId", requireAuth, validate.removeTrack, controller.removeTrackFromPlaylist);

export default router;
