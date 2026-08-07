import express from "express";
import * as validate from "../validates/auth.validate";
import * as controller from "../controllers/auth.controller";

const router = express.Router();
router.post("/register", validate.register, controller.register);
router.post("/login", validate.login, controller.login);
router.post("/refresh", controller.refresh);
router.post("/logout", controller.logout);

export default router;
