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

// setup a 'route' to listen on the default url path
app.get("/", (req, res) => {
    res.send("<h1> Hello World! </h1>");
});





// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT);
