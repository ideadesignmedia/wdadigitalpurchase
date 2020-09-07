// REQUIREMENTS FOR APP TO RUN
const express = require('express');
const app = express();
const dotenv = require('dotenv');
const loggingtool = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongo = require('mongoose')
const fs = require('fs')
app.set('trust proxy', true);
dotenv.config();
app.use(loggingtool('dev'));
mongo.connect("mongodb://localhost/db2", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}).then(() => console.log('Successful MongoDB Connection'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', true)
    if (req.method === 'OPTIONS') {
        res.header('Access-Control-Allow-Methods', 'PUT, POST, PATCH, DELETE, GET');
        return res.status(200).json({});
    }
    next();
});
const track = require('./idmtrack')
app.use('/favicon.ico', (req, res) => {
    res.writeHead(200, {'Content-type': 'image/ico'})
    fs.readFile('./public/favicon.ico', (err, data) => {
        if (err) {
            return res.status(500).json({
                error: true,
                message: 'Issue Processing Your Request'
            })
        } else {
            res.write(data)
        }
        res.end()
    })
})
app.use('/static', express.static('./public'))
const Visitor = require('./visitor');
app.post('/tracking', (req, res) => {
    let page = req.body.page
    let target = req.body.target
    let event = req.body.event
    if (event && page && target) {
        const cat = (req.headers['x-forwarded-for'] || req.connection.remoteAddress || '').split(',')[0].trim() || req.ip
        let dateDisplay = new Date();
        Visitor.findOne({ip: cat}).then(result => {
            if (!result) {
                let visitor = new Visitor({
                    _id: new mongo.Types.ObjectId(),
                    ip: cat,
                    visits: 1,
                    visit: [{
                        date: dateDisplay,
                        page: [page, {target: target, event: event}]
                    }]
                })
                visitor.save().then(()=>{
                    return res.status(200).json({
                        error: false
                    })
                }).catch((e) => {
                    res.status(500).json({
                        message: 'PAGE FAILED PLEASE TRY AGAIN | IDM Error Code:5991'
                    });
                });      
            } else if (result) {
                result.visits += 1
                result.visit.push({date: dateDisplay, page: [page, {target: target, event: event}]})
                console.log(`TRACKED: date:${dateDisplay}, page: [${page}, {target: ${target}, event: ${event}}`)
                result.save().then((result) => {
                    return res.status(200).json({
                        error: false
                    })
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
})
app.get('/robots.txt', (req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'})
    fs.readFile('./robots.txt', (err, data) => {
        if (err) {
            res.write('error loading robots')
        } else {
            res.write(data)
        }
        res.end();
    })
})
const stripe = require('stripe')(process.env.STRIPE);
const mailer = require('./mailer')
const Customer = require('./swcust')
const Order = require('./sworder')
const Product = require('./swprod')
app.get('/products', (req, res) => {
    Product.find({}).exec().then(result => {
        return res.status(200).json({
            error: false,
            products: result
        })
    }).catch((e)=> {
        console.log(e)
        return res.status(500).json({
            message: 'error loading products',
            error: true
        })
    });
})
app.post('/confirmpayments', (req, res) => {
    const customer = req.body.customer;
    console.log(customer)
    Customer.findOne({email: customer.email}, (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json({
                message: 'failed to find user',
                error: true
            })
        }
        if (!result) {
            return res.status(500).json({
                message: 'failed to find user',
                error: true
            })
        }
        if (result) {
            let inca = result.orders[result.orders.length - 1]
            Order.findOne({_id: inca}, (err, order) => {
                if (err){
                    console.log(err);
                    return res.status(500).json({
                        message: 'failed to find order',
                        error: true
                    })
                }
                if (!order) {
                    return res.status(500).json({
                        message: 'failed to find order',
                        error: true
                    })
                }
                if (order) {
                    order.paid = true
                    order.save().then(async saved => {
                        console.log(saved)
                        res.status(200).json({
                            message: 'order updated',
                            error: false
                        })
                        let digital
                        await Product.findOne({name: 'Digital Download'}, (err, item) => {
                            if (err) {console.log(err); return digital = null}
                            if (!item) {return digital = null}
                            if (item) {
                                console.log(`DIGITAL PRODUCT ID IS = ${item._id}`)
                                for (let i = 0; i < saved.orderItems.length; i++) {
                                    console.log('compare to ' + saved.orderItems[i].product)
                                    if (JSON.stringify(saved.orderItems[i].product) === JSON.stringify(item._id)) {
                                        console.log('MATCH')
                                        digital = `Please download your video at the link below:
                            
                                        <br><a style="padding: 10px 15px; margin: 10px; border-radius: 50px; background-color: #a1dfdd, color: black; text-decoration: none; font-weight: 800; text-align: cetner;" href="https://ots.influenced.link/download?${saved._id}">DOWNLOAD</a><br>
                                        
                                        If you have any issues with your download link or any questions, please contact us at 480-795-3340 or email us at info@wagnerdance.com. You can download the video as many times as you would like.`                                    
                                    }
                                }
                                    return digital
                            }
                        })
                        let download = digital ? digital : '';
                        let body = `Hello ${result.firstName},

                        <br>Thank you for your purchase of the video recording of our fall production, Our Time to Shine. ${download}
                        
                        If you have ordered a DVD copy be sure to pick it up at the front desk following any of your classes.
                        
                        <br> We love having you as part of our Wagner Dance Family. Our next production is Holidazzle this winter, date to be announced, and it will feature all of our dancers!
                        
                        <br>Thank you,
                        
                        <br>Denise Wagner, Director`
                        mailer.sendEmail(saved.customer, `THANK YOU FOR YOUR ORDER #${saved._id} || Wagner Dance Arts`, body).then(result => {
                            if (!result) {
                                mailer.error(`Failed to send info to the client for successful payment, ${customer} for ${JSON.stringify(order)}`)
                            }
                        }).catch(e => mailer.error(e))
                    }).catch((err)=> {
                        console.log(err);
                        return res.status(500).json({
                            message: 'failed to save order',
                            error: true
                        })
                    });
                }
            })
        }
    })
})
app.post('/createintents', (req, res) => {
    const order = req.body[1].cartSelection
    const customer = req.body[0].customer;
    let details = []
    Product.find({}).exec().then(result => {
        if (result.length >= 1) {
            reveal = function(){
                let total = 0
                result.forEach(product => {
                for(i = 0; i < order.length; i++) {
                    console.log(order[i].product + ' ' + product._id)
                    if (order[i].product == product._id) {
                        details.push({product: product._id, quantity: order[i].quantity})
                        total = total + (product.price * parseInt(order[i].quantity))
                    }
                }
                })
                return total
            }
            let sway = reveal()
            stripe.paymentIntents.create({
                amount: sway * 100,
                currency: 'usd',
                // Verify your integration in this guide by including this parameter
                metadata: {integration_check: 'accept_a_payment'},
            }, (err, intent) => {
                if (err) {
                    console.log(err)
                    return res.status(500).json({
                        message: 'issue processing your request',
                        error: true
                    })
                }
                if (intent) {
                    let orderdate = new Date()
                    let orderid = new mongo.Types.ObjectId()
                    let theorder = Order({
                        _id: orderid,
                        customer: customer.email,
                        orderDate: orderdate,
                        orderItems: details,
                        paymentInfo: intent.id,
                        paymentAmount: intent.amount/100,
                        paid: false,
                        completed: false
                    })
                    theorder.save().then(neworder => {
                        if (neworder) {
                            Customer.findOne({email: customer.email}, (err, user) => {
                                if (err) {
                                    console.log(err)
                                    return res.status(500).json({
                                        message: 'issue processing your request',
                                        error: true
                                    })
                                }
                                if (!user) {
                                    let uad
                                    if (customer.address) {
                                        uad = [customer.address]
                                    } else {
                                        uad = []
                                    }
                                    const nu = new Customer({
                                        _id: new mongo.Types.ObjectId(),
                                        firstName: customer.firstName,
                                        lastName: customer.lastName,
                                        email: customer.email,
                                        address: uad,
                                        orders: [orderid] 
                                    })
                                    nu.save().then(saved => {
                                        console.log(saved)
                                        return res.status(200).json({
                                            client_secret: intent.client_secret,
                                            _id: neworder._id,
                                            error: false
                                        });
                                    }).catch(e => {
                                        console.log(e)
                                        return res.status(500).json({
                                            error: true
                                        })
                                    })
                                }
                                if (user) {
                                    if (customer.address) {
                                        user.address.push(customer.address)
                                    }
                                    user.orders.push(orderid)
                                    user.save().then(saved => {
                                        console.log(saved);
                                        return res.status(200).json({
                                            client_secret: intent.client_secret,
                                            _id: neworder._id,
                                            error: false
                                        });
                                    }).catch(e => {
                                        console.log(e)
                                        return res.status(500).json({
                                            error: true
                                        });
                                    })
                                }
                            })
                        }
                    }).catch((e)=>{console.log(e)});
                }
            }).catch((e) => {
                console.log(e)
                return res.status(500).json({
                    message: 'issue processing your request',
                    error: true
                })
            });
        } else {
            res.status(500).json({
                message: 'issue processing your request',
                error: true
            });
        }
    })
})
app.post('/newprod', (req, res) => {
    if (req.body.password !== 'm321654987' || req.body.identifier !== '@') return res.status(500).json({error: true, auth: false})
    let price = req.body.price
    let quantity = req.body.quantity
    const product = new Product({
        _id: new mongo.Types.ObjectId(),
        name: req.body.name,
        price: price,
        quantity: quantity,
        image: req.body.image,
        description: req.body.description
    })
    console.log(product)
    product.save().then(saved => {
        console.log(saved)
        res.status(200).json({product: saved})
    }).catch((e) => {
        console.log(e)
        res.status(500).json({
            error: true
        })
    });
})
app.post('/update/:id', (req, res) => {
    if (!req.body.identifier === '@' || !req.body.password === 'm321654987') return res.status(500).json({error: true})
    Product.findOne({_id: req.body._id}, (err, prod) => {
        if (err) {
            return res.status(500).json({
                error: true,
                message: err
            })
        }
        if (!prod) {
            return res.status(500).json({
                error: true,
                message: 'Failed to update product, Could not find Product'
            })
        }
        if (req.body.quantity) prod.quantity = req.body.quantity
        if (req.body.name) prod.name = req.body.name
        if (req.body.price) prod.price = req.body.price
        if (req.body.description) prod.description = req.body.description
        if (req.body.image) prod.image = req.body.image
        prod.save().then(result => {
            return res.status(200).json({
                error: false,
                update: result
            })
        }).catch(e => {
            return res.status(500).json({
                error: true,
                message: e
            })
        })
    })
})
app.delete('/prod/:id', (req, res) => {
    if (req.body.password !== 'm321654987' || req.body.identifier !== '@') return res.status(500).json({error: true, auth: false})
    Product.findOneAndDelete({_id: req.params.id}, (err, deleted) => {
        if (err) {
            res.status(500).json({error: true})
        } else {
            res.status(200).json({error: false})
        }
    })
})
app.delete('/allprods', (req, res) => {
    if (req.body.password !== 'm321654987' || req.body.identifier !== '@') return res.status(500).json({error: true, auth: false})
    Product.deleteMany({}, (err, del) => {
        if (err) {
            console.log(err)
            return res.status(500).json({
                error: true
            })
        } else {
            return res.status(200).json({
                error: false
            })
        }
    })
})
app.post('/markcompleted', (req, res) => {
    Order.findOne({_id: req.body.id}, (err, order) => {
        if (err) {
            return res.status(500).json({
                error: true
            })
        }
        if (!order) {
            return res.status(500).json({
                error: true
            })
        }
        if (order) {
            order.completed = true
            order.save().then(saved => {
                return res.status(200).json({
                    error: false,
                    order: order
                })
            }).catch((e)=>{
                console.log(e)
                return res.status(500).json({
                    error: true
                })
            })
        }
    })
})

//
app.get('/', track, (req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html'})
    fs.readFile('./public/checkout.html', (err, data) => {
        if (err) {
            console.log(err);
            res.status(500).json({
                message: 'error loading page',
                error: true
            })
        }
        if (data) {
            res.write(data)
        }
        return res.end()
    })
})
app.get('/download', (req, res) => {
    let o = req.originalUrl.split('?')
    Order.findOne({_id: o[1]}, (err, order) => {
        if (err) {
            console.log(err)
            return res.status(500).json({message: 'failed to load downloadpage'})
        }
        if (!order) {
            return res.status(404).json({message: 'Page not found.'})
        }
        if (order) {
            Product.findOne({name: 'Digital Download'}, (err, dd) => {
                if (err) {
                    console.log(err)
                    return res.status(500).json({
                        error: true,
                        message: 'couldnt'
                    })
                }
                if (!dd) {
                    console.log('tt')
                    return res.status(500).json({
                        error: true,
                        message: 'couldnt'
                    })
                }
                if (dd) {
                    let check = order.orderItems.map(item => {return item.product})
                    console.log(JSON.stringify(check))
                    if (check.includes(dd._id)) {
                        res.writeHead(200, { 'Content-Type': 'text/html'})
                        fs.readFile('./download.html', (err, data) => {
                            if (err) {
                                console.log(err);
                                res.status(500).json({
                                    message: 'error loading page',
                                    error: true
                                })
                            }
                            if (data) {
                                res.write(data)
                            }
                            return res.end()
                        })
                    } else {
                        return res.status(500).json({error: true, message: 'failed to find that item in your orders'})
                    }
                } else {
                    return res.status(500).json({message: `I am having trouble finding a record of your purchase of our digital download. If this is a mistake, please reach out to our staff to resolve this issue.`})
                }
        })
        }
    })
})
app.use((req, res, next) => {
    const error = new Error('page not found');
    error.status = 404;
    next(error);
});
app.use((error, req, res, next) => {
    res.status(error.status || 500);
    res.json({
        error: {
            message: error.message
        }
    });
});
module.exports = app