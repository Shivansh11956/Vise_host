const mongoose = require('mongoose');

const helpSchema = mongoose.Schema({
    user : String,
    firstName : String,
    lastName : String,
    email : String,
    countryCode : String,
    phoneNumber : Number,
    description : String
})

module.exports = mongoose.model("help",helpSchema)