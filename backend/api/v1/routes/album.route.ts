import express from "express";
import {requireAdmin, requireAuth} from "../middlewares/auth.middleware";
import {uploadSingle, uploadToCloudinary} from "../middlewares/uploadCloud.middleware";
import * as validate from "../validates/album.validate";
import * as controller from "../controllers/album.controller";

const router = express.Router();

router.get("/", validate.getAlbums, controller.getAlbums);
router.get("/:id", validate.getAlbumById, controller.getAlbumById);

router.post(
    "/",
    requireAuth,
    requireAdmin,
    uploadSingle("cover", "image"),
    validate.createAlbum,
    uploadToCloudinary,
    controller.createAlbum
);

router.patch(
    "/:id",
    requireAuth,
    requireAdmin,
    uploadSingle("cover", "image"),
    validate.updateAlbum,
    uploadToCloudinary,
    controller.updateAlbum
);

router.delete("/:id", requireAuth, requireAdmin, validate.getAlbumById, controller.deleteAlbum);

export default router;
