import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173, // User project runs here
    proxy: {
      '/face-api': 'http://localhost:5001'
    }
    
  },
});
