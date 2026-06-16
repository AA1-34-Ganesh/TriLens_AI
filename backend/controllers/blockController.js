import mongoose from "mongoose";
import Block from "../models/Block.js";
import Building from "../models/Building.js";
import Space from "../models/Space.js";
import ParkingLog from "../models/ParkingLog.js";
import bcrypt from "bcryptjs";
import User from "../models/User.js";


const getBlockOverview = async (req, res) => {
  try {
    const { blockId } = req.params;
    const block = await Block.findOne({ blockId: blockId.toUpperCase() });
    if (!block) return res.status(404).json({ message: "Block not found" });

    const buildings = await Building.find({ blockId: block.blockId }).sort({ buildingName: 1 });

    let totalSpaces = 0;
    let totalOccupied = 0;
    const floorSummaries = [];

    for (const building of buildings) {
      for (const floor of building.floors) {
        totalSpaces += floor.totalSpaces;
        totalOccupied += floor.occupiedSpaces;
        floorSummaries.push({
          buildingName: building.buildingName,
          floorLevel: floor.floorLevel,
          totalSpaces: floor.totalSpaces,
          occupiedSpaces: floor.occupiedSpaces,
          availableSpaces: floor.availableSpaces
        });
      }
    }

    return res.json({
      blockId: block.blockId,
      blockName: block.blockName,
      description: block.description,
      qrUrl: block.qrUrl,
      totalSpaces,
      totalOccupied,
      totalAvailable: totalSpaces - totalOccupied,
      floors: floorSummaries,
      buildings: buildings.map(b => ({ buildingName: b.buildingName, _id: b._id }))
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const getBlockMap = async (req, res) => {
  try {
    const { blockId } = req.params;
    const block = await Block.findOne({ blockId: blockId.toUpperCase() });
    if (!block) return res.status(404).json({ message: "Block not found" });

    const buildings = await Building.find({ blockId: block.blockId }).sort({ buildingName: 1 });

    const result = await Promise.all(
      buildings.map(async (building) => {
        const floorLayouts = await Promise.all(
          building.floors.map(async (floor) => {
            const spaces = await Space.find({
              buildingName: building.buildingName,
              floorLevel: floor.floorLevel
            }).sort({ spaceId: 1 }).select("spaceId status lockExpiresAt");

            return {
              floorLevel: floor.floorLevel,
              totalSpaces: floor.totalSpaces,
              occupiedSpaces: floor.occupiedSpaces,
              availableSpaces: floor.availableSpaces,
              spaces: spaces.map(s => ({
                spaceId: s.spaceId,
                status: s.status === "locked" ? "reserved" : s.status,
                lockExpiresAt: s.lockExpiresAt
              }))
            };
          })
        );
        return {
          buildingName: building.buildingName,
          floors: floorLayouts
        };
      })
    );

    return res.json({
      blockId: block.blockId,
      blockName: block.blockName,
      buildings: result
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const guestPark = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { blockId } = req.params;
    const { buildingName, floorLevel, spaceId, ownerName, mobileNumber, vehicleNumber, vehicleType, userType } = req.body;

    if (!buildingName || !floorLevel || !spaceId || !ownerName || !mobileNumber || !vehicleNumber) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "All fields are required" });
    }

    const block = await Block.findOne({ blockId: blockId.toUpperCase() }).session(session);
    if (!block) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Block not found" });
    }

    const building = await Building.findOne({ buildingName, blockId: block.blockId }).session(session);
    if (!building) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: "Building does not belong to this block" });
    }

    const lockExpiresAt = new Date(Date.now() + 5 * 60 * 1000);


    const lockedSpace = await Space.findOneAndUpdate(
      { spaceId, buildingName, floorLevel, status: "available" },
      { status: "locked", assignedVehicle: vehicleNumber.toUpperCase(), lockExpiresAt },
      { new: true, session }
    );

    if (!lockedSpace) {
      await session.abortTransaction();
      session.endSession();
      return res.status(409).json({
        success: false,
        message: "Slot already occupied. Please select another slot."
      });
    }

  
    lockedSpace.status = "occupied";
    lockedSpace.lockExpiresAt = null;
    await lockedSpace.save({ session });

    const floor = building.floors.find(f => f.floorLevel === floorLevel);
    if (floor) {
      floor.occupiedSpaces = Math.min(floor.occupiedSpaces + 1, floor.totalSpaces);
      await building.save({ session });
    }

    const log = await ParkingLog.create([{
      userId: null,
      vehicleNumber: vehicleNumber.toUpperCase(),
      ownerName,
      mobileNumber,
      vehicleType: vehicleType || "car",
      userType: userType || "visitor",
      blockId: block.blockId,
      buildingName,
      floorLevel,
      spaceId,
      timestampIn: new Date(),
      status: "active"
    }], { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      logId: log[0]._id,
      spaceId,
      buildingName,
      floorLevel,
      blockId: block.blockId,
      blockName: block.blockName,
      ownerName,
      vehicleNumber: vehicleNumber.toUpperCase(),
      timestampIn: log[0].timestampIn
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};



const createBlock = async (req, res) => {
  try {
    const { blockId, blockName, description } = req.body;
    if (!blockId || !blockName) return res.status(400).json({ message: "blockId and blockName are required" });

    const exists = await Block.findOne({ blockId: blockId.toUpperCase() });
    if (exists) return res.status(400).json({ message: "Block already exists" });

    const block = await Block.create({
      blockId: blockId.toUpperCase(),
      blockName,
      description: description || "",
      qrUrl: `/block/${blockId.toUpperCase()}`
    });

    return res.status(201).json(block);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getBlocks = async (req, res) => {
  try {
    const blocks = await Block.find().sort({ blockId: 1 });
   
    const enriched = await Promise.all(blocks.map(async (b) => {
      const buildings = await Building.find({ blockId: b.blockId });
      let totalSpaces = 0;
      let totalOccupied = 0;
      buildings.forEach(bld => {
        bld.floors.forEach(f => {
          totalSpaces += f.totalSpaces;
          totalOccupied += f.occupiedSpaces;
        });
      });
      return {
        _id: b._id,
        blockId: b.blockId,
        blockName: b.blockName,
        description: b.description,
        qrUrl: b.qrUrl,
        buildingCount: buildings.length,
        totalSpaces,
        totalOccupied,
        totalAvailable: totalSpaces - totalOccupied
      };
    }));
    return res.json(enriched);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const { blockName, description } = req.body;
    const block = await Block.findByIdAndUpdate(id, { blockName, description }, { new: true });
    if (!block) return res.status(404).json({ message: "Block not found" });
    return res.json(block);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const block = await Block.findByIdAndDelete(id);
    if (!block) return res.status(404).json({ message: "Block not found" });

    await Building.updateMany({ blockId: block.blockId }, { blockId: null });
    return res.json({ message: "Block deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const regenerateBlockQR = async (req, res) => {
  try {
    const { id } = req.params;
    const block = await Block.findById(id);
    if (!block) return res.status(404).json({ message: "Block not found" });
    block.qrUrl = `/block/${block.blockId}`;
    await block.save();
    return res.json({ success: true, qrUrl: block.qrUrl, block });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const getBlockAdminDashboard = async (req, res) => {
  try {
    const assignedBlock = req.user.assignedBlock;
    if (!assignedBlock) return res.status(403).json({ message: "No block assigned" });

    const block = await Block.findOne({ blockId: assignedBlock });
    if (!block) return res.status(404).json({ message: "Assigned block not found" });

    const buildings = await Building.find({ blockId: assignedBlock }).sort({ buildingName: 1 });

    let totalSpaces = 0;
    let totalOccupied = 0;
    const floorSummaries = [];

    buildings.forEach(bld => {
      bld.floors.forEach(f => {
        totalSpaces += f.totalSpaces;
        totalOccupied += f.occupiedSpaces;
        floorSummaries.push({
          buildingName: bld.buildingName,
          floorLevel: f.floorLevel,
          totalSpaces: f.totalSpaces,
          occupiedSpaces: f.occupiedSpaces,
          availableSpaces: f.availableSpaces
        });
      });
    });


    const activeLogs = await ParkingLog.find({ blockId: assignedBlock, status: "active" })
      .sort({ timestampIn: -1 });

    return res.json({
      blockId: block.blockId,
      blockName: block.blockName,
      totalSpaces,
      totalOccupied,
      totalAvailable: totalSpaces - totalOccupied,
      floors: floorSummaries,
      activeVehicles: activeLogs
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const searchVehicles = async (req, res) => {
  try {
    const assignedBlock = req.user.assignedBlock;
    if (!assignedBlock) return res.status(403).json({ message: "No block assigned" });

    const { q } = req.query;
    if (!q || q.trim().length < 2) return res.status(400).json({ message: "Query too short" });

    const searchRegex = new RegExp(q.trim(), "i");

    const logs = await ParkingLog.find({
      blockId: assignedBlock,
      status: "active",
      $or: [
        { vehicleNumber: searchRegex },
        { ownerName: searchRegex }
      ]
    }).sort({ timestampIn: -1 });

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const adminCheckoutVehicle = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const assignedBlock = req.user.assignedBlock;
    const { logId } = req.params;

    const log = await ParkingLog.findOne({ _id: logId, blockId: assignedBlock, status: "active" }).session(session);
    if (!log) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Active log not found in your block" });
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
      if (floor && floor.occupiedSpaces > 0) floor.occupiedSpaces -= 1;
      await building.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const durationMs = log.timestampOut - log.timestampIn;
    const mins = Math.floor(durationMs / 60000);
    const hrs = Math.floor(mins / 60);
    const duration = hrs > 0 ? `${hrs}h ${mins % 60}m` : `${mins}m`;

    return res.json({ success: true, log, duration });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ message: err.message });
  }
};


const createBlockAdmin = async (req, res) => {
  try {
    const { studentId, name, password, assignedBlock } = req.body;
    if (!studentId || !name || !password || !assignedBlock) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const block = await Block.findOne({ blockId: assignedBlock.toUpperCase() });
    if (!block) return res.status(400).json({ message: "Block not found" });

    const exists = await User.findOne({ studentId });
    if (exists) return res.status(400).json({ message: "User ID already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      studentId,
      name,
      department: "Block Administration",
      vehicleNumber: "ADMIN00",
      password: hashed,
      role: "blockAdmin",
      assignedBlock: assignedBlock.toUpperCase()
    });

    return res.status(201).json({
      id: user._id,
      studentId: user.studentId,
      name: user.name,
      role: user.role,
      assignedBlock: user.assignedBlock
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export {
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
};
