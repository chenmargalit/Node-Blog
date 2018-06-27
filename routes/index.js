var express = require ("express"),
    router = express.Router(),
    passport = require("passport"),
    User = require("../models/user"),
    Attraction = require("../models/attractions"),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto");
    require('dotenv').config();


    
    
    

// Register Routs //

router.get("/register", function (req, res) {
    res.render("register");
});

//Register Logic
router.post("/register", function (req, res) {
   var newUser = new User({
   username: req.body.username,
   firstname: req.body.firstname,
   lastname: req.body.lastname,
   email: req.body.email,
   avatar: req.body.avatar,
   isAdmin: req.body.isAdmin
   });

  if(req.body.adminCode === "123") {
      newUser.isAdmin = true;
  }

  
  User.register(newUser, req.body.password, function(err, newlyCreatedUser) {
      if (err) {
          console.log(err);
          req.flash("error", err.message);
          return res.render("register");
      } passport.authenticate("local")(req, res, function(){
          req.flash("success", "welcome to Berlin " + newlyCreatedUser.username);
          res.redirect("/att");
      });
           
      });
  });

//show login form
router.get("/login", function(req, res) {
    res.render("login");
        
});

//Handeling login logic
router.post("/login",
    passport.authenticate("local", 
    {
    successRedirect: "/att", 
    failureRedirect: "/login"
    }), 
    function(req, res) {
    
});

//Logout Route
router.get("/logout", function(req, res) {
   req.flash("success", "Logged you out successfully " + req.user.username);
   req.logout();
   res.redirect("/att");
});

function isLoggedIn (req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    } res.redirect("/login");
}

// forgot route
router.get("/forgot", function( req, res) {
    res.render("forgot");
});
  
//Public profile

router.get("/users/:id",  function(req, res) {
    User.findById(req.params.id, function(err, foundUser) { //req.params.id = the user who owns the profile is named here foundUser //
        if (err) {
            console.log(err);
            req.flash("error", "error comes from public profiles in index.js");
            res.redirect("/");
        } else {
            Attraction.find().where("author.id").equals(foundUser._id).exec(function (err, attractions) {
                // find (which actually means - show) the attractions WHICH author.id = foundUser.id which is the profile owner.
                // That means, show the attractions made by the profile ure watching.
                
               if (err) {
            console.log(err);
            req.flash("error", "error comes from public profiles in index.js");
            res.redirect("/"); 
               }
                res.render("users/show", {user: foundUser, attractions: attractions});
            });
            
        }
    });
});
  
  //edit user profile
  router.get("/users/:id/edit", function(req, res) {
     User.findById(req.params.id, req.body.Edit, function(err, editUser) {
          if (err) {
              console.log(err);
              console.log("this error is from edit user profile");
              
          } else {
              res.render("users/editProfile", {edit: editUser});
          }
      });
    
  });
  
  
  //Update route

router.put("/users/:id", function(req, res) {
        // req.body.Att.text = req.sanitize(req.body.Att.text)
    User.findByIdAndUpdate(req.params.id, req.body.Edit, {new: true}, function(err, updatedProfile) {
        if (err) {
            console.log(err);
            console.log("error with findByIdAndUpdate at index");
            res.redirect("back");
        } else { 
            if (req.body.Edit.adminCode === "123") {
                updatedProfile.isAdmin = true;
                updatedProfile.save();
                console.log("admin code is " + req.body.Edit.adminCode)
            }
            req.flash("success", "you've been made Admin")
            res.redirect("/users/" + req.params.id);
        }
    });
});

// forgot password
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "See you later!");
   res.redirect("/att");
});

// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'tt7417492@gmail.com',
          pass: 'm23beck8'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'tt7417492@gmail.com',
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/forgot');
    }
    res.render('reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (err)
        if(!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            if (err) {
              req.flash("error", 'please try again')
            }
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              if (err) {
                req.flash("error", 'please try again')
              }
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'tt7417492@gmail.com',
          pass: 'm23beck8'
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'ChenBerlinfo@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/att');
  });
});

  
  
 
//Middleware
// function checkCampgroundOwnership(req, res, next) {
//  if(req.isAuthenticated()){
//         User.findById(req.params.id, function(err, foundAttraction){
//           if(err){
//               req.flash("error", "Attraction not found");
//               res.redirect("back");
//           }  else {
 
//             // Added this block, to check if foundCampground exists, and if it doesn't to throw an error via connect-flash and send us back to the homepage
//             if (!foundAttraction) {
//                     req.flash("error", "Item not found.");
//                     return res.redirect("back");
//                 }
//             // If the upper condition is true this will break out of the middleware and prevent the code below to crash our application
//             if(foundAttraction.author.id.equals(req.user._id) || req.user.isAdmin) {
//                 console.log("Check campground ownership passed.");
//                 next();
//             } else {
//                 req.flash("error", "You don't have permission to do that");
//                 res.redirect("back");
//             }
//           }
//         });
//     } else {
//         req.flash("error", "You need to be logged in to do that");
//         res.redirect("back");
//     }
// }
 
 
module.exports = router;