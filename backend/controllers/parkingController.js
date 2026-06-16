import mongoose from "mongoose";
import Building from "../models/Building.js";
import Space from "../models/Space.js";
import ParkingLog from "../models/ParkingLog.js";

const LOCK_DURATION_MS = 5 * 60 * 1000;

const releaseStaleLocks = async () => {
  const expired = await Space.find({ status: "locked", lockExpiresAt: { $lte: new Date() } });
  for (const space of expired) {
    await ParkingLog.findOneAndUpdate(
      { spaceId: space.spaceId, status: "pending" },
      { status: "completed", timestampOut: new Date() }
    );
    space.status = "available";
    space.assignedVehicle = null;
    space.lockExpiresAt = null;
    await space.save();
  }
};

setInterval(releaseStaleLocks, 60 * 1000);

const getBuildingLayout = async (req, res) => {
  try {
    const { buildingName } = req.query;
    if (!buildingName) {
      return res.status(400).json({ message: "buildingName is required" });
    }

    const building = await Building.findOne({ buildingName });
    if (!building) {
      return res.status(404).json({ message: "Building not found" });
    }

    const floorLayouts = await Promise.all(
      building.floors.map(async (floor) => {
        const spaces = await Space.find({ buildingName, floorLevel: floor.floorLevel })
          .sort({ spaceId: 1 })
          .select("spaceId status lockExpiresAt");
        return {
          floorLevel: floor.floorLevel,
          totalSpaces: floor.totalSpaces,
          occupiedSpaces: floor.occupiedSpaces,
          availableSpaces: floor.availableSpaces,
          spaces: spaces.map(s => ({
            spaceId: s.spaceId,
            status: s.status,
            lockExpiresAt: s.lockExpiresAt
          }))
        };
      })
    );

    return res.json({
      buildingName: building.buildingName,
      floors: floorLayouts
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const lockSpace = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { buildingName, floorLevel, spaceId } = req.body;
    const userId = req.user._id;
    const vehicleNumber = req.user.vehicleNumber;

    if (!buildingName || !floorLevel || !spaceId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "buildingName, floorLevel, and spaceId are required" });
    }

    const existingSession = await ParkingLog.findOne({
      userId,
      status: { $in: ["active", "pending"] }
    }).session(session);

    if (existingSession) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "You already have an active or pending parking session",
        existingSpaceId: existingSession.spaceId,
        existingFloor: existingSession.floorLevel,
        existingBuilding: existingSession.buildingName,
        existingStatus: existingSession.status
      });
    }

    const lockExpiresAt = new Date(Date.now() + LOCK_DURATION_MS);

    const lockedSpace = await Space.findOneAndUpdate(
      { spaceId, buildingName, floorLevel, status: "available" },
      { status: "locked", assignedVehicle: vehicleNumber, lockExpiresAt },
      { new: true, session }
    );

    if (!lockedSpace) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "Space already reserved or occupied. Please choose another slot."
      });
    }

    const log = await ParkingLog.create([{
      userId,
      vehicleNumber,
      buildingName,
      floorLevel,
      spaceId,
      aiLandmarkHint: "",
      timestampIn: new Date(),
      status: "pending"
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      spaceId,
      buildingName,
      floorLevel,
      lockExpiresAt,
      logId: log[0]._id,
      message: "Space locked for 5 minutes. Please park and confirm."
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};

const confirmParking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { spaceId, buildingName, floorLevel, aiLandmarkHint } = req.body;
    const userId = req.user._id;

    const log = await ParkingLog.findOne({ userId, spaceId, status: "pending" }).session(session);
    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No pending lock found for this space. It may have expired." });
    }

    const space = await Space.findOneAndUpdate(
      { spaceId, buildingName, floorLevel, status: "locked", assignedVehicle: req.user.vehicleNumber },
      { status: "occupied", lockExpiresAt: null },
      { new: true, session }
    );

    if (!space) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ message: "Lock expired or space was released. Please select another slot." });
    }

    log.status = "active";
    log.aiLandmarkHint = aiLandmarkHint || "";
    log.timestampIn = new Date();
    await log.save({ session });

    const building = await Building.findOne({ buildingName }).session(session);
    if (building) {
      const floor = building.floors.find(f => f.floorLevel === floorLevel);
      if (floor) {
        floor.occupiedSpaces = Math.min(floor.occupiedSpaces + 1, floor.totalSpaces);
        await building.save({ session });
      }
    }

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      success: true,
      log,
      space,
      message: "Parking confirmed successfully."
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};

