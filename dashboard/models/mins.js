var mongoose = require('mongoose');

var minsSchema = new mongoose.Schema({
    date: Date,
    completeSize: Number,
    receivedSize: Number,
    receivedDelay: Number,
    completeProd: Number,
    receivedProd: Number,
    throughput: Number,
    ffdrProd: Number,
    ffdrSize: Number,
    feedtype: String,
    hostname: String
    },
    { collection : 'test' }
);

// Export model.
module.exports = mongoose.model('Mins', minsSchema);
