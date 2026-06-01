export type ProjectScopedRow = {
  projectId: string | null;
};

// Keep assignment reads isolated to the active project so data from other projects
// cannot lock cells and create gaps during generation.
export function scopeRowsToProject<T extends ProjectScopedRow>(
  rows: T[],
  projectId?: string | null
): T[] {
  if (!projectId) return rows;
  return rows.filter((row) => row.projectId === projectId);
}
