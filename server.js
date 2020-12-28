var HTTP_PORT = process.env.PORT || 8080;

var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
const ehbs = require('express-handlebars');
const clientSessions = require("client-sessions");


const UserModel = require("./models/userModel");
const config = require("./js/config");



//CONFIGURATION
app.engine('.hbs', ehbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');

mongoose.connect(config.dbconn, {useNewUrlParser: true, useUnifiedTopology: true} )

app.use(express.static("views"));
app.use(express.static("public"));

app.use(clientSessions({
    cookieName: "Log Session",
    secret: "Data Storage Website",
    duration: 40*60*1000,
    activeDuration: 1000*60*40
}));
//Keep logged in!!!??? YES! With google login

app.use(bodyParser.urlencoded({extended: false }));


//SECURITY===============
function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
};
function ensureAdmin(req, res, next) {
    if (!user.isAdmin) {
      res.redirect("/login");
    } else {
      next();
    }
};//?????
//INCLUDE A FUNCTION TO SECURE THE DATA INPUT.



// setup a 'route' to listen on the default url path
app.get("/", function(req,res){
  res.render('home',{user: req.session.user, layout: false});
});

app.get("/login", (req,res)=>{
  res.render("login", {layout: false});
});

app.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  if (username === "" || password === "") {
      return res.render("login", {errorMsg: "Missing Credentials.", layout: false});
  }
  UserModel.findOne({username: username})
      .exec()
      .then((usr) => {
          if (!usr) {
              res.render("login", {errorMsg: "login does not exist!", layout: false});
          } else {
              // user exists
              if (username === usr.username && password === usr.password){
                  req.session.user = {
                      username: usr.username,
                      email: usr.email,
                      firstName: usr.firstName,
                      lastName: usr.lastName,
                      isAdmin: usr.isAdmin
                  };
                  res.redirect("/dashboard");
              } else {
                  res.render("login", {errorMsg: "login and password does not match!", layout: false});
              };
          };
      })
      .catch((err) => { console.log("An error occurred: ${err}")});
});
app.get("/logout", (req,res)=> {
  req.session.reset();
  res.render("login", {errorMsg: "invalid username or password!", layout: false});
});

app.get("/dashboard", ensureLogin, (req,res) => {
  res.render("dashboard", {user: req.session.user, layout: false});
});




// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT);
