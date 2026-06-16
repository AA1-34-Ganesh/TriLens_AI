import express from "express";
import {
  getBlockOverview,
  getBlockMap,
  guestPark,
  createBlock,
  getBlocks,
  updateBlock,
  deleteBlock,
  regenerateBlockQR,
  getBlockAdminDashboard,
  searchVehicles,
  adminCheckoutVehicle,
  createBlockAdmin
} from "../controllers/blockController.js";
import { protect, adminOnly, blockAdminOnly } from "../middleware/auth.js";

const router = express.Router();


router.get("/:blockId/overview", getBlockOverview);
router.get("/:blockId/map", getBlockMap);
router.post("/:blockId/park", guestPark);


router.get("/admin/dashboard", protect, blockAdminOnly, getBlockAdminDashboard);
router.get("/admin/vehicles/search", protect, blockAdminOnly, searchVehicles);
router.post("/admin/vehicles/:logId/checkout", protect, blockAdminOnly, adminCheckoutVehicle);


router.get("/", protect, adminOnly, getBlocks);
router.post("/", protect, adminOnly, createBlock);
router.put("/:id", protect, adminOnly, updateBlock);
router.delete("/:id", protect, adminOnly, deleteBlock);
router.post("/:id/regenerate-qr", protect, adminOnly, regenerateBlockQR);
router.post("/block-admins", protect, adminOnly, createBlockAdmin);

export default router;
