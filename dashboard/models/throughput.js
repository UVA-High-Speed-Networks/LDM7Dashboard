var mongoose = require('mongoose');

var throuputSchema = new mongoose.Schema(
    {
    date: {type: Date, required: true},
    // throughput: {type: Float64Array, required: true},
    feedtype: String,
    hostname: String,
    receivedSize: Number,
    receivedDelay: Number
    },
    { collection : 'mins' }
);

// Export model.
module.exports = mongoose.model('Throughput', throuputSchema);