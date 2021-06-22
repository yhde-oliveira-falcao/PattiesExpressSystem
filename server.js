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
 const receiverNumber = process.env.mynumber;
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
    secret: "Patties@Express_Supper!Reporter#Cookie)Session@Webpager...",
    duration: 60*60*1000,//1 hour session
    activeDuration: 1000*60*30
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
//https://stormpath.com/blog/everything-you-ever-wanted-to-know-about-node-dot-js-sessions
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

    if (username === "" || password === "" || username === "^*;" || password === "^*;" ) {
        return res.render("login", {errorMsg: "Missing Credentials.", layout: false});
    }

    UserModel.findOne({username: username})
        .exec()
        .then((usr) => {
            if (!usr) {
                res.render("login", {errorMsg: "login does not exist!", layout: false});
            } else {
                // user exists
                if (username === usr.username && password === usr.password && usr.isAdmin){
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
                else if (username === usr.username && password === usr.password){
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

app.get("/addProfile",/* ensureLogin,*/ (req,res)=>{
    //if(req.session.user.isAdmin === true){
        res.render("addProfile", {/*user: req.session.user, */layout: false});
    //} else {
    //    res.redirect("/Profile", session.persist);
   // }
});
//https://stormpath.com/blog/everything-you-ever-wanted-to-know-about-node-dot-js-sessions


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


/*app.post("/addProfile", function (req,res) {
    const Form_data = req.body;
    const addUser = {
        username: Form_data.username, 
        password: Form_data.password, 
        firstName: Form_data.firstname,    
        lastName: Form_data.lastname,          
        Email: Form_data.email,          
        Phone: Form_data.phone,        
        isAdmin: false
    };
    const newUser = new UserModel(addUser);
    newUser.save()
})*/

app.post("/AddProfile", function (req,res) {
    //if(req.session.user.isAdmin === true){
    var newUser = new UserModel({
        username: req.body.username, 
        password: req.body.password, 
        firstName: req.body.firstname,    
        lastName: req.body.lastname,          
        email: req.body.email,          
        phone: req.body.phone,        
        isAdmin: false
    });  
    console.log("got here!");
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

        //user.save((err)=>{});

    
    var mailNewUser = {
        from: process.env.mailerUser,
        to: req.body.email,
        subject: 'Welcome to Patties Reporting System',
        html: 
        "<p>Welcome to Patties Express Reporting System</p><br>"+
        "<p>Please keep your profile information updated</p>" +
        "<p>For security reasons, please update your password every semester</p> </br>" +
        "<p>Since every report sent generates a SMS and e-mail message, please keep it minimal</p>" +
        "<p>Do not hesitate to inquire about any doubts or issues. This service is in development, so please be patinet.</p>" +
        "</br></br><p>By subscribing to this service you agree to share your profile data and reports data with Patties Express staff and with the general public.</p>" +
        "<p>We make our best efforts to keep your data safe and private, but we cannot prevent all threats and data theft can happen.</p>"
        
    }

    var smsMessage = {
        body: "Welcome to Patties Reporting System" + 
        "\nFor more information about the reporting system, please check your email (check also the spam) or visit our reporting system page at https://evening-savannah-18144.herokuapp.com/" 
    }

    client.messages.create({
          to: /*req.body.phone*/receiverNumber, //to: '+12223333444'
          from: senderNumber,
          body: smsMessage.body
    })

    transporter.sendMail(mailNewUser, (error, info) => {
        if (error){
            console.log("ERROR: " + error);
        } else {
            console.log("SUCCESS: " + info.response);
        }
    });

   // res.render("/ProfilesDashboard");
//} 
//else {
 //   res.redirect("/Profile");
//}
});

app.get("/ProfilesDashboard", ensureLogin, (req,res)=>{
    //const user = req.session.user;
    //const isAdmin = user.isAdmin;
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

app.get("/report", ensureLogin, (req,res) => {
    ReportModel.find()
        .lean()
        .exec()
        .then((report) =>{
            res.render("report", {report: report, hasReport: !!report.length, user: req.session.user, layout: false});
        });
})

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
    const username = req.params.username;
    ReportModel.deleteOne({username: username})
        .then(()=>{
            res.redirect("/ProfilesDashboard");
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
          to: receiverNumber, //to: '+12223333444'
          from: senderNumber,
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
    if(req.session.user.isAdmin === true){
    const reportID = req.params.reportID;
    ReportModel.deleteOne({_id: reportID})
        .then(()=>{
            res.redirect("/report");
        });
    } else {
        res.redirect("/Profile");
    }
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

app.get("/secondrunsetup", (req,res)=> {
    var Aziz = new UserModel({
        username: 'aziz',
        password: '123456',
        firstName: 'Aziz',
        lastName: 'Unknown',
        email: 'unknown@gmail.com',
        phone: '',
        isAdmin: false
    });
    console.log("got here!");
    Aziz.save((err)=> {
        console.log("Error: " + err + ';');
        if (err) {
            console.log("There was an error creating Aziz: " + err);
        } else {
            console.log("Aziz was created");
        }
    });
    console.log("got here 2!");
    res.redirect("/");
})

/* #endregion */


app.listen(HTTP_PORT, onHttpStart);
