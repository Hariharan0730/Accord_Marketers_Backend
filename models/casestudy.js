const mongoose = require("mongoose");

const caseStudySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true
    },

    excerpt: {
      type: String,
      required: true
    },

    coverImage: {
      type: String,
      required: true
    },

    gallery: [
      {
        type: String
      }
    ],

    client: {
      name: String,
      logo: String,
      website: String
    },

    industry: {
      type: String,
      index: true
    },

    servicesUsed: [
      {
        type: String
      }
    ],

    problem: {
      type: String,
      required: true
    },

    strategy: {
      type: String,
      required: true
    },

    execution: {
      type: String
    },

    result: {
      type: String,
      required: true
    },

    metrics: [
      {
        label: String,
        value: String
      }
    ],

    testimonial: {
      quote: String,
      author: String,
      designation: String
    },

    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
      index: true
    },

    publishedAt: Date,
    publishDate: Date,

    seo: {
      metaTitle: String,
      metaDescription: String,
      keywords: [String]
    }
  },
  { timestamps: true }
);

caseStudySchema.index({ status: 1, industry: 1 });
caseStudySchema.index({ title: "text", excerpt: "text", problem: "text" });

module.exports =
  mongoose.models.CaseStudy ||
  mongoose.model("CaseStudy", caseStudySchema);