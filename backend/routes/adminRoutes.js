import express from "express";
import {
  createBuilding, getBuildings, updateBuilding, deleteBuilding,
  addFloor, editFloor, deleteFloor, getOccupancy, getSpaces
} from "../controllers/adminController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.use(protect, adminOnly);

router.get("/buildings", getBuildings);
router.post("/buildings", createBuilding);
router.put("/buildings/:id", updateBuilding);
router.delete("/buildings/:id", deleteBuilding);

router.post("/buildings/:id/floors", addFloor);
router.put("/buildings/:id/floors/:floorId", editFloor);
router.delete("/buildings/:id/floors/:floorId", deleteFloor);

router.get("/occupancy", getOccupancy);
router.get("/spaces", getSpaces);

export default router;
