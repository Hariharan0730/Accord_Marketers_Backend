const Activity = require("../models/activity");

exports.getRecentActivities = async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const sortType = req.query.sort === "oldest" ? 1 : -1;
    const skip = (page - 1) * limit;

    let filter = {};

    if (req.query.date) {
      const selected = new Date(req.query.date);

      const startOfDay = new Date(selected);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(selected);
      endOfDay.setHours(23, 59, 59, 999);

      filter.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay
      };
    }

    const total = await Activity.countDocuments(filter);

    const activities = await Activity.find(filter)
      .sort({ createdAt: sortType })
      .skip(skip)
      .limit(limit)
      .populate("admin", "email");

    res.json({
      logs: activities,
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });

  } catch (error) {
    console.error("Activity fetch error:", error);
    res.status(500).json({ message: "Error fetching activities" });
  }
};
exports.deleteActivity = async (req, res) => {
  try {
    const log = await Activity.findByIdAndDelete(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Log not found" });
    }

    res.json({ message: "Log deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting log" });
  }
};
exports.clearActivities = async (req, res) => {
  try {
    await Activity.deleteMany({});
    res.json({ message: "All activity logs cleared" });
  } catch (error) {
    res.status(500).json({ message: "Error clearing logs" });
  }
};