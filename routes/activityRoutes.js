const express = require("express");
const router = express.Router();

const {
  getRecentActivities,
  clearActivities,
  deleteActivity
} = require("../controllers/activityController");

const authMiddleware = require("../middleware/authMiddleware");




router.get("/", authMiddleware, getRecentActivities);


router.delete("/clear", authMiddleware, clearActivities);
router.delete("/:id", authMiddleware, deleteActivity);
module.exports = router;