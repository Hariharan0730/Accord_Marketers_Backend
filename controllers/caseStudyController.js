const CaseStudy = require("../models/casestudy");
const Activity = require("../models/activity")

exports.createCaseStudy = async (req, res) => {
    try {


        if (req.file) {
            req.body.coverImage = req.file.path.replace(/\\/g, "/");
        }


        if (req.body.metrics && typeof req.body.metrics === "string") {
            req.body.metrics = JSON.parse(req.body.metrics);
        }


        if (req.body.publishDate) {
            const scheduleDate = new Date(req.body.publishDate);

            if (!isNaN(scheduleDate) && scheduleDate > new Date()) {
                req.body.status = "draft";
                req.body.publishDate = scheduleDate;
            }
        }


        if (req.body.status === "published" && !req.body.publishDate) {
            req.body.publishedAt = new Date();
        }

        const newCase = await CaseStudy.create(req.body);
        await Activity.create({
            action: "Case Study Created",
            contentType: "CaseStudy",
            contentId: newCase._id,
            contentTitle: newCase.title,
            admin: req.admin?.id,
            adminEmail: req.admin?.email,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],

            metadata: {
                status: newCase.status,
                industry: newCase.industry,
                featured: newCase.isFeatured,
                services: newCase.servicesUsed
            }
        });
        res.status(201).json(newCase);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


exports.getCaseStudies = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 6;
        const skip = (page - 1) * limit;


        const filter = {
            status: "published"
        };

        if (req.query.industry) {
            filter.industry = req.query.industry;
        }

        if (req.query.featured) {
            filter.isFeatured = req.query.featured === "true";
        }

        if (req.query.search) {
            filter.$text = { $search: req.query.search };
        }

        
        if (req.query.random === "true") {

            const caseStudies = await CaseStudy.aggregate([
                { $match: filter },
                { $sample: { size: limit } }
            ]);

            return res.json({
                caseStudies,
                totalPages: 1,
                currentPage: 1
            });
        }

        

        const total = await CaseStudy.countDocuments(filter);

        const caseStudies = await CaseStudy.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            caseStudies,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.getSingleCaseStudy = async (req, res) => {
    try {

        const caseStudy = await CaseStudy.findOne({
            slug: req.params.slug,
            status: "published"
        });

        if (!caseStudy) {
            return res.status(404).json({ message: "Case Study not found" });
        }

        res.json(caseStudy);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.updateCaseStudy = async (req, res) => {
    try {


        if (req.file) {
            req.body.coverImage = req.file.path.replace(/\\/g, "/");
        }


        if (req.body.metrics && typeof req.body.metrics === "string") {
            req.body.metrics = JSON.parse(req.body.metrics);
        }


        const existing = await CaseStudy.findById(req.params.id);
        if (!existing) {
            return res.status(404).json({ message: "Case Study not found" });
        }


        const changes = [];

        if (req.body.title && req.body.title !== existing.title) {
            changes.push({
                field: "Title",
                oldValue: existing.title,
                newValue: req.body.title
            });
        }

        if (req.body.status && req.body.status !== existing.status) {
            changes.push({
                field: "Status",
                oldValue: existing.status,
                newValue: req.body.status
            });
        }

        if (req.body.industry && req.body.industry !== existing.industry) {
            changes.push({
                field: "Industry",
                oldValue: existing.industry,
                newValue: req.body.industry
            });
        }

        if (req.file) {
            changes.push({
                field: "Cover Image",
                oldValue: existing.coverImage,
                newValue: req.file.path
            });
        }

        const updated = await CaseStudy.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        await Activity.create({
            action: "Case Study Updated",
            contentType: "CaseStudy",
            contentId: updated._id,
            contentTitle: updated.title,
            admin: req.admin?.id,
            adminEmail: req.admin?.email,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
            changes
        });

        res.json(updated);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



exports.deleteCaseStudy = async (req, res) => {
    try {

        const deleted = await CaseStudy.findById(req.params.id);

        if (!deleted) {
            return res.status(404).json({ message: "Case Study not found" });
        }
        await Activity.create({
            action: "Case Study Deleted",
            contentType: "CaseStudy",
            contentId: deleted._id,
            contentTitle: deleted.title,
            admin: req.admin?.id,
            adminEmail: req.admin?.email,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],

            metadata: {
                status: deleted.status,
                industry: deleted.industry,
                featured: deleted.isFeatured,
                services: deleted.servicesUsed
            }
        });
        await deleted.deleteOne();
        res.json({ message: "Case Study deleted successfully" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getCaseStudyStats = async (req, res) => {
    try {
        const total = await CaseStudy.countDocuments();
        const draft = await CaseStudy.countDocuments({ status: "draft" });
        const featured = await CaseStudy.countDocuments({ isFeatured: true });

        res.json({
            totalCaseStudies: total,
            draftCaseStudies: draft,
            featuredCaseStudies: featured
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
exports.getScheduledCaseStudies = async (req, res) => {
    try {
        const scheduled = await CaseStudy.find({
            status: "draft",
            publishDate: { $gt: new Date() }
        }).sort({ publishDate: 1 });

        res.json(scheduled);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateCaseSchedule = async (req, res) => {
    try {
        const { publishDate } = req.body;

        const caseStudy = await CaseStudy.findById(req.params.id);

        if (!caseStudy) {
            return res.status(404).json({ message: "Not found" });
        }

        caseStudy.status = "draft";
        caseStudy.publishDate = new Date(publishDate);

        await caseStudy.save();

        res.json({ message: "Schedule updated" });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};