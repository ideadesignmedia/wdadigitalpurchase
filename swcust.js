//Creating Schema with Mongoose
const mongo = require('mongoose');
const wdacustSchema = mongo.Schema({
    _id: mongo.Schema.Types.ObjectId,
    firstName: String,
    lastName: String,
    email: String,
    address: Array,
    orders: Array
});
module.exports = mongo.model('wdacust', wdacustSchema, 'wdacust');