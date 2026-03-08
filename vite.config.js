import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            //
        },
    },
    // optimizeDeps: {
    //
    // },
    build: {
        chunkSizeWarningLimit: 2000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("three")) {
                        return "vendor-three";
                    } else if (id.includes("node_modules")) {
                        return "vendor";
                    }

                    return null;
                },
            },
        },
    },
});
