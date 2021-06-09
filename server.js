/* #region REQUIRES */
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
const ehbs = require('express-handlebars');
const clientSessions = require("client-sessions");
const mongoose = require("mongoose");
var nodemailer = require("nodemailer");
require("dotenv").config({ path: ".env" }); 

 const accountSid = process.env.TWILIO_ACCOUNT_SID;
 const AuthToken = process.env.TWILIO_AUTH_TOKEN;
// const client = require('twilio')(accountSid, AuthToken);

var twilio = require('twilio');

// Find your account sid and auth token in your Twilio account Console.
var client = new twilio(accountSid, AuthToken);
//const config = require("./js/config");

const ReportModel = require("./models/reportModel");
const UserModel = require("./models/userModel");
const { response } = require("express");

/* #endregion */

/* #region CONFIGURATIONS */
app.engine('.hbs', ehbs({ extname: '.hbs' }));
app.set('view engine', '.hbs');

var HTTP_PORT = process.env.PORT || 8080;

mongoose.connect(process.env.dbconn, {useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex:true} )


function onHttpStart() {
    console.log("Express http server listing on: " + HTTP_PORT);
};

app.use(express.static("views"));
app.use(express.static("public"));
    
app.use(clientSessions({
    cookieName: "session",
    secret: "web322_week10_demoSession",
    duration: 20*60*1000,
    activeDuration: 1000*60
}));

app.use(bodyParser.urlencoded({extended: false }));

var transporter = nodemailer.createTransport({
    host: "gmail.com",
    secure: false, //https://github.com/nodemailer/nodemailer/issues/406
    port: 25,
    service: 'gmail',
    auth: {
        user: process.env.mailerUser,      
        pass: process.env.mailerPassword
    },
    tls: {
        rejectUnauthorized: false
    }
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
                    res.redirect("/report/Edit");
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
        _id: req.body.ID,       //
        X: req.body.X,          //
        R: req.body.R,          //=
        NS: req.body.NS,        //==
        C: req.body.C,          //=====
        V: req.body.V,          //=========
        Cocobread: req.body.Cocobread,//============>>Create a new model (for the reports). It will be sent to the database
        Cash: req.body.Cash,    //==========
        Debit: req.body.Debit,  //=====
        Tips: req.body.Tips,    //==
        Drinks: req.body.Drinks,//=
        Extras: req.body.Extras //
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
        from: process.env.mailerUser,
        to: 'yhofalcao@gmail.com',
        subject: 'Patties Daily Report',
        html: 
        "<p>Report For the Day!</p><br>"+
        "<p>Date: " + req.body.ID + "</p>" +
        "<p>X: " + req.body.X + "</p>" +
        "<p>R: " + req.body.R + "</p>" +
        "<p>NS: " + req.body.NS + "</p>" +
        "<p>C: " + req.body.C + "</p>" +
        "<p>V: " + req.body.V + "</p>" +
        "<p>Cocobread: " + req.body.Cocobread + "</p>" +
        "<p>Cash: " + req.body.Cash + "</p>" +
        "<p>Debit: " + req.body.Debit + "</p>" +
        "<p>Tips: " + req.body.Tips + "</p>" +
        "<p>Drinks: " +  req.body.Drinks + "</p>" +
        "<p>Extras: " + req.body.Extras + "</p>" 
        
    }

    var smsMessage = {
        
        body: "Date: " + req.body.ID + 
        "\n\nX: " + req.body.X +  
        "\nR: " + req.body.R +  
        "\nNS: " + req.body.NS +  
        "\nC: " + req.body.C + 
        "\nV: " + req.body.V +  
        "\n\nCocobread: " + req.body.Cocobread +  
        "\nCash: " + req.body.Cash + 
        "\nDebit: " + req.body.Debit +  
        "\nTips: " + req.body.Tips +  
        "\n\nDrinks: " +  req.body.Drinks +  
        "\n\nExtras: " + req.body.Extras +
        "\n\n This is a test of Patties Express Inventory Management web application \n\nThank you so much and have a great night" 
    }

      client.messages.create({
          to: process.env.mynumber, //to: '+16478484848'
          from: process.env.twilioNumber,
          body: smsMessage.body
     })

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
        lastName: 'Yuri',
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
