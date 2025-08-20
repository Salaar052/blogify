const { Router } = require("express");
const Blog = require("../models/blog")
const Comment = require("../models/comment")
const multer = require("multer")
const path = require("path")

const router = Router();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null,fileName);
  }
})
const upload = multer({ storage: storage })


router.get("/add", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id).populate("createdBy");
        const comments = await Comment.find({blogId:req.params.id}).populate("createdBy")
        if (!blog) {
            return res.status(404).send("Blog not found");
        }

        res.render("blog", {
            user: req.user,
            blog,
            comments,
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});


router.post("/add",upload.single("coverImage"),async(req,res)=>{
    const {title,body} = req.body; 
    console.log(req.file);
    
    const blog = await Blog.create({
        body,
        title,
        createdBy: req.user._id,
        coverImageURL: `/uploads/${req.file.filename}`,
    });
   return res.redirect(`/blog/${blog._id}`);

});

router.post("/comment/:blogId",async(req,res)=>{
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy:req.user._id,
});
return res.redirect(`/blog/${req.params.blogId}`)
})
module.exports = router;
