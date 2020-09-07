const mongo = require('mongoose');
const wdavisitorSchema = mongo.Schema({
    _id: mongo.Schema.Types.ObjectId,
    ip: {type: String, required: true, unique: true},
    visits: {type: Number, required: true},
    visit: {type: Array, "visited" : [
        {
            date: Date,
            page: Array
        }
    ]}
});
module.exports = mongo.model('wdaVisitor', wdavisitorSchema);