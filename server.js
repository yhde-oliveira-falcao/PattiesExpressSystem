/* #region REQUIRES */
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
const ehbs = require('express-handlebars');
const clientSessions = require("client-sessions");
const mongoose = require("mongoose");
var nodemailer = require("nodemailer");

const config = require("./js/config");

const ReportModel = require("./models/reportModel");
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

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'reportsendPatties@gmail.com',
        
        pass: 'PattiesReport'
    },
});

/* #endregion */

/* #region SECURITY */
function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/");
    } else {
      next();
    }
};
/* #endregion */

/* #region ROUTES */
/*app.get("/", function(req,res){
    res.render('home',{user: req.session.user, layout: false});
});*/

    /* #region LOGIN LOGOUT */
    //=====================THE HOME PAGE IS THE LOGIN PAGE========================
app.get("/", (req,res)=>{
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
                        phone: usr.phone,
                        firstName: usr.firstName,
                        lastName: usr.lastName,
                        isAdmin: usr.isAdmin
                    };
                    res.redirect("/report");
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
    const Phone = req.body.phone;
    const isAdmin = (req.body.isAdmin === "on");
    UserModel.updateOne(
        { username: username },
        {$set: {
            firstName: firstName,
            lastName: lastName,
            email: Email,
            phone: Phone,
            isAdmin: true
        }}
    ).exec()
    .then(()=>{
        req.session.user = {
            username: username,
            email: Email,
            phone: Phone,
            firstName: firstName,
            lastName: lastName,
            isAdmin: isAdmin
        };
        res.redirect("/Profile");
    });    
});

/* #endregion */
app.get("/report", ensureLogin, (req,res) => {
    ReportModel.find()
        .lean()
        .exec()
        .then((report) =>{
            res.render("report", {report: report, hasReport: !!report.length, user: req.session.user, layout: false});
        });
})

/*app.get("/report", ensureLogin, (req,res) => {
    res.render("report", {user: req.session.user, layout: false});
});*/

app.get("/report/Edit", ensureLogin, (req,res) => {
    res.render("reportEdit", {user: req.session.user, layout: false});
})

app.post("/report/Edit", ensureLogin, (req,res) => {
    const report = new ReportModel({
        _id: req.body.ID,
        X: req.body.X,
        R: req.body.R,
        NS: req.body.NS,
        C: req.body.C,
        V: req.body.V,
        Cocobread: req.body.Cocobread,
        Cash: req.body.Cash,
        Debit: req.body.Debit,
        Tips: req.body.Tips,
        Drinks: req.body.Drinks,
        Extras: req.body.Extras
    });
    if (req.body.edit === "1") {
        reportModel.updateOne({_id: report._id},
            { $set: {
                X: report.X,
                R: report.R,
                NS: report.NS,
                C: report.C,
                V: report.V,
                Cocobread: report.cocobread,
                Cash: report.cash,
                Debit: report.debit,
                Tips: report.tips,
                Drinks: report.drinks,
                Extras: report.extras
            }}
            ).exec().then((err)=>{});
    } else { 
        report.save((err)=>{});
    };
    var mailOptions = {
        from: 'YuriWeb322@gmail.com',
        to: 'yhofalcao@gmail.com',
        subject: 'Welcome to YUYUBnB',
        html: '<p> Mr(s). ' + ":</p><br/> <p>Welcome!!! :D </p>" +
        "<p>Thank you for joining the best rental service in the world!</p><br>"+
        "<p>Check out more information at our website</p> <br>"+
    "https://shrouded-bastion-62981.herokuapp.com"    
    }
    transporter.sendMail(mailOptions, (error, info) => {
        if (error){
            console.log("ERROR: " + error);
        } else {
            console.log("SUCCESS: " + info.response);
        }
    });

    res.redirect("/report");
});

app.get("/report/Edit/:reportID", ensureLogin, (req,res) => {
    const reportID = req.params.reportID;

    ReportModel.findOne({_id: reportID})
        .lean()
        .exec()
        .then((report)=>{
            res.render("reportEdit", {user: req.session.user, report: report, editmode: true, layout: false})
        .catch(()=>{});
    });
});

app.get("/report/Delete/:reportID", ensureLogin, (req, res) => {
    const reportID = req.params.reportID;
    ReportModel.deleteOne({_id: reportID})
        .then(()=>{
            res.redirect("/report");
        });
})


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
    var Yuri = new UserModel({
        username: 'yuri',
        password: 'password',
        firstName: 'Yuri',
        lastName: 'Falcao',
        email: 'yhofalcao@gmail.com',
        phone: '',
        isAdmin: true
    });
    console.log("got here!");
    Yuri.save((err)=> {
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