const checkoutSpace = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user._id;

    const log = await ParkingLog.findOne({ userId, status: "active" }).session(session);
    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No active parking session found" });
    }

    log.status = "completed";
    log.timestampOut = new Date();
    await log.save({ session });

    await Space.findOneAndUpdate(
      { spaceId: log.spaceId },
      { status: "available", assignedVehicle: null, lockExpiresAt: null },
      { session }
    );

    const building = await Building.findOne({ buildingName: log.buildingName }).session(session);
    if (building) {
      const floor = building.floors.find(f => f.floorLevel === log.floorLevel);
      if (floor && floor.occupiedSpaces > 0) {
        floor.occupiedSpaces -= 1;
      }
      await building.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const durationMs = log.timestampOut - log.timestampIn;
    const totalMinutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return res.json({
      success: true,
      log,
      duration,
      spaceId: log.spaceId,
      buildingName: log.buildingName,
      floorLevel: log.floorLevel
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};

const getAvailability = async (req, res) => {
  try {
    const buildings = await Building.find().sort({ createdAt: 1 });
    const result = buildings.map(b => ({
      buildingName: b.buildingName,
      _id: b._id,
      floors: b.floors.map(f => ({
        floorLevel: f.floorLevel,
        totalSpaces: f.totalSpaces,
        occupiedSpaces: f.occupiedSpaces,
        availableSpaces: f.availableSpaces
      }))
    }));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const checkIn = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { buildingName, floorLevel, spaceId, aiLandmarkHint } = req.body;
    const vehicleNumber = req.user.vehicleNumber;
    const userId = req.user._id;

    const existingActive = await ParkingLog.findOne({ userId, status: { $in: ["active", "pending"] } }).session(session);
    if (existingActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "You already have an active parking session" });
    }

    const space = await Space.findOneAndUpdate(
      { spaceId, buildingName, floorLevel, status: "available" },
      { status: "occupied", assignedVehicle: vehicleNumber, lockExpiresAt: null },
      { new: true, session }
    );

    if (!space) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: "Space Already Taken" });
    }

    const building = await Building.findOne({ buildingName }).session(session);
    if (!building) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Building not found" });
    }

    const floor = building.floors.find(f => f.floorLevel === floorLevel);
    if (!floor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Floor not found" });
    }

    floor.occupiedSpaces += 1;
    await building.save({ session });

    const log = await ParkingLog.create([{
      userId,
      vehicleNumber,
      buildingName,
      floorLevel,
      spaceId,
      aiLandmarkHint: aiLandmarkHint || "",
      timestampIn: new Date(),
      status: "active"
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ success: true, log: log[0], space });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};

const checkOut = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user._id;

    const log = await ParkingLog.findOne({ userId, status: "active" }).session(session);
    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No active parking session found" });
    }

    log.status = "completed";
    log.timestampOut = new Date();
    await log.save({ session });

    await Space.findOneAndUpdate(
      { spaceId: log.spaceId },
      { status: "available", assignedVehicle: null, lockExpiresAt: null },
      { session }
    );

    const building = await Building.findOne({ buildingName: log.buildingName }).session(session);
    if (building) {
      const floor = building.floors.find(f => f.floorLevel === log.floorLevel);
      if (floor && floor.occupiedSpaces > 0) {
        floor.occupiedSpaces -= 1;
      }
      await building.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const durationMs = log.timestampOut - log.timestampIn;
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return res.json({ success: true, log, duration });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};

const getActiveParking = async (req, res) => {
  try {
    const log = await ParkingLog.findOne({ userId: req.user._id, status: { $in: ["active", "pending"] } });
    return res.json({ active: !!log && log.status === "active", log: log || null });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getParkingHistory = async (req, res) => {
  try {
    const logs = await ParkingLog.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(20);
    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const checkInFloorScanner = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { buildingName, floorLevel } = req.body;
    if (!buildingName || !floorLevel) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "buildingName and floorLevel are required" });
    }

    const vehicleNumber = req.user.vehicleNumber;
    const userId = req.user._id;

    const existingActive = await ParkingLog.findOne({ userId, status: { $in: ["active", "pending"] } }).session(session);
    if (existingActive) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        message: "You already have an active parking session",
        existingSpaceId: existingActive.spaceId,
        existingFloor: existingActive.floorLevel,
        existingBuilding: existingActive.buildingName
      });
    }

    const allocatedSpace = await Space.findOneAndUpdate(
      { buildingName, floorLevel, status: "available" },
      { status: "occupied", assignedVehicle: vehicleNumber, lockExpiresAt: null },
      { new: true, sort: { spaceId: 1 }, session }
    );

    if (!allocatedSpace) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({ success: false, message: "No available spaces on this floor" });
    }

    const building = await Building.findOne({ buildingName }).session(session);
    if (!building) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Building not found" });
    }

    const floor = building.floors.find(f => f.floorLevel === floorLevel);
    if (!floor) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Floor not found in building" });
    }

    floor.occupiedSpaces += 1;
    await building.save({ session });

    const log = await ParkingLog.create([{
      userId,
      vehicleNumber,
      buildingName,
      floorLevel,
      spaceId: allocatedSpace.spaceId,
      aiLandmarkHint: allocatedSpace.landmarkHint || "",
      timestampIn: new Date(),
      status: "active"
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      buildingName,
      floorLevel,
      spaceId: allocatedSpace.spaceId,
      landmarkHint: allocatedSpace.landmarkHint || "",
      availableSpaces: floor.totalSpaces - floor.occupiedSpaces,
      log: log[0]
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};

const checkOutFloorScanner = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { buildingName, floorLevel } = req.body;
    const userId = req.user._id;

    const query = { userId, status: "active" };
    if (buildingName) query.buildingName = buildingName;
    if (floorLevel) query.floorLevel = floorLevel;

    const log = await ParkingLog.findOne(query).session(session);
    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "No active parking session found for this floor" });
    }

    log.status = "completed";
    log.timestampOut = new Date();
    await log.save({ session });

    await Space.findOneAndUpdate(
      { spaceId: log.spaceId, buildingName: log.buildingName },
      { status: "available", assignedVehicle: null, lockExpiresAt: null },
      { session }
    );

    const building = await Building.findOne({ buildingName: log.buildingName }).session(session);
    if (building) {
      const floor = building.floors.find(f => f.floorLevel === log.floorLevel);
      if (floor && floor.occupiedSpaces > 0) {
        floor.occupiedSpaces -= 1;
      }
      await building.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const durationMs = log.timestampOut - log.timestampIn;
    const minutes = Math.floor(durationMs / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const duration = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

    return res.json({
      success: true,
      spaceId: log.spaceId,
      buildingName: log.buildingName,
      floorLevel: log.floorLevel,
      duration,
      log
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};

export {
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
};
