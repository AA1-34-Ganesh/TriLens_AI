import mongoose from "mongoose";

const floorSchema = new mongoose.Schema({
  floorLevel: { type: String, required: true },
  totalSpaces: { type: Number, required: true, default: 0 },
  occupiedSpaces: { type: Number, default: 0 }
}, { _id: true });

floorSchema.virtual("availableSpaces").get(function () {
  return this.totalSpaces - this.occupiedSpaces;
});

floorSchema.set("toJSON", { virtuals: true });
floorSchema.set("toObject", { virtuals: true });

const buildingSchema = new mongoose.Schema({
  buildingName: { type: String, required: true, unique: true, trim: true },
  blockId: { type: String, default: null, trim: true, uppercase: true },
  floors: [floorSchema]
}, { timestamps: true });

export default mongoose.model("Building", buildingSchema);
