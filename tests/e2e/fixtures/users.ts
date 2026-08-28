import { USERS } from "../config";

export const TEST_USERS = {
  super_admin: USERS.admin,
  project_admin: USERS.pm,
  super_viewer: USERS.viewer,
  viewer: USERS.tech,
} as const;
