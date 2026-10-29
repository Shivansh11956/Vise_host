const mongoose = require('mongoose');

const fixedSchema = mongoose.Schema({
    userName : String,
    fdName : String,
    fdType : String,
    maturityPeriod : String,
    date : Date,
    fdInvestment : Number,
    interestRate : Number
})

module.exports = mongoose.model("fixed",fixedSchema)