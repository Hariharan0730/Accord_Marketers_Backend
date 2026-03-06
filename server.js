const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const startCronJob = require("./utils/cronJob");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config();
connectDB();

const app = express();
startCronJob();


const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

app.set("io", io);


app.use(helmet());
app.disable("x-powered-by");


app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many attempts, try again later",
});


const blogRoutes = require("./routes/blogRoutes");
const adminRoutes = require("./routes/adminRoutes");
const activityRoutes = require("./routes/activityRoutes");
const caseStudyRoutes = require("./routes/caseStudyRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const contactRoutes = require("./routes/contactRoutes"); 

app.use("/api/contact", contactRoutes);
app.use("/api/admin/login", authLimiter);
app.use("/api/admin/forgot-password", authLimiter);

app.use("/api/blogs", blogRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/case-studies", caseStudyRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/contact", contactRoutes);


app.get("/", (req, res) => {
  res.send("Accord Marketers API Running");
});

const PORT = process.env.PORT || 5000;


server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});