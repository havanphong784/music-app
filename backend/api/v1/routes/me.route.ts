import express from "express";
import {requireAuth} from "../middlewares/auth.middleware";
import {uploadSingle, uploadToCloudinary} from "../middlewares/uploadCloud.middleware";
import * as userValidate from "../validates/user.validate";
import * as userController from "../controllers/user.controller";
import * as meValidate from "../validates/me.validate";
import * as meController from "../controllers/me.controller";

const router = express.Router();

router.get("/", requireAuth, userController.getMe);
router.patch(
    "/",
    requireAuth,
    uploadSingle("avatar", "image"),
    userValidate.updateMe,
    uploadToCloudinary,
    userController.updateMe
);

router.get("/playlists", requireAuth, meValidate.getPagination, meController.getMyPlaylists);

router.get("/favorites/tracks", requireAuth, meValidate.getPagination, meController.getFavoriteTracks);
router.post("/favorites/tracks/:trackId", requireAuth, meValidate.trackIdParam, meController.addFavoriteTrack);
router.delete("/favorites/tracks/:trackId", requireAuth, meValidate.trackIdParam, meController.removeFavoriteTrack);

router.get("/following/artists", requireAuth, meValidate.getPagination, meController.getFollowedArtists);
router.post("/following/artists/:artistId", requireAuth, meValidate.artistIdParam, meController.followArtist);
router.delete("/following/artists/:artistId", requireAuth, meValidate.artistIdParam, meController.unfollowArtist);

router.get("/history", requireAuth, meValidate.getPagination, meController.getListeningHistory);
router.delete("/history", requireAuth, meController.clearListeningHistory);

export default router;
