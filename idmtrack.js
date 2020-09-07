const mongo = require('mongoose');
const Visitor = require('./visitor');
module.exports = (req, res, next) => {
    const cat = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim() || req.ip
    const inca = req.originalUrl;
    let dateDisplay = new Date();
    Visitor.findOne({ip: cat}).then(result => {
        if (!result) {
            let visitor = new Visitor({
                _id: new mongo.Types.ObjectId(),
                ip: cat,
                visits: 1,
                visit: [{
                    date: dateDisplay,
                    page: [inca]
                }]
            })
            visitor.save().then(()=>{
                return next();
            }).catch((e) => {
                res.status(500).json({
                    message: 'PAGE FAILED PLEASE TRY AGAIN | IDM Error Code:5991'
                });
            });      
        } else if (result) {
            if (dateDisplay - result.visit[result.visit.length - 1].date < 1000) {
                return next()
            }
            result.visits += 1
            result.visit.push({date: dateDisplay, page: [inca]})
            result.save().then(() => {
                return next();
            }).catch((e) => {
            res.status(500).json(
                {message: 'PAGE FAILED PLEASE TRY AGAIN | IDM Error Code:5990'}
                );
            });
        }
    }).catch((e)=>{
        res.status(500).json({
            message: 'PAGE FAILED PLEASE TRY AGAIN | IDM Error Code:5989'
        });
    });
}