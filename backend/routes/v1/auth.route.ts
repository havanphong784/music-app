import {Router} from "express";
import * as controller from "../../controllers/v1/auth.controller.js"
import * as validate from "../../validates/auth.validate.js";
import {requireAuth} from "../../middlewares/v1/auth.middleware.js";

const router = Router();
router.post("/register", validate.register, controller.register);
router.post("/login", validate.login, controller.login);
router.post("/forgot-password", validate.forgotPassword, controller.forgotPassword);
router.post("/reset-password", validate.resetPassword, controller.resetPassword);
router.post("/refresh-token", controller.refreshToken);
router.post("/logout", controller.logout);
router.delete("/sessions", requireAuth, controller.deleteSessions);

export default router;
