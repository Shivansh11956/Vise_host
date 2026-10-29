const mongoose = require('mongoose');

const trackedFixedSchema = mongoose.Schema({
    userName : String,
    fdName : String,
    fdType : String,
    maturityPeriod : String,
    date : Date,
    fdInvestment : Number,
    interestRate : Number,
    status : Number,
    lastLog : String,
    lastUpdated : String
})

module.exports = mongoose.model("trackedfixed",trackedFixedSchema)