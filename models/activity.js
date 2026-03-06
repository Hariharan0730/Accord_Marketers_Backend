const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true
        },


        contentType: {
            type: String,
            enum: ["Blog", "CaseStudy"],
            required: true
        },

        contentId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: "contentType"
        },

        contentTitle: {
            type: String,
            required: true
        },


        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Admin"
        },

        adminEmail: {
            type: String
        },


        metadata: {
            type: Object
        },


        ipAddress: {
            type: String
        },

        userAgent: {
            type: String
        },
        metadata: {
            type: Object
        },

        changes: [
            {
                field: String,
                oldValue: mongoose.Schema.Types.Mixed,
                newValue: mongoose.Schema.Types.Mixed
            }
        ],

        ipAddress: String,
        userAgent: String
    },
    { timestamps: true }
);


activitySchema.index({ createdAt: -1 });
activitySchema.index({ contentType: 1 });
activitySchema.index({ contentId: 1 });

module.exports = mongoose.model("Activity", activitySchema);