const Blog = require("../models/blog");
const Comment = require("../models/comment");
const path = require("path");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const axios = require("axios");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

// ✅ Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function renderAddBlogPage(req, res) {
  return res.render("addBlog", { user: req.user });
}

// ✅ Get a blog by ID
async function getBlogById(req, res) {
  try {
    const blog = await Blog.findById(req.params.id).populate("createdBy");
    const comments = await Comment.find({ blogId: req.params.id }).populate(
      "createdBy"
    );

    if (!blog) return res.status(404).send("Blog not found");

    res.render("blog", { user: req.user, blog, comments });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

// ✅ Add Blog (with Cloudinary image upload)
async function addBlog(req, res) {
  try {
    const { title, body } = req.body;
    let imageUrl = "";

    // Upload image to Cloudinary if provided
    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "blogify/blog_covers",
      });
      imageUrl = uploadResult.secure_url;

      // Delete local temp file
      fs.unlinkSync(req.file.path);
    }

    const blog = await Blog.create({
      title,
      body,
      createdBy: req.user._id,
      coverImageURL: imageUrl || "",
    });

    return res.redirect(`/blog/${blog._id}`);
  } catch (err) {
    console.error("Error adding blog:", err);
    res.status(500).send("Error adding blog");
  }
}

// ✅ Add Comment
async function addComment(req, res) {
  try {
    await Comment.create({
      content: req.body.content,
      blogId: req.params.blogId,
      createdBy: req.user._id,
    });

    return res.redirect(`/blog/${req.params.blogId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding comment");
  }
}

// ✅ Utility for PDF filename
function sanitizeFilename(s) {
  return s.replace(/[<>:"/\\|?*\x00-\x1F]/g, "").substring(0, 60);
}

// ✅ Load image buffer (local or Cloudinary)
async function loadImageBuffer(imageUrlOrPath) {
  if (!imageUrlOrPath) return null;

  if (
    imageUrlOrPath.startsWith("http://") ||
    imageUrlOrPath.startsWith("https://")
  ) {
    const resp = await axios.get(imageUrlOrPath, {
      responseType: "arraybuffer",
    });
    return Buffer.from(resp.data);
  } else {
    const p = path.resolve("./public" + imageUrlOrPath);
    if (fs.existsSync(p)) return fs.readFileSync(p);
    return null;
  }
}

// ✅ Download Blog as PDF
async function downloadBlog(req, res) {
  try {
    const blog = await Blog.findById(req.params.id).populate(
      "createdBy",
      "fullName"
    );
    if (!blog) return res.status(404).send("Blog not found");

    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const fileTitle = sanitizeFilename(blog.title || "blog");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${fileTitle}Blog.pdf"`
    );

    doc.pipe(res);

    const contentWidth =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Title
    doc
      .font("Helvetica-Bold")
      .fontSize(22)
      .fillColor("#1e90ff")
      .text(blog.title, { align: "center", width: contentWidth });

    doc.moveDown(0.6);
    doc
      .strokeColor("#2a3b50")
      .lineWidth(1)
      .moveTo(doc.x, doc.y)
      .lineTo(doc.x + contentWidth, doc.y)
      .stroke();
    doc.moveDown(0.8);

    // Image
    try {
      const imageBuffer = await loadImageBuffer(blog.coverImageURL);
      if (imageBuffer) {
        const maxImageHeight = 250;
        doc.image(imageBuffer, {
          fit: [contentWidth, maxImageHeight],
          align: "center",
          valign: "center",
        });
        doc.moveDown(1);
      }
    } catch (e) {
      console.warn("Could not load cover image:", e.message);
    }

    // Body
    doc
      .font("Helvetica")
      .fontSize(12)
      .fillColor("#222")
      .text(blog.body || "", {
        align: "justify",
        width: contentWidth,
        lineGap: 4,
      });

    doc.moveDown(1.2);

    // Footer (author info)
    const authorName = blog.createdBy?.fullName || "Unknown";
    const createdAt = blog.createdAt
      ? new Date(blog.createdAt).toLocaleString()
      : "";

    doc
      .moveTo(doc.x, doc.y)
      .lineTo(doc.x + contentWidth, doc.y)
      .strokeColor("#e6eefc")
      .lineWidth(0.4)
      .stroke();

    doc.moveDown(0.6);
    doc
      .font("Helvetica-Oblique")
      .fontSize(11)
      .fillColor("#555")
      .text(`Created by: ${authorName}`, {
        align: "right",
        width: contentWidth,
      });
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#777")
      .text(`Created at: ${createdAt}`, {
        align: "right",
        width: contentWidth,
      });

    const bottom = doc.page.height - doc.page.margins.bottom + 10;
    doc.fontSize(9).fillColor("#999");
    doc.text(
      `Generated by Blogify © ${new Date().getFullYear()} — Salaar Asim`,
      doc.page.margins.left,
      bottom,
      {
        width: contentWidth,
        align: "center",
      }
    );

    doc.end();
  } catch (err) {
    console.error("Error generating PDF:", err);
    return res.status(500).send("Server error while generating PDF");
  }
}

module.exports = {
  renderAddBlogPage,
  getBlogById,
  addBlog,
  addComment,
  downloadBlog,
};
