import express from "express";
import {requireAdmin, requireArtistManagerOrAdmin, requireArtistVerificationPermission, requireAuth} from "../middlewares/auth.middleware";
import {uploadSingle, uploadToCloudinary} from "../middlewares/uploadCloud.middleware";
import * as validate from "../validates/artist.validate";
import * as controller from "../controllers/artist.controller";

const router = express.Router();

router.get("/", validate.getArtists, controller.getArtists);
router.post(
    "/",
    requireAuth,
    requireAdmin,
    uploadSingle("avatar", "image"),
    validate.createArtist,
    uploadToCloudinary,
    controller.createArtist
);

router.get("/:id", validate.getArtistById, controller.getArtistById);
router.patch(
    "/:id",
    requireAuth,
    validate.getArtistById,
    requireArtistManagerOrAdmin,
    uploadSingle("avatar", "image"),
    validate.updateArtist,
    requireArtistVerificationPermission,
    uploadToCloudinary,
    controller.updateArtist
);
router.delete("/:id", requireAuth, requireAdmin, validate.getArtistById, controller.deleteArtist);

router.get("/:id/tracks", validate.getArtistById, controller.getArtistTracks);
router.get("/:id/albums", validate.getArtistById, controller.getArtistAlbums);

router.get("/:id/members", requireAuth, validate.getArtistById, requireArtistManagerOrAdmin, controller.getArtistMembers);
router.post("/:id/members", requireAuth, requireAdmin, validate.addMember, controller.addArtistMember);
router.delete(
    "/:id/members/:userId",
    requireAuth,
    requireAdmin,
    validate.removeMember,
    controller.removeArtistMember
);

export default router;
