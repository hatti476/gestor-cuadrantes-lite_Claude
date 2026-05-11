/** Tipos compartidos para proyectos y miembros */

export interface Project {
  id: string;
  name: string;
  description: string | null;
  region: string | null;
  createdAt: string;
  _count?: { members: number; employees: number };
}

export interface ProjectMemberUser {
  id: string;
  email: string;
  role: string; // SUPER_ADMIN | USER
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string; // PROJECT_ADMIN | EMPLOYEE
  user: ProjectMemberUser;
}

export interface ProjectDetail extends Project {
  members: ProjectMember[];
}
