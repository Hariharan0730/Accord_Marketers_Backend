const Blog = require("../models/blog");
const slugify = require("slugify");
const sanitizeHtml = require("sanitize-html");
const Activity = require("../models/activity");
exports.getAllBlogs = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;

        const filter = {};


        if (!req.admin) {
            filter.status = "published";
        }


        if (req.query.search) {
            filter.title = {
                $regex: req.query.search,
                $options: "i"
            };
        }


        if (req.query.category) {
            filter.category = req.query.category;
        }


        if (req.query.tag) {
            filter.tags = req.query.tag;
        }


        if (req.admin && req.query.status) {
            filter.status = req.query.status;
        }


        const total = await Blog.countDocuments(filter);


        const blogs = await Blog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            blogs,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            totalBlogs: total
        });

    } catch (error) {
        console.error("GET BLOGS ERROR:", error);
        res.status(500).json({
            message: "Error fetching blogs"
        });
    }
};
exports.getSingleBlog = async (req, res) => {
    try {
        const query = { slug: req.params.slug };

        if (!req.query.admin) {
            query.status = "published";
        }

        const blog = await Blog
            .findOne(query)
            .populate("author", "name profileImage");

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        res.json(blog);

    } catch (error) {
        res.status(500).json({ message: "Error fetching blog" });
    }
};

exports.incrementView = async (req, res) => {
    try {

        const blog = await Blog.findOneAndUpdate(
            { slug: req.params.slug },   
            { $inc: { views: 1 } },      
            { new: true }
        );

        if (!blog) {
            return res.status(404).json({
                success: false,
                message: "Blog not found"
            });
        }


        const io = req.app.get("io");

        io.emit("blogViewUpdated", {
            blogId: blog._id,
            views: blog.views
        });

        res.json({
            success: true,
            views: blog.views
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
};

exports.createBlog = async (req, res) => {
    try {


        if (req.body.seo && typeof req.body.seo === "string") {
            try {
                req.body.seo = JSON.parse(req.body.seo);
            } catch {
                req.body.seo = {};
            }
        }


        if (!req.body.publishDate) {
            delete req.body.publishDate;
        }


        if (req.body.title) {
            let baseSlug = slugify(req.body.title, {
                lower: true,
                strict: true
            });

            let slug = baseSlug;
            let count = 1;

            while (await Blog.findOne({ slug })) {
                slug = `${baseSlug}-${count}`;
                count++;
            }

            req.body.slug = slug;
        }


        if (req.file) {
            req.body.featuredImage = req.file.path;
        }


        if (req.body.tags && typeof req.body.tags === "string") {
            req.body.tags = req.body.tags
                .split(",")
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
        }


        if (req.body.content) {
            req.body.content = sanitizeHtml(req.body.content, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"])
            });
        }


        if (!req.body.status || !["draft", "published"].includes(req.body.status)) {
            req.body.status = "draft";
        }


        if (req.body.publishDate) {
            const scheduleDate = new Date(req.body.publishDate);

            if (isNaN(scheduleDate)) {
                delete req.body.publishDate;
            } else if (scheduleDate > new Date()) {
                req.body.status = "draft";
                req.body.publishDate = scheduleDate;
            }
        }


        if (req.body.status === "published" && !req.body.publishDate) {
            req.body.publishedAt = new Date();
        }


        if (req.body.seo) {

            if (req.body.seo.keywords && typeof req.body.seo.keywords === "string") {
                req.body.seo.keywords = req.body.seo.keywords
                    .split(",")
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
            }

            if (!req.body.seo.metaTitle && req.body.title) {
                req.body.seo.metaTitle = req.body.title;
            }
        }


        const Admin = require("../models/admin");
        const admin = await Admin.findById(req.admin?.id);

        req.body.author = req.admin.id;

        const blog = await Blog.create(req.body);


        await Activity.create({
            action: "Blog Created",
            contentType: "Blog",
            contentId: blog._id,
            contentTitle: blog.title,
            admin: req.admin?.id,
            adminEmail: req.admin?.email,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],

            metadata: {
                status: blog.status,
                category: blog.category,
                tags: blog.tags,
                featured: blog.isFeatured
            }
        });

        res.status(201).json(blog);

    } catch (error) {
        console.error("CREATE BLOG ERROR:", error);
        res.status(400).json({ message: "Error creating blog" });
    }
};
exports.updateBlog = async (req, res) => {
    try {


        if (req.body.seo && typeof req.body.seo === "string") {
            try {
                req.body.seo = JSON.parse(req.body.seo);
            } catch {
                req.body.seo = {};
            }
        }


        if (req.body.tags && typeof req.body.tags === "string") {
            req.body.tags = req.body.tags
                .split(",")
                .map(tag => tag.trim())
                .filter(tag => tag.length > 0);
        }


        if (req.body.content) {
            req.body.content = sanitizeHtml(req.body.content, {
                allowedTags: sanitizeHtml.defaults.allowedTags.concat(["img"])
            });
        }


        if (req.body.status && !["draft", "published"].includes(req.body.status)) {
            delete req.body.status;
        }

        const existingBlog = await Blog.findById(req.params.id);
        if (!existingBlog) {
            return res.status(404).json({ message: "Blog not found" });
        }


        if (req.body.publishDate) {
            const scheduleDate = new Date(req.body.publishDate);

            if (isNaN(scheduleDate)) {
                delete req.body.publishDate;
            } else if (scheduleDate > new Date()) {
                req.body.status = "draft";
                req.body.publishDate = scheduleDate;
            }
        }


        if (req.body.status === "published") {


            if (!existingBlog.publishedAt) {
                req.body.publishedAt = new Date();
            }

            req.body.publishDate = null;
        }


        if (req.body.seo) {

            if (req.body.seo.keywords && typeof req.body.seo.keywords === "string") {
                req.body.seo.keywords = req.body.seo.keywords
                    .split(",")
                    .map(k => k.trim())
                    .filter(k => k.length > 0);
            }

            if (!req.body.seo.metaTitle && req.body.title) {
                req.body.seo.metaTitle = req.body.title;
            }
        }
        const changes = [];

        if (req.body.title && req.body.title !== existingBlog.title) {
            changes.push({
                field: "Title",
                oldValue: existingBlog.title,
                newValue: req.body.title
            });
        }

        if (req.body.status && req.body.status !== existingBlog.status) {
            changes.push({
                field: "Status",
                oldValue: existingBlog.status,
                newValue: req.body.status
            });
        }

        if (req.body.category && req.body.category !== existingBlog.category) {
            changes.push({
                field: "Category",
                oldValue: existingBlog.category,
                newValue: req.body.category
            });
        }

        if (req.file) {
            changes.push({
                field: "Featured Image",
                oldValue: existingBlog.featuredImage,
                newValue: req.file.path
            });
        }

        const blog = await Blog.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        await Activity.create({
            action: "Blog Updated",
            contentType: "Blog",
            contentId: blog._id,
            contentTitle: blog.title,
            admin: req.admin?.id,
            adminEmail: req.admin?.email,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            changes
        });
        res.json(blog);

    } catch (error) {
        console.error("UPDATE BLOG ERROR:", error);
        res.status(400).json({ message: "Error updating blog" });
    }
};

exports.deleteBlog = async (req, res) => {
    try {

        const blog = await Blog.findById(req.params.id);


        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }


        await Activity.create({
            action: "Blog Deleted",
            contentType: "Blog",
            contentId: blog._id,
            contentTitle: blog.title,
            admin: req.admin?.id,
            adminEmail: req.admin?.email,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],

            metadata: {
                status: blog.status,
                category: blog.category,
                views: blog.views,
                featured: blog.isFeatured
            }
        });


        await blog.deleteOne();

        res.json({ message: "Blog deleted" });

    } catch (error) {
        res.status(400).json({ message: "Error deleting blog" });
    }
};
exports.getFeaturedBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({
            isFeatured: true,
            status: "published"
        })
            .sort({ createdAt: -1 })
            .limit(3);

        res.json(blogs);

    } catch (error) {
        res.status(500).json({ message: "Error fetching featured blogs" });
    }
};
exports.getDashboardStats = async (req, res) => {
    try {

        const totalBlogs = await Blog.countDocuments({
            status: "published"
        });

        const draftCount = await Blog.countDocuments({
            status: "draft"
        });

        const featuredCount = await Blog.countDocuments({
            status: "published",
            isFeatured: true
        });

        const viewsData = await Blog.aggregate([
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: "$views" }
                }
            }
        ]);

        const totalViews =
            viewsData.length > 0 ? viewsData[0].totalViews : 0;

        res.json({
            totalBlogs,
            totalViews,
            draftCount,
            featuredCount
        });

    } catch (error) {
        res.status(500).json({
            message: "Error fetching dashboard stats"
        });
    }
};


