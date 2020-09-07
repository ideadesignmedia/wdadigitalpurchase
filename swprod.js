//Creating Schema with Mongoose
const mongo = require('mongoose');
const wdaprodSchema = mongo.Schema({
    _id: mongo.Schema.Types.ObjectId,
    name: String,
    price: Number,
    quantity: Number,
    image: String,
    description: String
});
module.exports = mongo.model('wdaprod', wdaprodSchema, 'wdaprod');