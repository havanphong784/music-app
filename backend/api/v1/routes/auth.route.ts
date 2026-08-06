import express from "express";
import * as middleware from "../validates/auth.validate";
import * as controller from "../controllers/auth.controller";

const router = express.Router();
router.post("/register", middleware.register, controller.register);
router.post("/login", middleware.login, controller.login)

export default router;