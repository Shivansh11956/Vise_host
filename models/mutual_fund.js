const mongoose = require('mongoose');

const mutualSchema = mongoose.Schema({
    userName : String,
    fundName : String,
    fundCode : BigInt,
    navArr : [Number],
    investedAmount : [Number],
    boughtUnits : [Number],
    buyingDates : [Date],
    assettClass : [String]
})

module.exports = mongoose.model("mutual",mutualSchema)