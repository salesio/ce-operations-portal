/**
 * cell-seed-data.js
 * Authoritative Master Seed for Cell Groups & Cells extracted from Official Database Excel (November 2026).
 * All cells and groups are relational and mapped to E.C. Maputo Central - Sede.
 */
(function () {
  const REAL_CELL_GROUPS = [
  {
    "id": "a62f461e-e574-4052-8ef3-a4d0ee0c77c4",
    "name": "Diplomatas",
    "group_name": "Diplomatas",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 7,
    "total_members": 67
  },
  {
    "id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "name": "Estrelas de Siao",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 9,
    "total_members": 66
  },
  {
    "id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "name": "QOG",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 25,
    "total_members": 149
  },
  {
    "id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "name": "Royal Sister",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 27,
    "total_members": 411
  },
  {
    "id": "f9f013c8-346f-4567-8911-762379b97d40",
    "name": "Visionarios",
    "group_name": "Visionarios",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 1,
    "total_members": 14
  },
  {
    "id": "0689db79-05e3-439d-8664-666387c591dd",
    "name": "Wealth Nation",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 10,
    "total_members": 86
  },
  {
    "id": "0d7246a1-0afe-45a6-8489-e564668d0cd6",
    "name": "Pais da Fé",
    "group_name": "Pais da Fé",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 8,
    "total_members": 68
  },
  {
    "id": "893e2625-2736-41be-802f-87ae6594cb68",
    "name": "Perolas do Reino",
    "group_name": "Perolas do Reino",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 7,
    "total_members": 66
  },
  {
    "id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "name": "Vanguard",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 28,
    "total_members": 172
  },
  {
    "id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "name": "MWV",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 10,
    "total_members": 154
  },
  {
    "id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "name": "Zion Nation",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 12,
    "total_members": 103
  },
  {
    "id": "9b9f457d-d5da-4ff7-8862-381b41d51396",
    "name": "Dominio",
    "group_name": "Dominio",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 1,
    "total_members": 18
  },
  {
    "id": "f903cb5f-60b2-4fb4-86ac-5712b6578205",
    "name": "Transformada",
    "group_name": "Transformada",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 1,
    "total_members": 50
  },
  {
    "id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "name": "Agathos",
    "group_name": "Agathos",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 10,
    "total_members": 58
  },
  {
    "id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "name": "Pioneiro",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 17,
    "total_members": 172
  },
  {
    "id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "name": "Blossom",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 14,
    "total_members": 94
  },
  {
    "id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "name": "Phronesis",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 22,
    "total_members": 143
  },
  {
    "id": "d1a00000-0000-4000-8000-000000000001",
    "name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "total_cells": 10,
    "total_members": 0
  }
];

  const REAL_CELLS_REGISTRY = [
  {
    "id": "2b3a5652-b8be-4c76-8b64-b84200c8bcd4",
    "name": "Diplomatas Victory",
    "raw_name": "Diplomatas Victory",
    "group_id": "a62f461e-e574-4052-8ef3-a4d0ee0c77c4",
    "group_name": "Diplomatas",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 16
  },
  {
    "id": "6c53fbb1-02b5-476d-8088-b8db2ddeaa48",
    "name": "Diplomats Victory B",
    "raw_name": "Diplomats Victory B",
    "group_id": "a62f461e-e574-4052-8ef3-a4d0ee0c77c4",
    "group_name": "Diplomatas",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "7b18298d-f2b5-449d-856e-4ba3aa87b3a6",
    "name": "Diplomats B1",
    "raw_name": "Diplomats B1",
    "group_id": "a62f461e-e574-4052-8ef3-a4d0ee0c77c4",
    "group_name": "Diplomatas",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "35b19747-4375-4c1e-8373-7f7f955fbd3a",
    "name": "Diplomats koinonia",
    "raw_name": "Diplomats koinonia",
    "group_id": "a62f461e-e574-4052-8ef3-a4d0ee0c77c4",
    "group_name": "Diplomatas",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 7
  },
  {
    "id": "43b00e27-c304-4f33-8ca1-2e0666e15ccf",
    "name": "Diplomata Graca Abundante",
    "raw_name": "Diplomata Graca Abundante",
    "group_id": "a62f461e-e574-4052-8ef3-a4d0ee0c77c4",
    "group_name": "Diplomatas",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "00641d4c-079e-44b0-87bf-9c8fd813279c",
    "name": "Diplomatas The Chosen",
    "raw_name": "Diplomatas The Chosen",
    "group_id": "a62f461e-e574-4052-8ef3-a4d0ee0c77c4",
    "group_name": "Diplomatas",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 15
  },
  {
    "id": "91ef61d7-879d-4743-8ee9-1cdfa9f8e0d0",
    "name": "Diplomatas Jireh A",
    "raw_name": "Diplomatas Jireh A",
    "group_id": "a62f461e-e574-4052-8ef3-a4d0ee0c77c4",
    "group_name": "Diplomatas",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "7d93f13e-c274-44a6-8577-a29c179bb99e",
    "name": "ESTRELAS DE SIÃO",
    "raw_name": "ESTRELAS DE SIÃO",
    "group_id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "fb65bfec-2c8b-46b1-8b21-7d6b93e20f6b",
    "name": "ESTRELAS DE SIÃO A",
    "raw_name": "ESTRELAS DE SIÃO A",
    "group_id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "601b3fd7-ea6c-457a-8d6a-fca1fcd9c594",
    "name": "ESTRELAS DE SIÃO B",
    "raw_name": "ESTRELAS DE SIÃO B",
    "group_id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 6
  },
  {
    "id": "96fa52e0-fef6-481b-89f1-c3aee476690a",
    "name": "ESTRELAS DE SIÃO C",
    "raw_name": "ESTRELAS DE SIÃO C",
    "group_id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "1e6d6f18-d0e4-4731-8426-de2a73f2076d",
    "name": "ESTRELAS DE SIÃO D",
    "raw_name": "ESTRELAS DE SIÃO D",
    "group_id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "332fc230-3928-42a3-8d10-f2a3d422e08e",
    "name": "ESTRELAS DE SIÃO E",
    "raw_name": "ESTRELAS DE SIÃO E",
    "group_id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 16
  },
  {
    "id": "aa5ac1a1-d68d-4da8-86a9-384b54929f89",
    "name": "ESTRELAS DE SIÃO E1",
    "raw_name": "ESTRELAS DE SIÃO E1",
    "group_id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 6
  },
  {
    "id": "cdcd6632-1066-48b3-8565-467c56b54e80",
    "name": "ESTRELAS  DE SIÃO E2",
    "raw_name": "ESTRELAS  DE SIÃO E2",
    "group_id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 3
  },
  {
    "id": "370acec4-04fe-4946-8ec0-ea3d78daae79",
    "name": "ESTRELAS DE SIÃO F",
    "raw_name": "ESTRELAS DE SIÃO F",
    "group_id": "217d9a73-3d57-4979-854d-dc97662a55e5",
    "group_name": "Estrelas de Siao",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "a79317a5-e55c-4d71-8e8b-f8e83785e057",
    "name": "MAIN-Quens Of Glory",
    "raw_name": "CELL MAIN-Quens Of Glory",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 17
  },
  {
    "id": "7fd5e696-957d-499e-82c6-419ffe9f03c6",
    "name": "1-Queens of Glory Excellency",
    "raw_name": "CELL 1-Queens of Glory Excellency",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 12
  },
  {
    "id": "9c76693a-b11e-4498-87fa-9858ad510606",
    "name": "2-Queens of Glory Excellency A",
    "raw_name": "CELL 2-Queens of Glory Excellency A",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "d10a210a-0270-4824-848c-043d87478a3c",
    "name": "3 -Queens of Glory Prolifics",
    "raw_name": "CELL 3 -Queens of Glory Prolifics",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 11
  },
  {
    "id": "d95e37b2-0775-4f5a-84c1-ee53ce439e36",
    "name": "4-Queens of Glory Multiplied",
    "raw_name": "CELL 4-Queens of Glory Multiplied",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "e56fe8ca-ff78-4ca5-84b5-d2e8d8fb605a",
    "name": "5 - Queens of Glory Virtuous B",
    "raw_name": "CELL 5 - Queens of Glory Virtuous B",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "c897a008-1c13-4684-89d4-260cd85f060b",
    "name": "6 - Queens of Glory Righteousness",
    "raw_name": "CELL 6 - Queens of Glory Righteousness",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "3b83f188-8ad2-4fe5-8eae-ce04219cec3f",
    "name": "1 - Queens of Glory Bold Main",
    "raw_name": "CELL 1 - Queens of Glory Bold Main",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 21
  },
  {
    "id": "184acfd9-1558-4da8-85b2-1429687a3d9c",
    "name": "2 - Queens of Glory Bold C",
    "raw_name": "CELL 2 - Queens of Glory Bold C",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "ede150a7-7327-4575-8b32-8e3b6a7e99e9",
    "name": "3 - Queens of Glory Bold D",
    "raw_name": "CELL 3 - Queens of Glory Bold D",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "810b4710-a746-4890-8a90-c2d4f5cfa381",
    "name": "4 - Queens of Glory Bold E",
    "raw_name": "CELL 4 - Queens of Glory Bold E",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 12
  },
  {
    "id": "d668d15b-bb76-4061-8327-d1e4bcf35f0a",
    "name": "5 - Queens of Glory Bold F",
    "raw_name": "CELL 5 - Queens of Glory Bold F",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "d737442a-19ac-4f77-886e-953194b9c24c",
    "name": "5 - Queens of Glory Bold G",
    "raw_name": "CELL 5 - Queens of Glory Bold G",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 19
  },
  {
    "id": "da164102-b99a-43f4-89ff-26d047c145ae",
    "name": "5 - Queens of Glory Bold H                                                                      Lider:                            Sabina",
    "raw_name": "CELL 5 - Queens of Glory Bold H                                                                      Lider:                            Sabina",
    "group_id": "bee8d416-64f2-475a-871e-7cc07007c3a6",
    "group_name": "QOG",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 35
  },
  {
    "id": "f1b1ce1d-69b3-4228-85f4-ef9199fb61f4",
    "name": "Royal Sisters Main Cell",
    "raw_name": "Royal Sisters Main Cell",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 40
  },
  {
    "id": "91aa3517-bda0-4994-80cf-ac18e38fd258",
    "name": "Royal Sisters Victory",
    "raw_name": "Royal Sisters Victory",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 10
  },
  {
    "id": "86b28d6d-fe6e-4824-8ed4-d6343c7e93d2",
    "name": "Royal Sisters Opportunity",
    "raw_name": "Royal Sisters Opportunity",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "b0dcff46-7a79-493c-8a72-08ff59be1fcf",
    "name": "Royal Sisters Chosen",
    "raw_name": "Royal Sisters Chosen",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 37
  },
  {
    "id": "8ab90e0e-695e-4d2e-8a8f-49928c57fcab",
    "name": "Royal Sisters Perfection",
    "raw_name": "Royal Sisters Perfection",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 21
  },
  {
    "id": "20b37620-59cf-4be0-8329-43c62d4f7b32",
    "name": "Royal Sisters Divine",
    "raw_name": "Royal Sisters Divine",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 21
  },
  {
    "id": "abe6b452-279b-4313-85b7-d6a27440e691",
    "name": "Royal Sisters Brightness",
    "raw_name": "Royal Sisters Brightness",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 17
  },
  {
    "id": "689dcf32-b323-4bd0-8064-01eb13f74017",
    "name": "Royal Sisters Soul Seekers",
    "raw_name": "Royal Sisters Soul Seekers",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 21
  },
  {
    "id": "e701356b-ffd1-4b6e-8fdd-ffa913a5def5",
    "name": "Royal Sisters Reborn",
    "raw_name": "Royal Sisters Reborn",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "bbe34ebf-5598-4399-813b-16b51dc88568",
    "name": "Royal Sisters Rise & Shine",
    "raw_name": "Royal Sisters Rise & Shine",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 19
  },
  {
    "id": "9f4cb54e-14af-45d1-8c14-d98726b8efdd",
    "name": "Royal Sisters Zoe",
    "raw_name": "Royal Sisters Zoe",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 11
  },
  {
    "id": "365a0a68-e312-44b4-83da-51a3a74fca55",
    "name": "Royal Sisters Executives Main",
    "raw_name": "Royal Sisters Executives Main",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 25
  },
  {
    "id": "8ae3ef1a-4129-4753-827f-c43dc2c6b90a",
    "name": "Royal Sisters Executives Choices",
    "raw_name": "Royal Sisters Executives Choices",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "d1125340-1135-49f4-8d7d-ee6e79afc7f7",
    "name": "Royal Sisters Executives Bold",
    "raw_name": "Royal Sisters Executives Bold",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 21
  },
  {
    "id": "24da3f00-2787-4c99-83bf-e645e922a014",
    "name": "Royal Sister's Unlock Main",
    "raw_name": "Royal Sister's Unlock Main",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 37
  },
  {
    "id": "7de84c29-a36c-4f60-8d68-16677e33a1b7",
    "name": "Royal Sister's Unlock Precious",
    "raw_name": "Royal Sister's Unlock Precious",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 12
  },
  {
    "id": "bfa6d000-b31d-4d51-8cd0-515b3958600a",
    "name": "Royal Sister's Unlock Influence",
    "raw_name": "Royal Sister's Unlock Influence",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 16
  },
  {
    "id": "db37c16f-f4c2-412b-8c59-c8acc2a62c82",
    "name": "Royal Sister's Unlock Purpose",
    "raw_name": "Royal Sister's Unlock Purpose",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "221ad861-1a23-43b4-86e2-7dd0cf191e92",
    "name": "Royal Sister's Unlock Love",
    "raw_name": "Royal Sister's Unlock Love",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "84e66e35-7228-43a0-8555-94cf3c3d2b67",
    "name": "Royal Sister's Dominion Main",
    "raw_name": "Royal Sister's Dominion Main",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 23
  },
  {
    "id": "101ba0f1-fa12-4f11-8ce3-60ff2ee8284f",
    "name": "Royal Sister's Dominion Charis",
    "raw_name": "Royal Sister's Dominion Charis",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "ade63506-732c-4e04-8d01-533bed6f6f6d",
    "name": "Royal Sister's Dominion",
    "raw_name": "Royal Sister's Dominion",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 10
  },
  {
    "id": "7735ca38-242e-4065-8d4c-a0f0e61c4769",
    "name": "Royal Sisters Business Main",
    "raw_name": "Royal Sisters Business Main",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 10
  },
  {
    "id": "14148f3c-1b6d-4a40-8ec8-097885dbced0",
    "name": "Royal Sisters Business A1",
    "raw_name": "Royal Sisters Business A1",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 18
  },
  {
    "id": "176881d4-fe0d-468d-885a-94a8aeb97473",
    "name": "Royal Sisters Business A",
    "raw_name": "Royal Sisters Business A",
    "group_id": "121ae827-dc37-480c-8737-4733de33b7b9",
    "group_name": "Royal Sister",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "83336c21-1928-4d0c-8284-fcb88b770048",
    "name": "Visionarios Main",
    "raw_name": "Visionarios Main",
    "group_id": "f9f013c8-346f-4567-8911-762379b97d40",
    "group_name": "Visionarios",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 14
  },
  {
    "id": "1bb4b231-1aa6-4886-8210-f00631c1853c",
    "name": "WEALTH NATION MAIN",
    "raw_name": "WEALTH NATION MAIN",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 34
  },
  {
    "id": "cec82b24-048e-49e9-8cb0-19050977c3f2",
    "name": "WEALTH NATION TRANSFORMATION",
    "raw_name": "WEALTH NATION TRANSFORMATION",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 14
  },
  {
    "id": "482acb6d-a6b0-4e00-8563-0d11e9600969",
    "name": "WEALTH NATION TRANSFORMATION GRACED",
    "raw_name": "WEALTH NATION TRANSFORMATION GRACED",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "9f4c78e0-ce09-44f1-8948-bced22443274",
    "name": "WEALTH NATION HELPERS",
    "raw_name": "WEALTH NATION HELPERS",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "22f56676-972f-4199-8876-f45d56f7bfa5",
    "name": "WEALTH NATION ROYALTY",
    "raw_name": "WEALTH NATION ROYALTY",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 7
  },
  {
    "id": "73ea07f0-5396-4508-8c55-20e42b680cfd",
    "name": "WEALTH NATION ROYALTY CHOSEN",
    "raw_name": "WEALTH NATION ROYALTY CHOSEN",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 3
  },
  {
    "id": "2ca33011-3a3b-4bc2-8cba-5d7107a29267",
    "name": "WEALTH NATION AGAPE",
    "raw_name": "WEALTH NATION AGAPE",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "2e875516-95c8-437e-8fd7-bf9dbe656dd8",
    "name": "WEALTH NATION SALVATION",
    "raw_name": "WEALTH NATION SALVATION",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 3
  },
  {
    "id": "3fe8b30e-42f2-464d-805d-1f9255ff1c08",
    "name": "WEALTH NATION HOLY",
    "raw_name": "WEALTH NATION HOLY",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "b8f9e6ec-0b26-49cb-83d3-b880d5df6b54",
    "name": "WEALTH NATION HOLY VIRTUE",
    "raw_name": "WEALTH NATION HOLY VIRTUE",
    "group_id": "0689db79-05e3-439d-8664-666387c591dd",
    "group_name": "Wealth Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "22233c97-7ae2-449b-8c09-253ef0f7a05d",
    "name": "PAIS DE FE",
    "raw_name": "NOME CELULA: PAIS DE FE",
    "group_id": "0d7246a1-0afe-45a6-8489-e564668d0cd6",
    "group_name": "Pais da Fé",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 18
  },
  {
    "id": "7f0a74fd-d0d2-4f5c-8d92-860a541273ce",
    "name": "PAIS DE FE A",
    "raw_name": "NOME CELULA: PAIS DE FE A",
    "group_id": "0d7246a1-0afe-45a6-8489-e564668d0cd6",
    "group_name": "Pais da Fé",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "0e0183e2-857d-4d75-8373-fac4dfbf4334",
    "name": "NOME CELULA PAIS DE FE B",
    "raw_name": "NOME CELULA PAIS DE FE B",
    "group_id": "0d7246a1-0afe-45a6-8489-e564668d0cd6",
    "group_name": "Pais da Fé",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "b9b83a47-127f-49b3-88e6-f6b026c8d2ba",
    "name": "MAES DE FE",
    "raw_name": "MAES DE FE",
    "group_id": "0d7246a1-0afe-45a6-8489-e564668d0cd6",
    "group_name": "Pais da Fé",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 28
  },
  {
    "id": "00556da6-1b3d-4d17-8c8b-83dd2b09d83d",
    "name": "NOME CELULA PAIS DE FE NKOBE",
    "raw_name": "NOME CELULA PAIS DE FE NKOBE",
    "group_id": "0d7246a1-0afe-45a6-8489-e564668d0cd6",
    "group_name": "Pais da Fé",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "fb17d394-51de-4a8c-86c6-999a00819ca8",
    "name": "NOME CELULA PAIS DE FE NDLAVELA",
    "raw_name": "NOME CELULA PAIS DE FE NDLAVELA",
    "group_id": "0d7246a1-0afe-45a6-8489-e564668d0cd6",
    "group_name": "Pais da Fé",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "84dd56f9-b979-4b2e-84ae-854f49534ba9",
    "name": "PEROLAS DO REINO DIVINAS MAIN - ANTONIA PINTO",
    "raw_name": "Celula: PEROLAS DO REINO DIVINAS MAIN - ANTONIA PINTO",
    "group_id": "893e2625-2736-41be-802f-87ae6594cb68",
    "group_name": "Perolas do Reino",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 7
  },
  {
    "id": "45c7997d-e71c-44a8-8020-2834588560d9",
    "name": "PEROLAS DO REINO PAZ DE CRISTO - VERONICA MACUACUA",
    "raw_name": "Celula: PEROLAS DO REINO PAZ DE CRISTO - VERONICA MACUACUA",
    "group_id": "893e2625-2736-41be-802f-87ae6594cb68",
    "group_name": "Perolas do Reino",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 12
  },
  {
    "id": "373ad4e2-f339-479c-82bb-54f9aa7c50d0",
    "name": "PEROLAS DO REINO MAIN - EUNICE NHAVENE",
    "raw_name": "Celula: PEROLAS DO REINO MAIN - EUNICE NHAVENE",
    "group_id": "893e2625-2736-41be-802f-87ae6594cb68",
    "group_name": "Perolas do Reino",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "c07cac69-4293-4505-8bf9-984c86e014a9",
    "name": "PEROLAS DO REINO FAITH AND HOPE - MARILIA FERRÃO",
    "raw_name": "Celula: PEROLAS DO REINO FAITH AND HOPE - MARILIA FERRÃO",
    "group_id": "893e2625-2736-41be-802f-87ae6594cb68",
    "group_name": "Perolas do Reino",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 22
  },
  {
    "id": "b70ca193-f71f-48cc-82a1-23a24bee727b",
    "name": "PEROLAS DO REINO PERFEITAS - MERCI UBISSE",
    "raw_name": "Celula: PEROLAS DO REINO PERFEITAS - MERCI UBISSE",
    "group_id": "893e2625-2736-41be-802f-87ae6594cb68",
    "group_name": "Perolas do Reino",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 12
  },
  {
    "id": "1a122538-0753-4194-861d-508887be41c5",
    "name": "PEROLAS DO REINO DIVINAS - ABENCOADAS - PASCOA MALIPA",
    "raw_name": "Celula: PEROLAS DO REINO DIVINAS - ABENCOADAS - PASCOA MALIPA",
    "group_id": "893e2625-2736-41be-802f-87ae6594cb68",
    "group_name": "Perolas do Reino",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "bc355e31-af87-4184-823e-c80ef222c405",
    "name": "VANGUARD SHINE",
    "raw_name": "VANGUARD SHINE",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 10
  },
  {
    "id": "9e28dd3a-b65d-4e6c-8511-a7860b68a1ca",
    "name": "VANGUARD SHINE 1",
    "raw_name": "VANGUARD SHINE 1",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 11
  },
  {
    "id": "40a065bf-8918-45be-8c47-c45ff13a68e5",
    "name": "VANGUARD VISIONÁRIOS",
    "raw_name": "VANGUARD VISIONÁRIOS",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 15
  },
  {
    "id": "f0cbdbec-6756-40ad-8df1-29c7f71208a0",
    "name": "VANGUARD VISIONARIOS A",
    "raw_name": "VANGUARD VISIONARIOS A",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 21
  },
  {
    "id": "b64d6b8a-92f2-450a-8aab-94c207a8eece",
    "name": "VANGUARD VISIONARIOS A1",
    "raw_name": "VANGUARD VISIONARIOS A1",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "e154ad38-86ab-4d04-8321-e19009d2f9f1",
    "name": "VANGUARD VISIONARIOS B",
    "raw_name": "VANGUARD VISIONARIOS B",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "d0c9ad74-7e1b-4bc1-88f4-d205345982d5",
    "name": "VANGUARD VISIONARIOS B1",
    "raw_name": "VANGUARD VISIONARIOS B1",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "c50e4f28-9061-4e41-8235-0c00d48a81af",
    "name": "VANGUARD VISIONÁRIOS C",
    "raw_name": "VANGUARD VISIONÁRIOS C",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 6
  },
  {
    "id": "e5ea9bb5-b32e-4444-898a-f053af67ba7b",
    "name": "VANGUARD VISIONÁRIOS D",
    "raw_name": "VANGUARD VISIONÁRIOS D",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 38
  },
  {
    "id": "24809783-eb4f-498a-8bf5-b90ef15a1f47",
    "name": "VANGUARD VISIONÁRIOS D1",
    "raw_name": "VANGUARD VISIONÁRIOS D1",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "ea5ccf1f-9cfc-47dd-822e-bd4d2f3b58ce",
    "name": "VANGUARD GOLD",
    "raw_name": "VANGUARD GOLD",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 13
  },
  {
    "id": "6f05174c-cc2d-44d0-8a97-c098cf367c5e",
    "name": "VANGUARD STAR",
    "raw_name": "VANGUARD STAR",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "268a4ccb-5675-4a65-8a86-45ed8f0d6e73",
    "name": "Dorca",
    "raw_name": "Dorca",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "660f5255-3c8e-4b78-8bea-fc99b747a3d9",
    "name": "VANGUARD SHEEP 1",
    "raw_name": "VANGUARD SHEEP 1",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "98a5e102-76a4-4863-8501-18eafbcb92eb",
    "name": "VANGUARD MAIN",
    "raw_name": "VANGUARD MAIN",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 16
  },
  {
    "id": "91a511cc-375f-41f9-8262-80aa42453835",
    "name": "Orlando",
    "raw_name": "Orlando",
    "group_id": "24157e6a-959c-4e2f-8bca-d7b0bfe656c6",
    "group_name": "Vanguard",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "4453b7a1-10b2-4e4c-83c1-0ea3b521b01b",
    "name": "MIGHT WOMEN OF VALOR MAIN",
    "raw_name": "MIGHT WOMEN OF VALOR MAIN",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 32
  },
  {
    "id": "d5f16487-97fa-4009-85b6-8ad2fa96ab4b",
    "name": "PRECIOUS",
    "raw_name": "PRECIOUS",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 29
  },
  {
    "id": "14df8987-8b42-4d3d-8351-9b66eac6ddad",
    "name": "Teens of Wonders",
    "raw_name": "Teens of Wonders",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 18
  },
  {
    "id": "e5f030fb-6bc1-47dc-88e4-4bbe2b167b4f",
    "name": "Graced By Wisdon",
    "raw_name": "Graced By Wisdon",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 26
  },
  {
    "id": "caa50c40-d4fa-45a9-8a15-7c55a533dd21",
    "name": "Kairós",
    "raw_name": "Kairós",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 14
  },
  {
    "id": "f2cc2813-fb81-4fa5-8164-65f1889c399c",
    "name": "CROWNED WITH PURPOSE",
    "raw_name": "CROWNED WITH PURPOSE",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "0b3fbedb-3806-4ef7-813d-08c2008a44cf",
    "name": "SHINING LIGHT",
    "raw_name": "SHINING LIGHT",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 10
  },
  {
    "id": "ee2a1961-b9c6-44be-8bb2-2db135bc5ca8",
    "name": "TOW Pearls",
    "raw_name": "TOW Pearls",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 7
  },
  {
    "id": "e426b6be-0fb9-473b-8f76-acf1e431acf0",
    "name": "Phronesis",
    "raw_name": "Phronesis",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 7
  },
  {
    "id": "d00c4eaa-861d-4881-8cd1-25a3a6df40e9",
    "name": "Agape",
    "raw_name": "Agape",
    "group_id": "feaf54e9-043b-414a-80bf-b1e8fcf704de",
    "group_name": "MWV",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "1e3ffef2-fbbe-4f1c-86ab-1f501d836468",
    "name": "MBZ MAIN",
    "raw_name": "MBZ MAIN",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 21
  },
  {
    "id": "f80dbd68-54f4-45c4-8502-be9434c91093",
    "name": "MBZ  A",
    "raw_name": "MBZ  A",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "fcb63835-ef80-4a52-87f8-2534b0fb5162",
    "name": "MBZ B",
    "raw_name": "MBZ B",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "4b796d28-f620-4ab6-8dbf-0049525b1849",
    "name": "MBZ C",
    "raw_name": "MBZ C",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 19
  },
  {
    "id": "bc940a79-b41d-4a9d-8bad-9d4169b4124f",
    "name": "MBZ F",
    "raw_name": "MBZ F",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "bb94c701-bbd1-48ea-8f5a-d623b4b3d967",
    "name": "MBZ H",
    "raw_name": "MBZ H",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "6714e01a-2ba1-4f6a-8935-6fefefa3b58e",
    "name": "MBZ I",
    "raw_name": "MBZ I",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "0cac7c66-6fd9-46ba-8cb0-582d718e2597",
    "name": "DISCOVERY MAIN",
    "raw_name": "DISCOVERY MAIN",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "ebfc6d6d-bfe3-458a-81f5-1083e5577fd4",
    "name": "EXECUTIVAS",
    "raw_name": "EXECUTIVAS",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 7
  },
  {
    "id": "03b4b3a2-9faa-4f2c-8376-8e5958894599",
    "name": "THE BEAUTIE OF ZION A-1",
    "raw_name": "THE BEAUTIE OF ZION A-1",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 15
  },
  {
    "id": "5478c07e-2c9f-4b54-89ae-d25c919b7846",
    "name": "LIONESS B",
    "raw_name": "LIONESS B",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 3
  },
  {
    "id": "0a0ddf14-a6b2-4990-8cbc-5614b2b8c5db",
    "name": "NACAO DE HEROIS",
    "raw_name": "NACAO DE HEROIS",
    "group_id": "875df2c2-ad72-45cb-823d-c196aa54c4fb",
    "group_name": "Zion Nation",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "3a25f105-ccf5-4636-871f-36ff9e57d1a5",
    "name": "Dominio Main",
    "raw_name": "Celula: Dominio Main",
    "group_id": "9b9f457d-d5da-4ff7-8862-381b41d51396",
    "group_name": "Dominio",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 18
  },
  {
    "id": "1613e84d-ab6e-424e-83f8-38d4784dfdcf",
    "name": "TRANSFORMADAS",
    "raw_name": "Celula: TRANSFORMADAS",
    "group_id": "f903cb5f-60b2-4fb4-86ac-5712b6578205",
    "group_name": "Transformada",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 50
  },
  {
    "id": "116f370a-295a-43a8-88ca-06547ee627d9",
    "name": "Agathos Main",
    "raw_name": "Agathos Main",
    "group_id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "group_name": "Agathos",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 15
  },
  {
    "id": "d588fd25-bf80-4cb0-8408-f4983756e6c0",
    "name": "Agathos Excellence",
    "raw_name": "Agathos Excellence",
    "group_id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "group_name": "Agathos",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 14
  },
  {
    "id": "065431f7-9f6e-4ea4-8e0d-6c66f8c1cf01",
    "name": "Agathos Light",
    "raw_name": "Agathos Light",
    "group_id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "group_name": "Agathos",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 10
  },
  {
    "id": "2040dd91-bb7f-4b48-845a-1e34cdf7e341",
    "name": "Agathos Purpose",
    "raw_name": "Agathos Purpose",
    "group_id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "group_name": "Agathos",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "a6a261b0-7449-4a03-8688-de8900ab3f01",
    "name": "Agathos Virtous",
    "raw_name": "Agathos Virtous",
    "group_id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "group_name": "Agathos",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "b55da432-0578-4785-835f-b5af2076bd23",
    "name": "Agathos Purpose A",
    "raw_name": "Agathos Purpose A",
    "group_id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "group_name": "Agathos",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "6ea895de-4d12-4ece-8dda-0dd8d81e45da",
    "name": "Agathos Eagles",
    "raw_name": "Agathos Eagles",
    "group_id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "group_name": "Agathos",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "27d3d4bb-6756-4617-80e0-964d31b9db71",
    "name": "Agathos Light A",
    "raw_name": "Agathos Light A",
    "group_id": "b739d946-c9ed-4a1a-89ea-56157a7b1176",
    "group_name": "Agathos",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 6
  },
  {
    "id": "7801e558-0932-464b-8755-95510ef83073",
    "name": "Pioneiros Sub Grace",
    "raw_name": "Pioneiros Sub Grace",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "b0f81453-6495-439a-85f1-5f64bb118117",
    "name": "Pioneiros Sub Grace the choosen",
    "raw_name": "Pioneiros Sub Grace the choosen",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 3
  },
  {
    "id": "ab656b71-4dbd-49ff-8b46-8bfeca8c3904",
    "name": "Pioneiros Sub Grace Intrépidos",
    "raw_name": "Pioneiros Sub Grace Intrépidos",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "5e312370-2fec-4126-8c4c-3a3bd0d8ac7e",
    "name": "Pioneiros Substance Power",
    "raw_name": "Pioneiros Substance Power",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 31
  },
  {
    "id": "9d363fff-19d3-4cb8-8d28-11049985a328",
    "name": "Pioneiros Multitude",
    "raw_name": "Pioneiros Multitude",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "7341300c-9701-4111-85c7-222581ceed10",
    "name": "PIONEIROS SUBSTANCE ACE",
    "raw_name": "PIONEIROS SUBSTANCE ACE",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 6
  },
  {
    "id": "d1d63db2-8e16-46a4-801b-1be0cc524894",
    "name": "PIONEIROS SUBSTANCE CHARIS",
    "raw_name": "PIONEIROS SUBSTANCE CHARIS",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 41
  },
  {
    "id": "e25ecaa6-7f94-46b8-8af9-824b8a08e180",
    "name": "PIONEIROS CHARIS ATALAIA",
    "raw_name": "PIONEIROS CHARIS ATALAIA",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 15
  },
  {
    "id": "8949f6f9-da83-4f15-8738-1db37f070670",
    "name": "PIONEIROS CHARIS EXCELENTES",
    "raw_name": "PIONEIROS CHARIS EXCELENTES",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 15
  },
  {
    "id": "86fb9060-e403-43a5-8ee2-3ae79efb1f81",
    "name": "PIONEIROS CHARIS ALCANCADOS",
    "raw_name": "PIONEIROS CHARIS ALCANCADOS",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 13
  },
  {
    "id": "17de71f5-1926-4b34-8cc6-4c690c3c0262",
    "name": "Pioneiros Change",
    "raw_name": "Pioneiros Change",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "7f9407c2-802f-4841-806b-3be64623be06",
    "name": "Pioneiros Substance Of Faith",
    "raw_name": "Pioneiros Substance Of Faith",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 3
  },
  {
    "id": "905f4695-d681-432c-80c9-36085b5d14fd",
    "name": "Pioneiros ASAH",
    "raw_name": "Pioneiros ASAH",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 6
  },
  {
    "id": "cfeb3d06-1539-4eb1-8c06-16704cb20a04",
    "name": "Excellence MAIN",
    "raw_name": "Excellence MAIN",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 12
  },
  {
    "id": "3bb5b487-6770-4a42-8171-330e9a4e9203",
    "name": "Pioneiros Excellence Shining",
    "raw_name": "Pioneiros Excellence Shining",
    "group_id": "ef444bdd-cac5-4f0e-89f8-08d37e97a947",
    "group_name": "Pioneiro",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "ad30e570-362f-4d00-8367-36bd41c67663",
    "name": "Blossom Main: Stela Jaqueta",
    "raw_name": "Blossom Main: Stela Jaqueta",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 25
  },
  {
    "id": "3749602f-2f92-43a3-8db5-e96ee8a7a438",
    "name": "Blossom Diamante Main: Cristina Malauene",
    "raw_name": "Blossom Diamante Main: Cristina Malauene",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 13
  },
  {
    "id": "1e50bb20-ec9d-4358-873a-83b96b2a093e",
    "name": "Blossom Diamante A: Telma Santana",
    "raw_name": "Blossom Diamante A: Telma Santana",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "752ead16-d25b-4c23-8f12-8e879089b29a",
    "name": "Blossom Diamante B: Gervasia Lapone",
    "raw_name": "Blossom Diamante B: Gervasia Lapone",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 6
  },
  {
    "id": "959cd9dc-e99e-4ad9-88f5-3a7f81340863",
    "name": "Blossom Diamante C: Salito Jose",
    "raw_name": "Blossom Diamante C: Salito Jose",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 7
  },
  {
    "id": "e8600e4b-b403-449f-88e6-da373589b511",
    "name": "Blossom Diamante C1:Araujo",
    "raw_name": "Blossom Diamante C1:Araujo",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 3
  },
  {
    "id": "c01413e9-010b-496d-87aa-565056af2e81",
    "name": "Blossom Diamante C2:Elisa Bernardo",
    "raw_name": "Blossom Diamante C2:Elisa Bernardo",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "3787d0e9-1adf-4404-83fa-439882c1aaae",
    "name": "Blossom Diamante C3:Fernando Caetano",
    "raw_name": "Blossom Diamante C3:Fernando Caetano",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 6
  },
  {
    "id": "eaf2e413-43c2-4400-879f-83c2e8cf153b",
    "name": "Blossom Perfection  Main: Francisca Nobre",
    "raw_name": "Blossom Perfection  Main: Francisca Nobre",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 8
  },
  {
    "id": "b2a2656b-56d7-4fd6-830d-052cbc87d70d",
    "name": "Blossom Perfection  Main for The Nations: Maria Telma  Matsinhe",
    "raw_name": "Blossom Perfection  Main for The Nations: Maria Telma  Matsinhe",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 4
  },
  {
    "id": "e4af825c-204a-4353-82bc-8f35992d5d1c",
    "name": "Blossom Perfection A: Sheila Sitoe",
    "raw_name": "Blossom Perfection A: Sheila Sitoe",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 5
  },
  {
    "id": "01c8e2bc-9f89-440a-862a-7413d8bd1393",
    "name": "Blossom Perfection B: Nelia Boane",
    "raw_name": "Blossom Perfection B: Nelia Boane",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 7
  },
  {
    "id": "65cfb1cb-d102-429d-8867-47854e87a27e",
    "name": "Blossom Perfection C3: Marilia Magingane",
    "raw_name": "Blossom Perfection C3: Marilia Magingane",
    "group_id": "334021eb-7658-4e26-8239-1a4f5c80409d",
    "group_name": "Blossom",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 3
  },
  {
    "id": "49bd9760-bc0b-4111-813f-0519580a2e31",
    "name": "PHRONESIS BUSINESS Main",
    "raw_name": "PHRONESIS BUSINESS Main",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 67
  },
  {
    "id": "9ac9bffc-8036-400a-84ff-e3eefa3caa86",
    "name": "PHRONESIS BUSINESS A",
    "raw_name": "PHRONESIS BUSINESS A",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "d8a9a021-630e-4361-8c83-03d0fa292e0e",
    "name": "PHRONESIS BUSINESS WELLNESS",
    "raw_name": "PHRONESIS BUSINESS WELLNESS",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "bab421f0-e77a-4802-8899-49694cd07c5a",
    "name": "PHRONESIS BUSINESS DYNAMIC",
    "raw_name": "PHRONESIS BUSINESS DYNAMIC",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "d534e074-ebee-444c-8aaf-4418166a69d8",
    "name": "PHRONESIS BUSINESS LIGHT IF LIFE",
    "raw_name": "PHRONESIS BUSINESS LIGHT IF LIFE",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "f09a13f8-6f9d-4416-8009-6eb9c9e96167",
    "name": "PHRONESIS BUSINESS CONQUERORS",
    "raw_name": "PHRONESIS BUSINESS CONQUERORS",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "51fe5fd7-dc26-4a53-86a4-641e42105ed8",
    "name": "PHRONESIS BUSINESS LIGHT",
    "raw_name": "PHRONESIS BUSINESS LIGHT",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 2
  },
  {
    "id": "fb0c698b-43ad-42cf-810f-005b42d5e94b",
    "name": "PHRONESIS CHAMPIONS Main",
    "raw_name": "PHRONESIS CHAMPIONS Main",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 9
  },
  {
    "id": "795d5ff5-30c1-417a-8feb-6b8161b069b2",
    "name": "PHRONESIS CHAMPIONS A",
    "raw_name": "PHRONESIS CHAMPIONS A",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 11
  },
  {
    "id": "b6454d99-bdcb-41df-8902-be1540f5819e",
    "name": "PHRONESIS CHAMPIONS B",
    "raw_name": "PHRONESIS CHAMPIONS B",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 6
  },
  {
    "id": "bb4c9e75-decf-4642-8474-a2bcee68f4d9",
    "name": "PHRONESIS CHAMPIONS C",
    "raw_name": "PHRONESIS CHAMPIONS C",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "b628e18d-6a71-4990-86d3-eb673d8dcb1e",
    "name": "PHRONESIS CHAMPIONS D",
    "raw_name": "PHRONESIS CHAMPIONS D",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "bcaad2fd-965e-4ee9-87d3-0958bf6670ed",
    "name": "PHRONESIS CHAMPIONS E",
    "raw_name": "PHRONESIS CHAMPIONS E",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "b4d911c5-ba09-4728-89be-0d4a732eb4d5",
    "name": "PHRONESIS DOERS Main",
    "raw_name": "PHRONESIS DOERS Main",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 15
  },
  {
    "id": "07834946-ea1b-49fe-84f1-d42b145bf169",
    "name": "PHRONESIS DOERS A",
    "raw_name": "PHRONESIS DOERS A",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 12
  },
  {
    "id": "136c6941-5cd0-4045-8cf2-d50b177e39cb",
    "name": "PHRONESIS DOERS B",
    "raw_name": "PHRONESIS DOERS B",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 3
  },
  {
    "id": "f9a3a858-3c64-480d-8139-d1373283e32d",
    "name": "PHRONESIS DOERS C",
    "raw_name": "PHRONESIS DOERS C",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "160d15d8-823a-4fff-8c72-bc333bc7dba2",
    "name": "PHRONESIS DOERS D",
    "raw_name": "PHRONESIS DOERS D",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "9e6e5e02-2dfd-4913-8adb-e2807e0da9bb",
    "name": "PHRONESIS DOERS E",
    "raw_name": "PHRONESIS DOERS E",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "e1e69c09-5d69-4590-83b2-d5ec4d69d08d",
    "name": "PHRONESIS DOERS E1",
    "raw_name": "PHRONESIS DOERS E1",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "d8b2c99a-2674-426b-89bb-4aa9860b57fe",
    "name": "PHRONESIS DOERS H",
    "raw_name": "PHRONESIS DOERS H",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "49dedfb2-872b-4278-85a4-84ef94c9789c",
    "name": "PHRONESIS DOERS I",
    "raw_name": "PHRONESIS DOERS I",
    "group_id": "a5c43304-7278-4dcd-8081-87bb2c11fbfd",
    "group_name": "Phronesis",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 1
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000001",
    "name": "Diamantes main",
    "raw_name": "Diamantes main",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000002",
    "name": "Diamantes A",
    "raw_name": "Diamantes A",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000003",
    "name": "Diamantes A1",
    "raw_name": "Diamantes A1",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000004",
    "name": "Diamantes A1 Teens",
    "raw_name": "Diamantes A1 Teens",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000005",
    "name": "Diamantes B",
    "raw_name": "Diamantes B",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000006",
    "name": "Diamantes Visionarios",
    "raw_name": "Diamantes Visionarios",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000007",
    "name": "Diamantes Visionarios 1",
    "raw_name": "Diamantes Visionarios 1",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000008",
    "name": "Diamantes Visionarios 2",
    "raw_name": "Diamantes Visionarios 2",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000009",
    "name": "Diamantes Queens",
    "raw_name": "Diamantes Queens",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  },
  {
    "id": "d1a00000-d1a0-4000-8000-000000000010",
    "name": "Diamantes E",
    "raw_name": "Diamantes E",
    "group_id": "d1a00000-0000-4000-8000-000000000001",
    "group_name": "Diamantes Main",
    "church_id": "a1111111-1111-4111-8111-111111111101",
    "church_name": "E.C. Maputo Central - Sede",
    "member_count": 0
  }
];

  function buildCellGroupsSeed() {
    const cellGroups = REAL_CELL_GROUPS.map((g) => ({
      id: g.id,
      name: g.name,
      group_name: g.name,
      church_id: g.church_id,
      church_name: g.church_name,
      total_cells: g.total_cells,
      total_members: g.total_members,
      status: "Activo"
    }));

    const cellRegistry = REAL_CELLS_REGISTRY.map((c) => ({
      id: c.id,
      name: c.name,
      cell_name: c.name,
      raw_cell_name: c.raw_name,
      group_id: c.group_id,
      cell_group_id: c.group_id,
      group_name: c.group_name,
      cell_group_name: c.group_name,
      church_id: c.church_id,
      church_name: c.church_name,
      member_count: c.member_count,
      status: "Activo"
    }));

    return { cellGroups, cellRegistry };
  }

  const root = typeof window !== "undefined" ? window : globalThis;
  root.buildCellGroupsSeed = buildCellGroupsSeed;
  root.REAL_CELL_GROUPS = REAL_CELL_GROUPS;
  root.REAL_CELLS_REGISTRY = REAL_CELLS_REGISTRY;
})();
