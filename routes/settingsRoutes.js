const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const {
    getSettings,
    updateWebsiteSettings,
    updateEmailSettings,
    clearActivityLogs,
} = require("../controllers/settingsController");
const authMiddleware = require("../middleware/authMiddleware");

router.get("/public", getSettings);
router.get("/", authMiddleware, getSettings);

router.put("/website", authMiddleware, updateWebsiteSettings);

router.put("/email", authMiddleware, updateEmailSettings);

router.delete("/clear-logs", authMiddleware, clearActivityLogs);
module.exports = router;