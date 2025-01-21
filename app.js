require("dotenv").config();

const express = require("express");
const connectToDatabase = require("./config/database");
const userRouter = require("./routes/userRoutes");
const postRouter = require("./routes/postRoutes");
const commentRouter = require("./routes/commentRoutes");
const corsMiddleware = require("./middleware/corsHandler");

connectToDatabase();

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", userRouter);
app.use("/api/feed", postRouter);
app.use("/api/comments", commentRouter);

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`The server is running on port:${PORT}`);
});
