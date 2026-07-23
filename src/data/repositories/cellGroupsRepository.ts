/** Thin re-export — group methods live in cellMinistryRepository. */
export {
  listCellGroups,
  getCellGroupById,
  createCellGroup,
  updateCellGroup,
  deleteCellGroup,
  searchCellGroups,
  getCellGroupsByChurch,
  getActiveCellGroups,
  getCellGroupsNeedingReview,
  normalizeCellGroup,
} from "./cellMinistryRepository";
