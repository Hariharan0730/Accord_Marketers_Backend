const mongoose = require("mongoose");

const blogSchema = new mongoose.Schema(
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

    content: {
      type: String,
      required: true
    },

    featuredImage: String,

    category: {
      type: String,
      required: true
    },

    tags: [String],

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin"
    },

    readTime: Number,

    views: {
      type: Number,
      default: 0
    },

    isFeatured: {
      type: Boolean,
      default: false
    },

    status: {
      type: String,
      enum: ["draft", "published"],
      default: "draft"
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


blogSchema.index({ status: 1, category: 1 });
blogSchema.index({ title: "text", excerpt: "text", content: "text" });


blogSchema.pre("save", async function (next) {
  if (this.content) {
    const words = this.content.split(/\s+/).length;
    this.readTime = Math.ceil(words / 200);
  }
});

module.exports = mongoose.models.Blog || mongoose.model("Blog", blogSchema);