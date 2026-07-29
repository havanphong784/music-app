import {Router} from "express";
import * as controller from "../../controllers/v1/auth.controller.js"
import * as validate from "../../validates/auth.validate.js";

const router = Router();
router.post("/register", validate.register, controller.register);

export default router;