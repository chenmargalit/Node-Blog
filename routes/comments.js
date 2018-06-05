var express = require("express");
var router = express.Router({mergeParams: true});

var Attraction = require("../models/attractions");
var Comment = require("../models/comments");


router.get("/new",isLoggedIn, function(req, res) {
    console.log(req.params.id);
    Attraction.findById(req.params.id, function(err, Att) {
        if(err){
            console.log(err)
        } else {
            res.render("comments/newComment", {Att: Att});
        }
    })
});

router.post("/", isLoggedIn, function(req, res) {
    Attraction.findById(req.params.id, function (err, attraction) {
        if (err) {
            console.log(err)
        } else {
            Comment.create(req.body.comment, req.body.Att, function(err, comment) {
                if (err) {
                    console.log(err)
                } else {
                    comment.author.id = req.user._id //req.user holds both the user name and id
                    comment.author.username = req.user.username //in my coment Schema, there's comment, then author which has both userame and id
                    comment.save();
                    attraction.comments.push(comment);
                    attraction.save();
                    res.redirect("/att/" + attraction._id);
                }
            });
        }
    });
});


function isLoggedIn(req, res, next){
    if(req.isAuthenticated()){
        return next();
    } res.redirect("/login");
}
    
    //Edit comment
router.get("/:comment_id/edit", checkCommentOwnership, function(req, res) {
    Comment.findById(req.params.comment_id, function(err, foundComment) {
        //comment_id takes the Comment actual Id, with findByID and puts it into foundComment,
        // 4 lines later it's being said it will show in the form as comment.
        if (err) {
            console.log(err);
        } else {
            //Att_id = req.params.id this refers to the URL. in the URL there's id, and it refers to this id.
            res.render("../views/comments/editComment", {Att_id: req.params.id, comment: foundComment});
        }
    });
    
});

// Comments update route
router.put("/:comment_id", checkCommentOwnership, function(req, res) {
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment) {
        // req.body.comment - we actually need the text, but in the form the "name" is comment[text] so all the info is in comment.
        if(err) {
            console.log(err)
        } else {
            req.flash("success", "Comment updates successfully")
            res.redirect("/Att/" + req.params.id)
        }
    });
});

//Comments delete route
router.delete("/:comment_id", checkCommentOwnership, function(req, res) {
    Comment.findByIdAndRemove(req.params.comment_id, function(err) {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/att/" + req.params.id);
        }
    });
});

// Middleware
function checkCommentOwnership(req, res, next){
    // is user logged in ? 
    if(req.isAuthenticated()){
          Comment.findById(req.params.comment_id, function(err, foundComment){
              if (err) {
          res.send("problem 1");
              } else {
                  // does the user own this specific comment?
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
                  console.log("Check comment ownership passed.");
                  next();
                } else {
                    // problem with finding the Att
                    res.send("wrong guy");
                }
             
              }
          });
    } else {
        // not authenticated 
        res.send("login");

    }
}
    






module.exports = router;
