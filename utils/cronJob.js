const cron = require("node-cron");
const Blog = require("../models/blog");
const CaseStudy = require("../models/casestudy");

const startCronJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();


      const blogsToPublish = await Blog.find({
        status: "draft",
        publishDate: { $lte: now }
      });

      for (let blog of blogsToPublish) {
        blog.status = "published";
        blog.publishedAt = new Date();
        blog.publishDate = null;
        await blog.save();
      }

      if (blogsToPublish.length > 0) {
        console.log(`${blogsToPublish.length} blog(s) auto-published`);
      }


      const casesToPublish = await CaseStudy.find({
        status: "draft",
        publishDate: { $lte: now }
      });

      for (let item of casesToPublish) {
        item.status = "published";
        item.publishedAt = new Date();
        item.publishDate = null;
        await item.save();
      }

      if (casesToPublish.length > 0) {
        console.log(`${casesToPublish.length} case study(s) auto-published`);
      }

    } catch (error) {
      console.error("Cron job error:", error);
    }
  });
};

module.exports = startCronJob;