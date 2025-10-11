require("dotenv").config();

const path = require("path")
const express = require("express")
const userRouter = require("./routes/user")     
const blogRouter = require("./routes/blog")
const mongoose = require("mongoose")
const cookieParser = require("cookie-parser");
const { checkAuthenticationCookie } = require("./middlewares/authentication");
const Blog = require("./models/blog")


const app = express();
const PORT =process.env.PORT || 8000;

mongoose.connect(process.env.MONGO_URI).then(e=>console.log("Mongo db connected successfully"));

app.set("view engine","ejs");
app.set('views',path.resolve("./views"));

app.use(express.urlencoded({extended:false } ) );
app.use(cookieParser());
app.use(checkAuthenticationCookie("token"));
app.use(express.static(path.resolve("./public")));
app.use("/user",userRouter)
app.use("/blog",blogRouter)


app.get("/",async(req,res)=>{
    const allBlogs = await Blog.find({});
    return res.render("home",{
        user: req.user,
        blogs: allBlogs,  
        

    });
    
});


app.listen(PORT, ()=>console.log(`Server started at port ${PORT}`))
