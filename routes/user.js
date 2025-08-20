const {Router} = require("express");
const   User = require("../models/user")
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

router.get('/signin',(req,res)=>{
    res.render("signin")
})
router.get('/signup',(req,res)=>{
    res.render("signup")
})
router.post('/signup',upload.single("profileImage"),async(req,res)=>{
    const {fullName,email,password}= req.body;
    console.log(req.body);
    const user = await User.create({
        fullName,
        email,
        password,
        profileImage: `/uploads/${req.file.filename}`||"",
    });
    
    
    return res.redirect("/")
});
router.post("/signin", async(req,res)=>{
    const { email,password } = req.body;
    try {
         const token = await User.matchPasswordAndGenerateToken(email,password);
          return res.cookie("token",token).redirect("/")
    } catch (error) {
        return res.render("signin",{
            error:"Incorrect email or password",
        });
    }
});

router.get("/logout",(req,res)=>{
    return res.clearCookie("token").redirect("/");
});


module.exports = router