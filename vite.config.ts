import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  server: {
    host: true,
    port: 8080,
    proxy: {
      '/api/pncp': {
        target: 'https://pncp.gov.br/api/pncp',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pncp/, '')
      },
      '/api/consulta': {
        target: 'https://pncp.gov.br/api/consulta',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/consulta/, '')
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
