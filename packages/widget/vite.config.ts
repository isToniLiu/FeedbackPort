import { resolve } from "node:path";
import { defineConfig } from "vite";

// 打包成单文件 IIFE，任意宿主页面一个 <script> 标签即可用，见 docs/INTEGRATION.md
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/main.ts"),
      name: "FeedbackPortWidget",
      formats: ["iife"],
      fileName: () => "widget.js",
    },
    outDir: "dist",
  },
});
