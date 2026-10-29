const mongoose = require('mongoose');

let trackedFundSchema = mongoose.Schema({
    name : String,
    amcName : String,
    fundCode : Number,
    targetNAV : Number,
    status : Number,
    latestLog : String,
    lastUpdated : Date,
    email : String
})

module.exports = mongoose.model('trackedFund',trackedFundSchema)