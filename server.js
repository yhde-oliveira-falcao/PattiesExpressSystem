var HTTP_PORT = process.env.PORT || 8080;
var express = require("express");
var app = express();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
const ehbs = require('express-handlebars');


// setup a 'route' to listen on the default url path
app.get("/", (req, res) => {
    res.send("<h1> Hello World! </h1>");
});





// setup http server to listen on HTTP_PORT
app.listen(HTTP_PORT);
