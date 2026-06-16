import Building from "../models/Building.js";
import Space from "../models/Space.js";

const createBuilding = async (req, res) => {
  try {
    const { buildingName, blockId } = req.body;
    if (!buildingName) return res.status(400).json({ message: "Building name required" });
    const existing = await Building.findOne({ buildingName: buildingName.trim() });
    if (existing) return res.status(400).json({ message: "Building already exists" });
    const building = await Building.create({
      buildingName: buildingName.trim(),
      blockId: blockId ? blockId.trim().toUpperCase() : null,
      floors: []
    });
    return res.status(201).json(building);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getBuildings = async (req, res) => {
  try {
    const buildings = await Building.find().sort({ createdAt: 1 });
    return res.json(buildings);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const updateBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const { buildingName, blockId } = req.body;
    const updateData = { buildingName };
    if (blockId !== undefined) updateData.blockId = blockId ? blockId.trim().toUpperCase() : null;
    const building = await Building.findByIdAndUpdate(id, updateData, { new: true });
    if (!building) return res.status(404).json({ message: "Building not found" });
    return res.json(building);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteBuilding = async (req, res) => {
  try {
    const { id } = req.params;
    const building = await Building.findByIdAndDelete(id);
    if (!building) return res.status(404).json({ message: "Building not found" });
    await Space.deleteMany({ buildingName: building.buildingName });
    return res.json({ message: "Building deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const addFloor = async (req, res) => {
  try {
    const { id } = req.params;
    const { floorLevel, totalSpaces } = req.body;
    if (!floorLevel || !totalSpaces) return res.status(400).json({ message: "Floor level and total spaces required" });
    const building = await Building.findById(id);
    if (!building) return res.status(404).json({ message: "Building not found" });
    const floorExists = building.floors.find(f => f.floorLevel === floorLevel);
    if (floorExists) return res.status(400).json({ message: "Floor already exists in this building" });
    building.floors.push({ floorLevel, totalSpaces: parseInt(totalSpaces), occupiedSpaces: 0 });
    await building.save();
    const spacesBulk = [];
    for (let i = 1; i <= parseInt(totalSpaces); i++) {
      const num = String(i).padStart(2, "0");
      const prefix = floorLevel.replace(/\s+/g, "").substring(0, 3).toUpperCase();
      spacesBulk.push({
        buildingName: building.buildingName,
        floorLevel,
        spaceId: `${prefix}-${num}`,
        status: "available",
        assignedVehicle: null
      });
    }
    await Space.insertMany(spacesBulk, { ordered: false });
    return res.json(building);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const editFloor = async (req, res) => {
  try {
    const { id, floorId } = req.params;
    const { floorLevel, totalSpaces } = req.body;
    const building = await Building.findById(id);
    if (!building) return res.status(404).json({ message: "Building not found" });
    const floor = building.floors.id(floorId);
    if (!floor) return res.status(404).json({ message: "Floor not found" });
    if (floorLevel) floor.floorLevel = floorLevel;
    if (totalSpaces) floor.totalSpaces = parseInt(totalSpaces);
    await building.save();
    return res.json(building);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const deleteFloor = async (req, res) => {
  try {
    const { id, floorId } = req.params;
    const building = await Building.findById(id);
    if (!building) return res.status(404).json({ message: "Building not found" });
    const floor = building.floors.id(floorId);
    if (!floor) return res.status(404).json({ message: "Floor not found" });
    const floorLevelName = floor.floorLevel;
    building.floors.pull(floorId);
    await building.save();
    await Space.deleteMany({ buildingName: building.buildingName, floorLevel: floorLevelName });
    return res.json({ message: "Floor deleted" });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const getOccupancy = async (req, res) => {
  try {
    const buildings = await Building.find().sort({ createdAt: 1 });
    const result = buildings.map(b => ({
      buildingName: b.buildingName,
      _id: b._id,
      floors: b.floors.map(f => ({
        _id: f._id,
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

const getSpaces = async (req, res) => {
  try {
    const { buildingName, floorLevel } = req.query;
    const filter = {};
    if (buildingName) filter.buildingName = buildingName;
    if (floorLevel) filter.floorLevel = floorLevel;
    const spaces = await Space.find(filter).sort({ spaceId: 1 });
    return res.json(spaces);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

export { createBuilding, getBuildings, updateBuilding, deleteBuilding, addFloor, editFloor, deleteFloor, getOccupancy, getSpaces };
