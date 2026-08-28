/**
 * Unit tests for lib/schedules/coverage.ts
 * Sprint 20 — Task 5: Tests for extracted modules
 */

import { describe, it, expect } from "vitest";
import { evaluateDayCoverage } from "../../../lib/schedules/coverage";

describe("coverage — evaluateDayCoverage", () => {
  it("hardMet false when no M shift on workday", () => {
    const date = new Date(Date.UTC(2026, 0, 5)); // Monday
    const result = evaluateDayCoverage(date, 0, 1, 5, false);
    expect(result.hardMet).toBe(false);
  });

  it("hardMet false when no T shift on workday", () => {
    const date = new Date(Date.UTC(2026, 0, 5));
    const result = evaluateDayCoverage(date, 1, 0, 5, false);
    expect(result.hardMet).toBe(false);
  });

  it("hardMet true when 1M+1T on workday", () => {
    const date = new Date(Date.UTC(2026, 0, 5));
    const result = evaluateDayCoverage(date, 1, 1, 5, false);
    expect(result.hardMet).toBe(true);
  });

  it("softMet false when only 1M+1T (below soft target 2+2)", () => {
    const date = new Date(Date.UTC(2026, 0, 5));
    const result = evaluateDayCoverage(date, 1, 1, 5, false);
    expect(result.softMet).toBe(false);
  });

  it("softMet true when 2M+2T on workday", () => {
    const date = new Date(Date.UTC(2026, 0, 5));
    const result = evaluateDayCoverage(date, 2, 2, 5, false);
    expect(result.softMet).toBe(true);
  });

  it("hardMet false with 0M+0T on weekend", () => {
    const date = new Date(Date.UTC(2026, 0, 3)); // Saturday
    const result = evaluateDayCoverage(date, 0, 0, 5, true);
    expect(result.hardMet).toBe(false);
  });

  it("hardMet true with 1M+1T on weekend", () => {
    const date = new Date(Date.UTC(2026, 0, 3)); // Saturday
    const result = evaluateDayCoverage(date, 1, 1, 5, true);
    expect(result.hardMet).toBe(true);
  });

  it("returns no warnings when coverage is met", () => {
    const date = new Date(Date.UTC(2026, 0, 5));
    const result = evaluateDayCoverage(date, 2, 2, 5, false);
    expect(result.warnings).toHaveLength(0);
  });

  it("returns warnings when hard coverage is not met", () => {
    const date = new Date(Date.UTC(2026, 0, 5));
    const result = evaluateDayCoverage(date, 0, 1, 5, false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
