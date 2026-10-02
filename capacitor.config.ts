import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.waguri.kaoruko",
  appName: "Waguri Kaoruko",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
