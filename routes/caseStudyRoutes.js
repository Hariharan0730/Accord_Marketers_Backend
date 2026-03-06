const express = require("express");
const router = express.Router();

const {
  createCaseStudy,
  getCaseStudies,
  getSingleCaseStudy,
  updateCaseStudy,
  deleteCaseStudy,
  getCaseStudyStats,
  getScheduledCaseStudies,
  updateCaseSchedule
} = require("../controllers/caseStudyController");

const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const CaseStudy = require("../models/casestudy");


router.get("/", getCaseStudies);


router.get("/stats", authMiddleware, getCaseStudyStats);
router.get("/scheduled", authMiddleware, getScheduledCaseStudies);
router.put("/:id/schedule", authMiddleware, updateCaseSchedule);

router.get("/admin/:id", authMiddleware, async (req, res) => {
  try {
    const caseStudy = await CaseStudy.findById(req.params.id);
    if (!caseStudy) {
      return res.status(404).json({ message: "Case Study not found" });
    }
    res.json(caseStudy);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


router.post("/", authMiddleware, upload.single("coverImage"), createCaseStudy);
router.put("/:id", authMiddleware, upload.single("coverImage"), updateCaseStudy);
router.delete("/:id", authMiddleware, deleteCaseStudy);


router.get("/:slug", getSingleCaseStudy);

module.exports = router;