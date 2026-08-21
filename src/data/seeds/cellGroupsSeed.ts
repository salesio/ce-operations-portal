/**
 * cellGroupsSeed.ts
 * Authoritative cell groups seed extracted from Official Database Excel.
 */

export interface CellGroupDefinition {
  id: string;
  name: string;
  total_cells: number;
  total_members: number;
}

export const CELL_GROUP_DEFINITIONS: CellGroupDefinition[] = [
  {
    "id": "a62f461e-e574-4052-8ef3-a4d0ee0c77c4",
    "name": "Diplomatas",
    "total_cells": 7,
    "total_members": 67
  },
  {
    "id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "name": "Estrelas de Siao",
    "total_cells": 9,
    "total_members": 66
  },
  {
    "id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "name": "QOG",
    "total_cells": 25,
    "total_members": 149
  },
  {
    "id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "name": "Royal Sister",
    "total_cells": 27,
    "total_members": 411
  },
  {
    "id": "f9f013c8-346f-4567-8911-762379b97d40",
    "name": "Visionarios",
    "total_cells": 1,
    "total_members": 14
  },
  {
    "id": "0689db79-05e3-439d-8664-666387c591dd",
    "name": "Wealth Nation",
    "total_cells": 10,
    "total_members": 86
  },
  {
    "id": "0d7246a1-0afe-45a6-8489-e564668d0cd6",
    "name": "Pais da Fé",
    "total_cells": 8,
    "total_members": 68
  },
  {
    "id": "893e2625-2736-41be-802f-87ae6594cb68",
    "name": "Perolas do Reino",
    "total_cells": 7,
    "total_members": 66
  },
  {
    "id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "name": "Vanguard",
    "total_cells": 28,
    "total_members": 172
  },
  {
    "id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "name": "MWV",
    "total_cells": 10,
    "total_members": 154
  },
  {
    "id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "name": "Zion Nation",
    "total_cells": 12,
    "total_members": 103
  },
  {
    "id": "9b9f457d-d5da-4ff7-8862-381b41d51396",
    "name": "Dominio",
    "total_cells": 1,
    "total_members": 18
  },
  {
    "id": "f903cb5f-60b2-4fb4-86ac-5712b6578205",
    "name": "Transformada",
    "total_cells": 1,
    "total_members": 50
  },
  {
    "id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "name": "Agathos",
    "total_cells": 10,
    "total_members": 58
  },
  {
    "id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "name": "Pioneiro",
    "total_cells": 17,
    "total_members": 172
  },
  {
    "id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "name": "Blossom",
    "total_cells": 14,
    "total_members": 94
  },
  {
    "id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "name": "Phronesis",
    "total_cells": 22,
    "total_members": 143
  }
];

export interface CellGroupSeed {
  id: string;
  church_id: string;
  name: string;
  leader_id: string;
  target_attendance: number;
  target_giving_usd: number;
  created_at: string;
}

export const CELL_GROUPS_SEED: CellGroupSeed[] = CELL_GROUP_DEFINITIONS.map((group, index) => ({
  id: group.id,
  church_id: "a1111111-1111-4111-8111-111111111101",
  name: group.name,
  leader_id: `u1111111-0000-0000-0000-${String(index + 1).padStart(12, "0")}`,
  target_attendance: Math.max(30, group.total_members),
  target_giving_usd: 1500,
  created_at: "2026-07-01T00:00:00.000Z",
}));
