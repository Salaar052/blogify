const User = require("../models/user");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;
const { createToken } = require("../services/authentication");
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function renderSigninPage(req, res) {
  res.render("signin");
}

function renderSignupPage(req, res) {
  res.render("signup");
}

async function signupUser(req, res) {
  const { fullName, email, password } = req.body;

  try {
    let imageUrl = "";

    if (req.file) {
      const uploadResult = await cloudinary.uploader.upload(req.file.path, {
        folder: "user_profiles",
      });
      imageUrl = uploadResult.secure_url;

      fs.unlinkSync(req.file.path);
    }

    const user = await User.create({
      fullName,
      email,
      password,
      profileImage: imageUrl||"",
    });

    const token = createToken(user);
    res.cookie("token", token);
    return res.redirect("/");
  } catch (error) {
    console.error("Signup error:", error);
    return res.render("signup", {
      error: "User already exists or image upload failed.",
    });
  }
}

async function signinUser(req, res) {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    return res.cookie("token", token).redirect("/");
  } catch (error) {
    return res.render("signin", {
      error: "Incorrect email or password",
    });
  }
}

function logoutUser(req, res) {
  return res.clearCookie("token").redirect("/");
}

module.exports = {
  renderSigninPage,
  renderSignupPage,
  signupUser,
  signinUser,
  logoutUser,
};
