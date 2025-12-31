import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [uni()],
  css: {
    preprocessorOptions: {
      scss: {
        // Suppress deprecation warnings for modern Sass
        // legacy-js-api: due to Vite/Sass integration
        // import: due to uview-plus using @import
        silenceDeprecations: ["legacy-js-api", "import"],
        api: 'modern-compiler' // Optional: trigger modern compiler
      }
    }
  }
});
