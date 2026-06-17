import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "logo192.png", "logo512.png"],
      manifest: {
        name: "ParkSys – Parking Management System",
        short_name: "ParkSys",
        description: "Campus Parking Management System",
        theme_color: "#0F172A",
        background_color: "#0F172A",
        display: "standalone",
        orientation: "portrait-primary",
        scope: "/",
        start_url: "/",
        categories: ["productivity", "utilities"],
        shortcuts: [
          { name: "Dashboard", short_name: "Dashboard", url: "/admin", icons: [{ src: "/logo192.png", sizes: "192x192" }] },
          { name: "Buildings", short_name: "Buildings", url: "/admin/buildings", icons: [{ src: "/logo192.png", sizes: "192x192" }] },
        ],
        icons: [
          { src: "logo192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "logo512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "google-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: "CacheFirst",
            options: { cacheName: "gstatic-fonts-cache", expiration: { maxEntries: 10, maxAgeSeconds: 31536000 } },
          },
          {
            urlPattern: /^http:\/\/localhost:5000\/api\/.*/i,
            handler: "NetworkFirst",
            options: { cacheName: "api-cache", networkTimeoutSeconds: 10, expiration: { maxEntries: 100, maxAgeSeconds: 300 } },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      "/api": { target: "http://localhost:5000", changeOrigin: true },
    },
  },
});
