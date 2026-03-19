import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000', // Đảm bảo cổng này khớp với cổng chạy code React của bạn
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});