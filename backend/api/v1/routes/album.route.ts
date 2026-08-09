import express from "express";
import {requireAlbumCreatorOrAdmin, requireAlbumManagerOrAdmin, requireAlbumReassignmentPermission, requireAuth} from "../middlewares/auth.middleware";
import {uploadSingle, uploadToCloudinary} from "../middlewares/uploadCloud.middleware";
import * as validate from "../validates/album.validate";
import * as controller from "../controllers/album.controller";

const router = express.Router();

router.get("/", validate.getAlbums, controller.getAlbums);
router.get("/:id", validate.getAlbumById, controller.getAlbumById);

router.post(
    "/",
    requireAuth,
    uploadSingle("cover", "image"),
    validate.createAlbum,
    requireAlbumCreatorOrAdmin,
    uploadToCloudinary,
    controller.createAlbum
);

router.patch(
    "/:id",
    requireAuth,
    validate.getAlbumById,
    requireAlbumManagerOrAdmin,
    uploadSingle("cover", "image"),
    validate.updateAlbum,
    requireAlbumReassignmentPermission,
    uploadToCloudinary,
    controller.updateAlbum
);

router.delete("/:id", requireAuth, validate.getAlbumById, requireAlbumManagerOrAdmin, controller.deleteAlbum);

export default router;
