import express from "express";
import authRoute from "./auth.route";
import meRoute from "./me.route";
import userRoute from "./user.route";
import artistRoute from "./artist.route";
import albumRoute from "./album.route";
import trackRoute from "./track.route";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/me", meRoute);
router.use("/users", userRoute);
router.use("/artists", artistRoute);
router.use("/albums", albumRoute);
router.use("/tracks", trackRoute);

export default router;