/* #region REQUIRES */
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var path = require("path");
const ehbs = require('express-handlebars');
const clientSessions = require("client-sessions");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt'); const saltRounds = 11; 

//const passport = require('passport'); //IMPLEMENT THIS IN THE FUTURE...(google, facebook and twitter logins...)
var nodemailer = require("nodemailer");

const emailSender = require('./messageSystem/emailSender')

require("dotenv").config({ path: ".env" }); 

 const accountSid = process.env.TWILIO_ACCOUNT_SID;
 const AuthToken = process.env.TWILIO_AUTH_TOKEN;
 const receiverNumber = process.env.bossnumber;
 const senderNumber = process.env.twilioNumber;

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
    secret: process.env.clientSessionsSecret, 
    duration: 60*60*1000,//1 hour session
    activeDuration: 1000*60*30
}));

app.use(bodyParser.urlencoded({extended: false }));


/* #endregion */

/* #region SECURITY */
function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect("/");
    } else {
      next();
    }
};
//https://stormpath.com/blog/everything-you-ever-wanted-to-know-about-node-dot-js-sessions
/* #endregion */

/* #region ROUTES */
    /* #region LOGIN LOGOUT */
    //=====================THE HOME PAGE IS THE LOGIN PAGE========================
app.get("/", (req,res)=>{
    if(!req.session.user){
        res.render("login", {layout: false});
    } else if(req.session.user) {
        res.render("Profile", {user: req.session.user, layout: false});
    }
});

