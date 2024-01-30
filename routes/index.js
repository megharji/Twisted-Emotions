var express = require('express');
var router = express.Router();
const User = require("../models/userModel");
var upload = require("../utils/mutler").single("avatar");
const Motivation = require("../models/motivationModel");
const passport = require("passport");
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(User.authenticate()));
const nodemailer = require("nodemailer");
const { sendmail } = require("../utils/sendmail");


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {admin: req.user });
});

router.get('/showthoughts/:id', async function(req, res, next) {
  const user1 = await Motivation.findById(req.params.id).populate("user") 
  res.render("showthoughts", {user1, admin: req.user, file: req.file})
});

router.get('/about', function(req, res, next) {
  res.render('about', {admin: req.user});
});

router.get('/login', function(req, res, next) {
  res.render('login', { admin: req.user });
});

router.post('/login', passport.authenticate("local",{
  successRedirect: "/",
  failureRedirect: "/login",
}),
 function(req, res, next) {}
  
);

router.post('/register', async function(req, res, next) {
  try {
        await User.register({
          username: req.body.username, email : req.body.email},
          req.body.password
          );
          res.redirect("/login")
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.get('/register', function(req, res, next) {
  res.render('register', { admin: req.user });
});

router.get('/profile', isLoggedIn, async function(req, res, next) {
  try {
    const {motivations} = await req.user.populate("motivations")
    console.log(req.user, motivations);
    res.render('profile', { admin: req.user, motivations, file: req.file });
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});

router.post('/profile/like', async function(req, res, next) {
  try {
    const post = await Motivation.findById(req.body.likesBtn)
    const updateLikes = await post.updateOne({likes:post.likes + 1})
    res.redirect("/profile")
  } catch (error) {
    console.log(error);
    res.send(error)
  }
});


router.get("/profilefilter", isLoggedIn, async function (req, res, next) {
  try {
      let { motivations } = await req.user.populate("motivations");
      motivations = motivations.filter((e) => {if(e[req.query.key].toLowerCase().includes(req.query.value.toLowerCase())){
        return e;
      }});
      res.render("profile", { admin: req.user, motivations });
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});

router.get('/createquote', function(req, res, next) {
  res.render('createquote', { admin: req.user });
});

router.post("/createquote",  isLoggedIn, async function (req, res, next) {
  try {
    const motivation = new Motivation(req.body);
    req.user.motivations.push(motivation._id);
    motivation.user = req.user._id;
    await motivation.save();
    await req.user.save();
    res.redirect("/profile");
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});



router.get("/signout", isLoggedIn, function (req, res, next) {
  req.logout(() => {
      res.redirect("/");
  });
});

router.get("/reset", isLoggedIn, async function (req, res, next) {
  res.render("reset", { admin: req.user });
});

router.post("/reset", isLoggedIn, async function (req, res, next) {
  try {
      await req.user.changePassword(
          req.body.oldpassword,
          req.body.newpassword
      );
      await req.user.save();
      res.redirect("/profile");
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});

router.get('/forget', function(req, res, next) {
  res.render('forget', {admin: req.user });
});

router.post("/send-mail", async function (req, res, next) {
  try {
      const user = await User.findOne({ email: req.body.email });
      if (!user)
          return res.send("User Not Found! <a href='/forget'>Try Again</a>");

      sendmail(user.email, user, res, req);
  } catch (error) {
      console.log(error);
      res.send(error);
  }
});

router.post("/forget/:id", async function (req, res, next) {
  try {
      const user = await User.findById(req.params.id);
      if (!user)
          return res.send("User not found! <a href='/forget'>Try Again</a>.");

      if (user.token == req.body.token) {
          user.token = -1;
          await user.setPassword(req.body.newpassword);
          await user.save();
          res.redirect("/login");
      } else {
          user.token = -1;
          await user.save();
          res.send("Invalid Token! <a href='/forget'>Try Again<a/>");
      }
  } catch (error) {
      res.send(error);
  }
});

router.get('/image', function(req, res, next) {            
  res.render('image', { admin: req.user });
});

router.post("/upload", function (req, res, next) {
  upload(req, res, async function (err) {
      if (err) throw err;
      const currentUser = await User.findOne({
        _id: req.user._id
      })

      currentUser.image = req.file.filename

      await currentUser.save()
      res.redirect("/")
      
  });
});

router.get('/delete-post/:id', isLoggedIn,async function(req, res){
  try {
    
    const motivationIndex = await req.user.motivations.findIndex((mov)=>mov._id.toString() === req.params.id);
    req.user.motivations.splice(motivationIndex, 1);
    await req.user.save();

    await Motivation.findByIdAndDelete(req.params.id);
    res.redirect('/profile')
  } catch (error) {
    console.log(error);
    res.send(err)

  }
})

router.get('/update-post/:id',isLoggedIn, async function(req, res, next) {
  try{

   const user= await Motivation.findById(req.params.id)
   console.log(user);
   res.render("update",{user, admin: req.user})
}
  catch(err){
    res.send(err)
  }
});

router.get('/favorite', isLoggedIn, async function(req, res, next) {
  const {motivations} = await req.user.populate("motivations")
  res.render('favorite', {admin: req.user, motivations:motivations });
});

router.get('/favorite-post/:id',isLoggedIn, async function(req, res, next) {
  try{
   
   const isfavorite= await Motivation.findById(req.params.id)
   if (isfavorite.like) {
    isfavorite.like = false
   }else{
    isfavorite.like = true
   } await isfavorite.save()
   res.redirect("/profile")
}
  catch(err){
    res.send(err)
  }
});

router.post('/update-post/:id',isLoggedIn,  async function(req, res, next) {

  try{
    console.log(req.body);
  await Motivation.findByIdAndUpdate(req.params.id,req.body)
   res.redirect("/profile")
}
  catch(err){
    res.send(err)
  }
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
      next();
  } else {
      res.redirect("/login");
  }
}


module.exports = router;
