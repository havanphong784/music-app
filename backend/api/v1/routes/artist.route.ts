import express from "express";
import {requireAdmin, requireArtistManagerOrAdmin, requireAuth} from "../middlewares/auth.middleware";
import {uploadSingle, uploadToCloudinary} from "../middlewares/uploadCloud.middleware";
import * as validate from "../validates/artist.validate";
import * as controller from "../controllers/artist.controller";

const router = express.Router();

router.get("/", validate.getArtists, controller.getArtists);
router.post(
    "/",
    requireAuth,
    requireAdmin,
    uploadSingle("avatar"),
    validate.createArtist,
    uploadToCloudinary,
    controller.createArtist
);

router.get("/:id", validate.getArtistById, controller.getArtistById);
router.patch(
    "/:id",
    requireAuth,
    requireArtistManagerOrAdmin,
    uploadSingle("avatar"),
    validate.updateArtist,
    uploadToCloudinary,
    controller.updateArtist
);
router.delete("/:id", requireAuth, requireAdmin, validate.getArtistById, controller.deleteArtist);

router.get("/:id/tracks", validate.getArtistById, controller.getArtistTracks);
router.get("/:id/albums", validate.getArtistById, controller.getArtistAlbums);

router.get("/:id/members", requireAuth, requireArtistManagerOrAdmin, validate.getArtistById, controller.getArtistMembers);
router.post("/:id/members", requireAuth, requireArtistManagerOrAdmin, validate.addMember, controller.addArtistMember);
router.delete(
    "/:id/members/:userId",
    requireAuth,
    requireArtistManagerOrAdmin,
    validate.removeMember,
    controller.removeArtistMember
);

export default router;
