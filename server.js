/* #region REQUIRES */
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
const ehbs = require('express-handlebars');
const clientSessions = require("client-sessions");
const mongoose = require("mongoose");
const config = require("./js/config");

//const CarModel = require("./models/carModel");
const UserModel = require("./models/userModel");
const { response } = require("express");

/* #endregion */

/* #region CONFIGURATIONS */
app.engine('.hbs', ehbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');

var HTTP_PORT = process.env.PORT || 8080;

mongoose.connect(config.dbconn, {useNewUrlParser: true, useUnifiedTopology: true} )

function onHttpStart() {
    console.log("Express http server listing on: " + HTTP_PORT);
    };

app.use(express.static("views"));
app.use(express.static("public"));
    
app.use(clientSessions({
    cookieName: "session",
    secret: "web322_week10_demoSession",
    duration: 2*60*1000,
    activeDuration: 1000*60
}));

app.use(bodyParser.urlencoded({extended: false }));

/* #endregion */

/* #region SECURITY */
function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/login");
    } else {
      next();
    }
};
/* #endregion */

/* #region ROUTES */
app.get("/", function(req,res){
    res.render('home',{user: req.session.user, layout: false});
});

    /* #region LOGIN LOGOUT */
app.get("/login", (req,res)=>{
        //req.session.destroy(null);
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
/* #endregion */

    /* #region PROFILES */
app.get("/Profile", ensureLogin, (req,res)=>{
   res.render("Profile", {user: req.session.user, layout: false});
});

app.get("/Profile/Edit", ensureLogin, (req,res)=>{
    res.render("ProfileEdit", {user: req.session.user, layout: false});
});

app.post("/Profile/Edit", ensureLogin, (req,res) => {
    const username = req.body.username;
    const firstName = req.body.firstname;
    const lastName = req.body.lastname;
    const Email = req.body.email;
    const isAdmin = (req.body.isAdmin === "on");
    UserModel.updateOne(
        { username: username },
        {$set: {
            firstName: firstName,
            lastName: lastName,
            email: Email,
            isAdmin: true
        }}
    ).exec()
    .then(()=>{
        req.session.user = {
            username: username,
            email: Email,
            firstName: firstName,
            lastName: lastName,
            isAdmin: isAdmin
        };
        res.redirect("/Profile");
    });    
});

/* #endregion */

app.get("/dashboard", ensureLogin, (req,res) => {
    res.render("dashboard", {user: req.session.user, layout: false});
});

/* #region CARS */ 
/*app.get("/Cars", ensureLogin, (req,res) => {
    CarModel.find()
        .lean()
        .exec()
        .then((cars) =>{
            res.render("cars", {cars: cars, hasCars: !!cars.length, user: req.session.user, layout: false});
        });
})*/

/*app.get("/Cars/Edit", ensureLogin, (req,res) => {
    res.render("carEdit", {user: req.session.user, layout: false});
})*/

/*app.get("/Cars/Edit/:carid", ensureLogin, (req,res) => {
    const carid = req.params.carid;

    CarModel.findOne({_id: carid})
        .lean()
        .exec()
        .then((car)=>{
            res.render("carEdit", {user: req.session.user, car: car, editmode: true, layout: false})
        .catch(()=>{});
    });
});*/

/*app.get("/Cars/Delete/:carid", ensureLogin, (req, res) => {
    const carid = req.params.carid;
    CarModel.deleteOne({_id: carid})
        .then(()=>{
            res.redirect("/Cars");
        });
})*/

/*app.post("/Cars/Edit", ensureLogin, (req,res) => {
    const car = new CarModel({
        _id: req.body.ID,
        year: req.body.year,
        make: req.body.make,
        model: req.body.model,
        VIN: req.body.VIN,
        colour: req.body.colour
    });

    if (req.body.edit === "1") {
        // editing
        CarModel.updateOne({_id: car._id},
            { $set: {
                year: car.year,
                make: car.make,
                model: car.model,
                VIN: car.VIN,
                colour: car.colour
            }}
            ).exec().then((err)=>{});
           
         //car.updateOne((err)=>{});

    } else { 
        //adding
        car.save((err)=>{});
    };

    res.redirect("/cars");

});*/
/* #endregion */

app.get("/firstrunsetup", (req,res)=> {
    var Clint = new UserModel({
        username: 'yuri',
        password: 'password',
        firstName: 'Yuri',
        lastName: 'Falcao',
        email: 'yhofalcao@gmail.com',
        isAdmin: true
    });
    console.log("got here!");
    Clint.save((err)=> {
        console.log("Error: " + err + ';');
        if (err) {
            console.log("There was an error creating Yuri: " + err);
        } else {
            console.log("Yuri was created");
        }
    });
    console.log("got here 2!");
    res.redirect("/");
})

/* #endregion */


app.listen(HTTP_PORT, onHttpStart);
