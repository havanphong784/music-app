import express from "express";
import authRoute from "./auth.route";
import meRoute from "./me.route";
import userRoute from "./user.route";

const router = express.Router();

router.use("/auth", authRoute);
router.use("/me", meRoute);
router.use("/users", userRoute);

export default router;