exports.toggleFeatured = async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        blog.isFeatured = !blog.isFeatured;
        await blog.save();

        res.json({
            message: "Featured status updated",
            isFeatured: blog.isFeatured
        });

    } catch (error) {
        res.status(400).json({ message: "Error updating featured status" });
    }
};
exports.getWeeklyViews = async (req, res) => {
    try {
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const result = await Blog.aggregate([
            {
                $match: {
                    status: "published",
                    publishedAt: {
                        $gte: sevenDaysAgo,
                        $lte: today
                    }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$publishedAt" }
                    },
                    totalViews: { $sum: "$views" }
                }
            }
        ]);


        const viewsMap = {};
        result.forEach(item => {
            viewsMap[item._id] = item.totalViews;
        });


        const finalData = [];

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);

            const dateStr = d.toISOString().split("T")[0];
            const dayName = d.toLocaleDateString("en-IN", { weekday: "short" });

            finalData.push({
                day: dayName,
                date: dateStr,
                views: viewsMap[dateStr] || 0
            });
        }

        res.json(finalData);

    } catch (error) {
        console.error("WEEKLY VIEW ERROR:", error);
        res.status(500).json({ message: "Error fetching weekly views" });
    }
};
exports.getScheduledDrafts = async (req, res) => {
    try {
        const drafts = await Blog.find({
            status: "draft",
            publishDate: { $gt: new Date() }
        }).sort({ publishDate: 1 });

        res.json(drafts);
    } catch (error) {
        res.status(500).json({ message: "Error fetching scheduled drafts" });
    }
};
exports.updateSchedule = async (req, res) => {
    try {
        const { publishDate } = req.body;

        const blog = await Blog.findById(req.params.id);

        if (!blog) {
            return res.status(404).json({ message: "Blog not found" });
        }

        blog.publishDate = publishDate;
        blog.status = "draft"; 
        await blog.save();

        res.status(200).json({ message: "Schedule updated successfully" });

    } catch (error) {
        res.status(500).json({ message: "Error updating schedule" });
    }
};