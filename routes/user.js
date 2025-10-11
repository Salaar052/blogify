const { Router } = require("express");
const path = require("path");
const multer = require("multer");

const {
  renderSigninPage,
  renderSignupPage,
  signupUser,
  signinUser,
  logoutUser,
} = require("../controllers/userController");

const router = Router();

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

// 🔹 Routes
router.get("/signin", renderSigninPage);
router.get("/signup", renderSignupPage);
router.post("/signup", upload.single("profileImage"), signupUser);
router.post("/signin", signinUser);
router.get("/logout", logoutUser);

module.exports = router;
