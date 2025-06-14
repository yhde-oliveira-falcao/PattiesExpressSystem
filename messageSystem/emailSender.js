var nodemailer = require("nodemailer");
const serverSide = require('../server');
var path = require("path");
require("dotenv").config({ path: ".env" }); 



//Configuration of the nodemailer (with GMAIL)
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

//EMAIL Message function
function emailMachine(messageType){
    transporter.sendMail(messageType, (error, info) => { //MAKE ASYNC FUNCTION ???
        if (error){
            console.log("ERROR: " + error);
        } else {
            console.log("SUCCESS: " + info.response);
        }
    });
} module.exports.emailMachine = emailMachine;

//Message Type New Users Welcome
function newUserMessage(toWhom){
    var mailNewUser = {
        from: process.env.mailerUser,
        to: toWhom,
        subject: 'Welcome to Patties Reporting System',
        html: 
        "<p>Welcome to Patties Express Reporting System</p><br>"+
        "<p>Please keep your profile information updated</p>" +
        "<p>For security reasons, please update your password every semester</p> </br>" +
        "<p>Since every report sent generates a SMS and e-mail message, please keep it minimal</p>" +
        "<p>Do not hesitate to inquire about any doubts or issues. This service is in development, so please be patinet.</p>" +
        "</br></br><p>By subscribing to this service you agree to share your profile data and reports data with Patties Express staff and with the general public.</p>" +
        "<p>We make our best efforts to keep your data safe and private, but we cannot prevent all threats and data theft can happen.</p>"
    };
    return mailNewUser;
}module.exports.newUserMessage = newUserMessage;

function reportMessage(toWhom){ //get session, .....no idea here....
    var mailOptions = {
        from: process.env.mailerUser,
        to: toWhom,
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
}
