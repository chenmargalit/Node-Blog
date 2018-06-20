var express     = require("express"),
    app         = express(),
    methodOverride = require("method-override"),
    bodyParser = require("body-parser"),
    mongoose = require("mongoose"),
    expressSanitizer = require("express-sanitizer"),
    Attraction = require("./models/attractions"),
    Comment = require("./models/comments"),
    passport = require("passport"),
    LocalStrategy = require("passport-local"),
    PassportLocalMongoose = require("passport-local-mongoose"),
    User = require("./models/user"),
    flash = require("connect-flash");
    require('dotenv').config()


 
    
var commentRoutes = require("./routes/comments"),
    attractionRoutes = require("./routes/attractions"),
    indexRoutes = require("./routes/index");
 
mongoose.connect("mongodb://chen:worms12@ds247410.mlab.com:47410/chen_berlin");
// mongoose.connect("mongodb://localhost/BerlinDemo");    
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer());
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(flash());

app.use(require("express-session")({
    secret: "This could be anything",
    resave: false,
    saveUninitialized: false
}));

app.locals.moment = require('moment');

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    console.log(req.user);
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();
});

app.use(indexRoutes);
app.use("/att/:id/comment", commentRoutes);
app.use("/att", attractionRoutes);


app.get("/", function(req, res) {
    res.render("landing")
});
    


  
    
 
    
    
    
    
    
    
    
app.listen(process.env.PORT, process.env.IP, function(){
   console.log("Server is on");
});




