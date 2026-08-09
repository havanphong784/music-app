import express from "express";
import authRoute from "./auth.route";
import meRoute from "./me.route";
import userRoute from "./user.route";
import artistRoute from "./artist.route";
import albumRoute from "./album.route";
import trackRoute from "./track.route";
import genreRoute from "./genre.route";
import playlistRoute from "./playlist.route";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/me", meRoute);
router.use("/users", userRoute);
router.use("/artists", artistRoute);
router.use("/albums", albumRoute);
router.use("/tracks", trackRoute);
router.use("/genres", genreRoute);
router.use("/playlists", playlistRoute);

export default router;
