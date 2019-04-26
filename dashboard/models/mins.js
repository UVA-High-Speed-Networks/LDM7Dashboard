var mongoose = require('mongoose');

var minsSchema = new mongoose.Schema({
    date: Date,
    completeSize: Number,
    receivedSize: Number,
    aggregatedLatency: Number,
    completeProd: Number,
    receivedProd: Number,
    maxLatencySize: Number,
    maxLatency: Number,
    minThruSize: Number,
    minThruLatency: Number,
    avgThru: Number,
    minThru: Number,
    maxLatencyThru: Number,
    percentile80Thru: Number,
    ffdrProd: Number,
    ffdrSize: Number,
    feedtype: String,
    hostname: String,
    negativeLatencyNum: Number
    },
    { collection : 'test' }
);

// Export model.
module.exports = mongoose.model('Mins', minsSchema);
