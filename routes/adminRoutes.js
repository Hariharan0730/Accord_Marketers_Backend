const express = require("express");
const router = express.Router();

const {
    loginAdmin,
    changePassword,
    forgotPassword,
    resetPassword,
    registerAdmin,
    getProfile,
    updateProfile
} = require("../controllers/adminController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");



router.put("/change-password", authMiddleware, changePassword);



router.post("/register", registerAdmin);
router.post("/login", loginAdmin);



router.get("/profile", authMiddleware, getProfile);

router.put(
  "/profile",
  authMiddleware,
  upload.single("profileImage"),
  updateProfile
);



router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;