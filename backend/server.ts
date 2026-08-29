import app from "./src/app";
import { config } from "./src/config/config";
import connectDB from "./src/config/db";

const startServer = async () => {
  const port = config.port || 3000;
  
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
    console.log(`Health check: http://localhost:${port}/health`);
  });

  // Connect database asynchronously
  await connectDB();
};

startServer();

