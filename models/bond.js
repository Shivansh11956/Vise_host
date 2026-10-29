const mongoose = require('mongoose');

const bondSchema = mongoose.Schema({
    userName: String,
    bondName : String,
    bondIssuer : String,
    maturityPeriod : String,
    date : Date,
    faceValue : Number,
    couponRate : Number
})

module.exports = mongoose.model("bond",bondSchema)