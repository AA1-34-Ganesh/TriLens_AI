import express from "express";
import {
  getBuildingLayout,
  lockSpace,
  confirmParking,
  checkoutSpace,
  getAvailability,
  checkIn,
  checkOut,
  getActiveParking,
  getParkingHistory,
  checkInFloorScanner,
  checkOutFloorScanner
} from "../controllers/parkingController.js";
import { getSpaces } from "../controllers/adminController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/availability", getAvailability);
router.get("/spaces", protect, getSpaces);
router.get("/layout", protect, getBuildingLayout);
router.post("/lock", protect, lockSpace);
router.post("/confirm", protect, confirmParking);
router.post("/checkout-space", protect, checkoutSpace);
router.post("/checkin", protect, checkIn);
router.post("/checkout", protect, checkOut);
router.get("/active", protect, getActiveParking);
router.get("/history", protect, getParkingHistory);
router.post("/floor-checkin", protect, checkInFloorScanner);
router.post("/floor-checkout", protect, checkOutFloorScanner);

export default router;
