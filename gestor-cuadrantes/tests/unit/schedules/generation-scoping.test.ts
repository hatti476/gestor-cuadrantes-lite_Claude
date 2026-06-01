import { describe, expect, it } from "vitest";
import { scopeRowsToProject } from "@/lib/schedules/generation-scoping";

describe("scopeRowsToProject", () => {
  it("keeps only assignments of the active project", () => {
    const rows = [
      { employeeId: "e1", projectId: "project-a" },
      { employeeId: "e1", projectId: "project-b" },
      { employeeId: "e2", projectId: null },
    ];

    const scoped = scopeRowsToProject(rows, "project-b");

    expect(scoped).toEqual([{ employeeId: "e1", projectId: "project-b" }]);
  });

  it("returns all rows when no project is provided", () => {
    const rows = [
      { employeeId: "e1", projectId: "project-a" },
      { employeeId: "e2", projectId: null },
    ];

    const scoped = scopeRowsToProject(rows, null);

    expect(scoped).toEqual(rows);
  });
});
