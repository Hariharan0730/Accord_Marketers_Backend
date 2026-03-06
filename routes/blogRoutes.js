const express = require("express");
const router = express.Router();

const {
  getAllBlogs,
  getSingleBlog,
  createBlog,
  updateBlog,
  deleteBlog,
  toggleFeatured,
  getDashboardStats,
  getWeeklyViews,
  getScheduledDrafts,
  updateSchedule,
  incrementView
} = require("../controllers/blogController");

const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

 =======================================================
   🔐 ADMIN ROUTES (Always Above Public Dynamic Routes)
======================================================= */


router.get("/stats", authMiddleware, getDashboardStats);
router.get("/weekly-views", authMiddleware, getWeeklyViews);
router.get("/scheduled", authMiddleware, getScheduledDrafts);
router.put("/:id/schedule", authMiddleware, updateSchedule);

router.get("/admin/:id", authMiddleware, async (req, res) => {
  try {
    const blog = await require("../models/blog").findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: "Blog not found" });
    }
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: "Error fetching blog" });
  }
});


router.post("/", authMiddleware, upload.single("image"), createBlog);


router.put("/:id", authMiddleware, upload.single("image"), updateBlog);


router.put("/:id/featured", authMiddleware, toggleFeatured);


router.delete("/:id", authMiddleware, deleteBlog);


 =======================================================
   🌐 PUBLIC ROUTES (Keep Dynamic Slug Last)
======================================================= */
router.get("/", getAllBlogs);

router.post("/:slug/view", incrementView); 

router.get("/:slug", getSingleBlog);       

module.exports = router;    