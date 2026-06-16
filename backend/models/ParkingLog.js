import mongoose from "mongoose";

const parkingLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  vehicleNumber: { type: String, required: true },
  ownerName: { type: String, default: "" },
  mobileNumber: { type: String, default: "" },
  vehicleType: { type: String, enum: ["bike", "car", "other"], default: "car" },
  userType: { type: String, enum: ["resident", "visitor"], default: "visitor" },
  blockId: { type: String, default: null },
  buildingName: { type: String, required: true },
  floorLevel: { type: String, required: true },
  spaceId: { type: String, required: true },
  aiLandmarkHint: { type: String, default: "" },
  timestampIn: { type: Date, default: Date.now },
  timestampOut: { type: Date, default: null },
  status: { type: String, enum: ["active", "completed", "pending"], default: "pending" }
}, { timestamps: true });

parkingLogSchema.index({ blockId: 1, status: 1 });
parkingLogSchema.index({ vehicleNumber: 1, status: 1 });
parkingLogSchema.index({ ownerName: 1 });

export default mongoose.model("ParkingLog", parkingLogSchema);
