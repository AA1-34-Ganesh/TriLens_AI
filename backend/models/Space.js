import mongoose from "mongoose";

const spaceSchema = new mongoose.Schema({
  buildingName: { type: String, required: true },
  floorLevel: { type: String, required: true },
  spaceId: { type: String, required: true, unique: true },
  status: { type: String, enum: ["available", "occupied", "locked"], default: "available" },
  assignedVehicle: { type: String, default: null },
  landmarkHint: { type: String, default: "" },
  lockExpiresAt: { type: Date, default: null }
}, { timestamps: true });

spaceSchema.index({ buildingName: 1, floorLevel: 1, status: 1 });
spaceSchema.index({ buildingName: 1, floorLevel: 1, spaceId: 1 });
spaceSchema.index({ status: 1, lockExpiresAt: 1 });

export default mongoose.model("Space", spaceSchema);
