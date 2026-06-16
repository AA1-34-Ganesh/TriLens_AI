import { useState, useCallback } from "react";
import { fetchBuildings, fetchBlocks } from "../services/adminService";

export function useAdminData() {
  const [buildings, setBuildings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [buildingsLoading, setBuildingsLoading] = useState(true);
  const [blocksLoading, setBlocksLoading] = useState(true);

  const loadBuildings = useCallback(async () => {
    setBuildingsLoading(true);
    try {
      const data = await fetchBuildings();
      setBuildings(data);
    } catch {
      setBuildings([]);
    } finally {
      setBuildingsLoading(false);
    }
  }, []);

  const loadBlocks = useCallback(async () => {
    setBlocksLoading(true);
    try {
      const data = await fetchBlocks();
      setBlocks(data);
    } catch {
      setBlocks([]);
    } finally {
      setBlocksLoading(false);
    }
  }, []);

  const totalFloors = buildings.reduce((sum, b) => sum + b.floors.length, 0);
  const totalSpaces = buildings.reduce(
    (sum, b) => sum + b.floors.reduce((fs, f) => fs + f.totalSpaces, 0),
    0
  );
  const totalOccupied = buildings.reduce(
    (sum, b) => sum + b.floors.reduce((fs, f) => fs + f.occupiedSpaces, 0),
    0
  );
  const totalAvailable = totalSpaces - totalOccupied;
  const occupancyPercent =
    totalSpaces > 0 ? Math.round((totalOccupied / totalSpaces) * 100) : 0;

  return {
    buildings,
    blocks,
    buildingsLoading,
    blocksLoading,
    loadBuildings,
    loadBlocks,
    stats: {
      totalBuildings: buildings.length,
      totalFloors,
      totalSpaces,
      totalOccupied,
      totalAvailable,
      occupancyPercent,
    },
  };
}
