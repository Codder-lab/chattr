import app from "./src/app";
import { connectDB } from "./src/config/database";

const PORT = process.env.port || 3000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is up and running on PORT ${PORT}`);
  });
});