app.post("/login", async (req, res)  => {
    const username = req.body.username;
    const password = req.body.password;

    if (username === "" || password === "" || username === "^*;" || password === "^*;" ) {
        return res.render("login", {errorMsg: "Missing Credentials.", layout: false});
    }

    UserModel.findOne({username: username})
        .exec()
        .then(async (usr) => {
            //https://www.loginradius.com/blog/async/hashing-user-passwords-using-bcryptjs/
            if (!usr) {
                res.render("login", {errorMsg: "login does not exist!", layout: false});
            } else {
                const validPassword = await bcrypt.compare(password, usr.password);
                // user exists
                if (username === usr.username && validPassword === true /*password === validPassword*//*usr.password*/ && usr.isAdmin){
                    req.session.user = {
                        username: usr.username,
                        email: usr.email,
                        phone: usr.phone,
                        firstName: usr.firstName,
                        lastName: usr.lastName,
                        isAdmin: usr.isAdmin
                    };
                    res.redirect("/report");
                }
                else if (username === usr.username && validPassword === true /*password === validPassword*//*usr.password*/){
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
    res.render("login", {errorMsg: "Please login your username and password below.", layout: false});
});
/* #endregion */

    /* #region PROFILES */
app.get("/Profile", ensureLogin, (req,res)=>{
   res.render("Profile", {user: req.session.user, layout: false});
});

app.get("/Profile/Edit", ensureLogin, (req,res)=>{
    res.render("ProfileEdit", {user: req.session.user, layout: false});
});

app.get("/addProfile",/* ensureLogin,*/ (req,res)=>{
    //if(req.session.user.isAdmin === true){
        res.render("addProfile", {/*user: req.session.user, */layout: false});
    //} else {
    //    res.redirect("/Profile", session.persist);
   // }
});
//https://stormpath.com/blog/everything-you-ever-wanted-to-know-about-node-dot-js-sessions


app.post("/AddProfile", async (req,res) => {
    //if(req.session.user.isAdmin === true){
    try{
        //const hashedPassword = await bcrypt.hash(req.body.password, saltRounds, funtion(err, hash))
        const salt = await bcrypt.genSalt(saltRounds);
        const userPassword = await bcrypt.hash(req.body.password, salt);
        var newUser = new UserModel({
            username: req.body.username, 
            password: userPassword/*bcrypt.hash(req.body.password, salt)*/, 
            firstName: req.body.firstname,    
            lastName: req.body.lastname,          
            email: req.body.email,          
            phone: req.body.phone,        
            isAdmin: false
        });
 
        newUser.save((err)=> {
            console.log("Error: " + err + ';');
            if (err) {
                console.log("There was an error creating newUser: " + err);
            } else {
                console.log("newUser was created");
            }
        });
        console.log("got here 2!");
        res.redirect("/");

        emailSender.emailMachine(emailSender.newUserMessage(req.body.email));

        /*var smsMessage = {
            body: "Welcome to Patties Reporting System" + 
            "\nFor more information about the reporting system, please check your email (check also the spam) or visit our reporting system page at https://evening-savannah-18144.herokuapp.com/" 
        }
        client.messages.create({
            to: req.body.phone, //to: '+12223333444'
            from: senderNumber,
            body: smsMessage.body
        })*/
    } catch{
        res.redirect('/logout');
    }
});

app.get("/ProfilesDashboard", ensureLogin, (req,res)=>{
    if(req.session.user.isAdmin === true){
        UserModel.find()
        .lean()
        .exec()
        .then((users) =>{
            res.render("ProfilesDashboard", {users: users, hasUser: !!users.length, user: req.session.user, layout: false});
        });
        //res.render("ProfilesDashboard", {user: req.session.user, layout: false});
    } else {
        res.redirect("/Profile");
    }
});


app.get("/Profile/Edit/:username", ensureLogin, (req,res) => {
    const username = req.params.username;
    if(req.session.user.isAdmin === true){
        UserModel.findOne({username: username})
            .lean()
            .exec()
            .then((user)=>{
                res.render("ProfileEdit", {user: req.session.user, user: user, editmode: true, layout: false})
            .catch((err)=>{});
        });
    } else {
        res.redirect("/ProfileDashboard", {user: req.session.user});
    }
});

app.get("/Profile/Delete/:username", ensureLogin, (req, res) => {
    if(req.session.user.isAdmin === true){
    const usrname = req.params.username;
    UserModel.deleteOne({username: usrname})
        .then(()=>{
            res.redirect("/ProfilesDashboard");
            //res.redirect("/Profile");
        });
    } else {
        res.redirect("/Profile");
    }
})


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
});

app.get("/report/Edit/:reportID", ensureLogin, (req,res) => {
    const reportID = req.params.reportID;

    ReportModel.findOne({_id: reportID})
        .lean()
        .exec()
        .then((report)=>{
            res.render("reportEdit", {user: req.session.user, report: report, editmode: true, layout: false})
        //.catch(()=>{});
    });
});

app.get("/report/Delete/:reportID", ensureLogin, (req, res) => {
    if(req.session.user.isAdmin === true){
    const reportID = req.params.reportID;
    ReportModel.deleteOne({_id: reportID})
        .then(()=>{
            res.redirect("/report");
        });
    } else {
        res.redirect("/Profile");
    }
});

app.post("/report/Edit", ensureLogin, (req,res) => {
    
    const report = new ReportModel({
        _id: req.body.ID,       //
        empID: req.body.empID,
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

    if (req.body.edit === "1") { //SOLVE THIS BUG!!!
        ReportModel.updateOne(
            {_id: report._id},
            { $set: {
                //_id: report._id,
                empID: report.empID,
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
            ).exec()
            .then(()=>{
                report.save(()=>{});
            });
    } else { 
        report.save((err)=>{});
    };

    var mailOptions = {
        from: process.env.mailerUser,
        to: process.env.myemail,
        subject: 'Patties Daily Report',
        html: 
        "<p>Report For the Day!</p><br>"+
        "<p>Date: " + req.body.ID + "</p>" +
        "<p>Employee: " + req.body.empID + "</p>" +
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
    emailSender.emailMachine(mailOptions);

    var smsMessage = {
        body: "Date: " + req.body.ID + 
        "/n/nEmployee: " + req.body.empID +
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
          to: receiverNumber, //to: '+12223333444'
          from: senderNumber,
          body: smsMessage.body
    })
    
    /*transporter.sendMail(mailOptions, (error, info) => {
        if (error){
            console.log("ERROR: " + error);
        } else {
            console.log("SUCCESS: " + info.response);
        }
    });*/

    res.redirect("/report");
});

/* #endregion */


app.listen(HTTP_PORT, onHttpStart);
