// require mongoose and setup the Schema
const mongoose = require("mongoose");
const { stringify } = require("querystring");
const Schema = mongoose.Schema;

// use bluebird promise library with mongoose
mongoose.Promise = require("bluebird");

// car model
const userSchema = new Schema({
    "username": {
        type: String,
        unique: true },
    "password": String,
    "firstName": String,
    "lastName": String,
    "email": {
        type: String,
        unique: true },
    "isAdmin": FALSE
});

module.exports = mongoose.model("users", userSchema);