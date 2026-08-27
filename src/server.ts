import app from "./app.js";
import { env } from "./config/env.js";

const startServer = () => {
  app.listen(env.PORT, () => {
    console.log(
      `AI Agent Service running at http://localhost:${env.PORT}`
    );
  });
};

startServer();