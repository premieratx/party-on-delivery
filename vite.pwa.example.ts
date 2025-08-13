import { VitePWA } from "vite-plugin-pwa";

export const pwa = VitePWA({
  registerType: "autoUpdate",
  manifest: "/public/manifest.webmanifest",
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
    navigateFallbackDenylist: [/^\/api\//],
  },
});
