/**
 * Cell Groups & Cell Registry seed builder.
 * Based on Cell Report July Week 1 group structure.
 * Attached to window for frontend-first dashboard bootstrap.
 */
(function () {
  const CELL_GROUP_DEFINITIONS = [
    { name: "Royal Sister", total_cells: 25 },
    { name: "Phronesis", total_cells: 22 },
    { name: "Pioneiro", total_cells: 15 },
    { name: "Blossom", total_cells: 13 },
    { name: "Zion Nation", total_cells: 12 },
    { name: "MWV", total_cells: 10 },
    { name: "Wealth Nation", total_cells: 10 },
    { name: "Estrelas de Siao", total_cells: 9 },
    { name: "Agathos", total_cells: 8 },
    { name: "Diplomatas", total_cells: 7 },
    { name: "Perolas do Reino", total_cells: 6 },
    { name: "QOG", total_cells: 4 },
    { name: "Vanguard", total_cells: 4 },
    { name: "Pais da Fé", total_cells: 2 },
    { name: "Dominio", total_cells: 1 },
    { name: "Transformada", total_cells: 1 },
    { name: "Visionarios", total_cells: 1 }
  ];

  const GROUP_STATUSES = ["Activo", "Em Crescimento", "Precisa de Ateno", "Inactivo"];
  const LEADER_TITLES = ["Irmo", "Irm", "Pastor", "Dicono"];

  function buildCellGroupsSeed() {
    const cellGroups = [];
    const cellRegistry = [];
    let cellSeq = 1;

    CELL_GROUP_DEFINITIONS.forEach((def, index) => {
      const groupId = `cg-${String(index + 1).padStart(3, "0")}`;
      const status = index % 11 === 0
        ? "Inactivo"
        : index % 7 === 0
          ? "Precisa de Aten��o"
          : index % 4 === 0
            ? "Em Crescimento"
            : "Activo";
      const membersPerCell = 7 + (index % 6);
      const leaderName = index % 3 === 0 ? `Líder ${def.name.split(" ")[0]}` : "";

      cellGroups.push({
        id: groupId,
        group_name: def.name,
        leader_name: leaderName,
        church_id: "church-hq",
        total_cells: def.total_cells,
        total_members: def.total_cells * membersPerCell,
        status,
        responsible_area: "Sister Eduarda / Cell Reports",
        needs_review: Boolean(def.needs_review),
        created_by: "Sister Eduarda",
        updated_by: "Sister Eduarda",
        created_at: "2026-07-01",
        updated_at: "2026-07-10"
      });

      for (let i = 1; i <= def.total_cells; i += 1) {
        const seed = index * 17 + i * 3;
        const attendance = 5 + (seed % 16);
        const firstTimers = seed % 4;
        const newConverts = seed % 3;
        const offering = 350 + attendance * 90 + firstTimers * 110;
        const rs = Math.max(1, Math.floor(attendance / 5));
        const cellStatus = status === "Precisa de Aten��o" && i % 2 === 0
          ? "Precisa de Aten��o"
          : status === "Inactivo"
            ? "Inactivo"
            : "Activo";

        cellRegistry.push({
          id: `cr-${String(cellSeq).padStart(4, "0")}`,
          cell_name: `${def.name} ${i}`,
          group_id: groupId,
          group_name: def.name,
          leader_title: LEADER_TITLES[seed % LEADER_TITLES.length],
          leader_name: leaderName || `Líder ${i}`,
          church_id: "church-hq",
          attendance,
          first_timers: firstTimers,
          new_converts: newConverts,
          offering,
          rs,
          observation: firstTimers + newConverts >= 4 ? "EXPLOSAO - pronta para multiplica��o." : "",
          status: cellStatus,
          report_week: "Julho Semana 1",
          created_by: "Sister Eduarda",
          updated_by: "Sister Eduarda",
          created_at: "2026-07-05",
          updated_at: "2026-07-10"
        });
        cellSeq += 1;
      }
    });

    return { cellGroups, cellRegistry };
  }

  window.buildCellGroupsSeed = buildCellGroupsSeed;
})();