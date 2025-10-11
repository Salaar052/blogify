const express = require("express");
const path = require("path");
const multer = require("multer");

const {
  renderAddBlogPage,
  getBlogById,
  addBlog,
  addComment,
  downloadBlog,
} = require("..//controllers/blogController");

const router = express.Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve("./public/uploads/"));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});
const upload = multer({ storage });

// Routes
router.get("/add", renderAddBlogPage);
router.get("/:id", getBlogById);
router.post("/add", upload.single("coverImage"), addBlog);
router.post("/comment/:blogId", addComment);
router.get("/download/:id", downloadBlog);

module.exports = router;
