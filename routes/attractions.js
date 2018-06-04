var express = require ("express"),
    router = express.Router(),
    Attraction = require("../models/attractions");
    

        // Show all Atts
    router.get("/", function(req, res){
         var noMatch = null;
    // Get all campgrounds from DB
    if(req.query.search) {
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        Attraction.find({name: regex}, function(err, att){
        if (err) {
            console.log(err);
            console.log("something wrong. this originates from attraction.js router.get "/" on lines 7-17");
        } else {
            if(att.length < 1) {
                  noMatch = "No suggestion matches this search, please try again.";
              }
              res.render("attractions", {atts: att, noMatch: noMatch});
        }
    });
    } else {
    Attraction.find({}, function(err, att){
        if (err) {
            console.log(err);
            console.log("something wrong. this originates from attraction.js router.get("/" on lines 7-17");
        } else {
              res.render("attractions", {atts: att, noMatch:noMatch});
        }
    });
    }
});
    
 
    
router.post("/", isLoggedIn, function(req, res) {
    // req.body.Att.text = req.sanitize(req.body.Att.text)
        // var name = req.body.name;
        // var image = req.body.image;
        // var text = req.body.text;
        // var time = req.body.time;
        var author = {
            id: req.user._id,
            username: req.user.username
        };
        Attraction.create(req.body.Att, function(err, newlyCreated) {
            if (err) {
                console.log(err);
                console.log("error with Attraction.create");
                res.redirect("/att/new");
            } else {
                newlyCreated.author = author;
                newlyCreated.save();
                req.flash("success", "new Att created");
                 res.redirect("/att");
            }
        });
    });

       // new Att form
router.get("/new", isLoggedIn, function(req, res) {
        res.render("form");
    });
    
router.get("/:id", function(req, res) {
   Attraction.findById(req.params.id).populate("comments").exec(function(err, specificAtt) {
       if (err) {
           console.log(err);
           console.log("error with Attraction.findById");
       } else {
           res.render("show", {att: specificAtt});
   
       }
       });
   });
   
//Edit route
router.get("/:id/edit", checkCampgroundOwnership, function(req, res){
    Attraction.findById(req.params.id, function(err, foundAttraction){
        if (err) {
            console.log(err)
            console.log("error with findbyid");
        }
    res.render("edit", {att: foundAttraction});
});
});

//Update route
router.put("/:id", checkCampgroundOwnership, function(req, res) {
        // req.body.Att.text = req.sanitize(req.body.Att.text)
    Attraction.findByIdAndUpdate(req.params.id, req.body.Att, function(err, updatedAtt) {
        if (err) {
            console.log(err);
            console.log("error with findByIdAndUpdate");
            res.redirect("/att/");
        } else { 
            res.redirect("/att/" + req.params.id);
            
        }
    });
});

//Delete route
router.delete("/:id", checkCampgroundOwnership, function(req, res) {
    Attraction.findByIdAndRemove(req.params.id, function(err) {
        if (err) {
            console.log(err);
            console.log("error with find by id and remove");
        } else {
        req.flash("success", "Activity deleted");
        res.redirect("/att");
        }
    });
});

function isLoggedIn (req, res, next){
    if(req.isAuthenticated()){
        return next();
    } else {
       req.flash("error", "You need to be logged in to do that");
        res.redirect("/login");
    }
}

//Middleware
function checkCampgroundOwnership(req, res, next) {
 if(req.isAuthenticated()){
        Attraction.findById(req.params.id, function(err, foundAttraction){
           if(err){
               req.flash("error", "Attraction not found");
               res.redirect("back");
           }  else {
 
            // Added this block, to check if foundCampground exists, and if it doesn't to throw an error via connect-flash and send us back to the homepage
            if (!foundAttraction) {
                    req.flash("error", "Item not found.");
                    return res.redirect("back");
                }
            // If the upper condition is true this will break out of the middleware and prevent the code below to crash our application
 
            if(foundAttraction.author.id.equals(req.user._id) || req.user.isAdmin) {
                console.log("Check campground ownership passed.");
                next();
            } else {
                req.flash("error", "You don't have permission to do that");
                res.redirect("back");
            }
           }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
}

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};


module.exports = router;







