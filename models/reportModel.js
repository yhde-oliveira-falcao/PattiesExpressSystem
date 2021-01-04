// require mongoose and setup the Schema
const mongoose = require("mongoose");
const { stringify } = require("querystring");
const Schema = mongoose.Schema;

// use bluebird promise library with mongoose
mongoose.Promise = require("bluebird");

// car model
const reportSchema = new Schema({
    "_id": {
        type: Number
    },
    "X": Number,
    "R": Number,
    "NS": Number,
    "C": Number,
    "V": Number,
    "Cocobread": Number,
    "Cash": Number,
    "Debit": Number,
    "Tips": Number,
    "Drinks": String,
    "Extras": String,
});

module.exports = mongoose.model("dailyReport", reportSchema);