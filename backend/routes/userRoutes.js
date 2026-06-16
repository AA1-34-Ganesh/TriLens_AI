import express from "express";
import { getUsers, updateUser, resetUserPassword, deleteUser, createUser } from "../controllers/userController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", getUsers);
router.post("/", createUser);
router.put("/:id", updateUser);
router.post("/:id/reset-password", resetUserPassword);
router.delete("/:id", deleteUser);

export default router;
