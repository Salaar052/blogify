const { createHmac, randomBytes } = require("node:crypto");
const { Schema, model } = require("mongoose");
const { error } = require("node:console");
const { createToken } = require("../services/authentication");

const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "/images/defaultAvatar.jpeg",
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN"],
      default: "USER",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  const salt = randomBytes(16).toString();
  const hashedPassword = createHmac("sha256", salt)
    .update(user.password)
    .digest("hex");

  this.salt = salt;
  this.password = hashedPassword;

  next();
});

userSchema.static("matchPasswordAndGenerateToken", async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("User Not Found");
  const actualHashedPassword = user.password;
  const salt = user.salt;

  const userProvideHash = createHmac("sha256", salt)
    .update(password)
    .digest("hex");

  if (actualHashedPassword !== userProvideHash)
    throw new Error("Incorrect password");

  const token = createToken(user);
  return token;
});

const User = model("user", userSchema);

module.exports = User;
