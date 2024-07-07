const express = require("express");
const app = express();
const path = require("path");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const userModel = require("./models/userModel");
const postModel = require("./models/post");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const upload = require("./config/multerconfig")


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.use(cookieParser());

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './public/Images/upload')
//   },
//   filename: function (req, file, cb) {
//     crypto.randomBytes(12, function(err, bytes){
//       const fn =bytes.toString("hex") + path.extname(file.originalname)
//       cb(null, fn)
//     })
//   }
// })
// const upload = multer({ storage: storage })

app.get("/", function (req, res) {
  res.render("index.ejs");
});

app.get("/profile/upload", isLoggedIn,  function (req, res) {
  res.render("profileUpload.ejs");
});
app.post("/upload",isLoggedIn, upload.single("image"), async function (req, res) {

const user = await userModel.findOne({email : req.user.email});
user.profilepic = req.file.filename;
await user.save();

  res.redirect("/profile");

});




app.get("/login", function (req, res) {
  res.render("login");
});
app.post("/login", async function (req, res) {
  let { email, password } = req.body;
  const user = await userModel.findOne({ email: email });
  if (!user) return res.status(500).send("Something Went wrong");

  bcrypt.compare(password, user.password, async function (err, result) {
    if (result) {
      const tokens = await jwt.sign(
        { email: email, userId: user._id },
        "sdjkfhsjdkfhjs"
      );
      res.cookie("token", tokens);
      res.status(200).redirect("profile");
    } else res.redirect("login");
  });
});
app.get("/register", function (req, res) {
  res.render("index");
});
app.post("/register", async function (req, res) {
  let { username, name, email, age, password } = req.body;
  const user = await userModel.findOne({ email: email });
  if (user) return res.status(500).send("user Already Registered");
  //   for password incraftion
  bcrypt.genSalt(saltRounds, function (err, salt) {
    bcrypt.hash(password, salt, async function (err, hash) {
      const createUser = await userModel.create({
        username: username,
        name: name,
        age: age,
        email: email,
        password: hash,
      });

      //   for creating jwt token and it's in cookies
      const tokens = await jwt.sign(
        { email: email, userId: createUser._id },
        "sdjkfhsjdkfhjs"
      );
      res.cookie("token", tokens);

      res.render("login");
    });
  });
});

app.get("/profile", isLoggedIn, async function (req, res) {
  const user = await userModel
    .findOne({ email: req.user.email }).populate("posts");
    res.render("profile", { user });
});

app.get("/logout", function (req, res) {
  res.cookie("token", "");
  res.redirect("/login");
});
app.get("/post", function (req, res) {
  res.redirect("/login");
});

app.post("/post", isLoggedIn, async function (req, res) {
  const user = await userModel.findOne({ email: req.user.email });
  const { content } = req.body;
  const post = await postModel.create({
    user: user._id,
    content,
  });
  user.posts.push(post._id);
  await user.save();
  res.redirect("/profile");
});


app.get("/like/:id", isLoggedIn, async function(req, res) {
  try {
    // Find the post by ID and populate the user field
    const post = await postModel.findOne({_id: req.params.id}).populate("user");
    
    if (!post) {
      return res.status(404).send("Post not found");
    }

    const userIdIndex = post.likes.indexOf(req.user.userId);

    // Check if user ID exists in likes array
    if (userIdIndex === -1) {
      post.likes.push(req.user.userId); // Add user ID to likes array
    } else {
      post.likes.splice(userIdIndex, 1); // Remove user ID from likes array
    }

    await post.save();
    res.redirect("/profile");
  } catch (err) {
    console.error(err);
    res.status(500).send("An error occurred");
  }
});

app.get("/edit/:id", isLoggedIn , async function(req, res){
const post = await postModel.findOne({_id : req.params.id}).populate("user");
  
  res.render("edit.ejs" , {post})
})
app.post("/update/:id", isLoggedIn , async function(req, res){
  const {content} = req.body;
const update = await postModel.findOneAndUpdate({_id :  req.params.id},
 { content : content})

  res.redirect("/profile")
})

app.get("/delete/:id", isLoggedIn, async function(req, res){
  try {
    const post = await postModel.findByIdAndDelete(req.params.id);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    res.redirect("/profile"); // Redirect to profile or any other relevant page
  } catch (err) {
    console.error(err);
    res.status(500).send("Internal Server Error");
  }
});
function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") res.redirect("/login");
  else {
    let data = jwt.verify(req.cookies.token, "sdjkfhsjdkfhjs");
    req.user = data;
  }
  next();
}

app.listen(3000, function (req, res) {
  console.log("it's running good");
});
