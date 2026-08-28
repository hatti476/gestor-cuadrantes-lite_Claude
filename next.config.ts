import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Permite usar un directorio de build alternativo via NEXT_DIST_DIR.
  // El servidor de tests E2E usa NEXT_DIST_DIR=.next-test para no
  // colisionar con el servidor de desarrollo en .next (puerto 3000).
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
