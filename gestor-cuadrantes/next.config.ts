import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Fuerza la raíz del workspace al directorio del proyecto,
    // evitando que Next.js use el package-lock.json del directorio padre
    root: __dirname,
  },
};

export default nextConfig;
