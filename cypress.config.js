import { defineConfig } from "cypress";

export default defineConfig({
  allowCypressEnv: false,

  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        // return true if the HTTP GET to the given URL succeeds, false otherwise
        checkServer(url) {
          const http = require('http');
          return new Promise((resolve) => {
            const req = http.get(url, { timeout: 2000 }, (res) => {
              // any response indicates server is up
              resolve(true);
              req.destroy();
            });
            req.on('error', () => resolve(false));
            req.on('timeout', () => {
              req.destroy();
              resolve(false);
            });
          });
        }
      });
      return config;
    },
  },
});
