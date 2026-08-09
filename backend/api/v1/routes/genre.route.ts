import express from "express";
import {requireAdmin, requireAuth} from "../middlewares/auth.middleware";
import * as validate from "../validates/genre.validate";
import * as controller from "../controllers/genre.controller";

const router = express.Router();

router.get("/", validate.getGenres, controller.getGenres);
router.get("/:idOrSlug", validate.getGenreByIdOrSlug, controller.getGenreByIdOrSlug);
router.get("/:idOrSlug/tracks", validate.getGenreByIdOrSlug, validate.getGenres, controller.getGenreTracks);

router.post("/", requireAuth, requireAdmin, validate.createGenre, controller.createGenre);
router.patch("/:id", requireAuth, requireAdmin, validate.updateGenre, controller.updateGenre);
router.delete("/:id", requireAuth, requireAdmin, validate.deleteGenre, controller.deleteGenre);

export default router;
