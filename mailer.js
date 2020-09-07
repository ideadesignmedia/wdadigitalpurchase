const nm = require('nodemailer');
const gs = require('./gs')
genVerif = function(){
    return Math.round((Math.random() * 1000) + 2020).toString() + 'IDMGEN' + Math.round((Math.random() * 1000) + 2020).toString()
}
sendEmail = function(email, subject, message){
    return new Promise(async (res, rej) => {
        let transporter = nm.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
              type: 'OAuth2',
              user: 'info@ideadesignmedia.com',
              serviceClient: gs.client_id,
              privateKey: gs.private_key
            },
            tls: {
                rejectUnauthorized: false
            }
          });
        await transporter.verify()
        let response = {
            from: '"Wagner Dance Arts" <info@ideadesignmedia.com>', // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            // plain text body
            text: `META TAG (title): Email
            ${message}
           `,
            // html body
            html: `<!doctype html>
            <html>
            <head>
            <meta charset="utf-8">
            <title>Email</title>
            </head>
            <body style="max-width: 100%; padding: 10px; overflow-X: hidden;">
            <div style="text-align: center; background: black; width: 100%; min-height: 100vh; margin:0px; padding-top: 100px;">
                <h1 style="font-size: 32px; max-width: 100%; padding: 20px; margin: 10px 0px; color:#a1dfdd">SUCCESSFUL DIGITAL PURCHASE OF OUR TIME TO SHINE</h1>
                <p style="font-size: 16px; max-width: 100%; padding: 0px 20px; margin: 0px; color: white">${message}</p>
                <a href="https://wagnerdancearts.com"><h2 style="font-size: 20px; color: #34497D; text-decoration: none; margin-top: 10px; text-align: right; padding: 20px; max-width: 100%;">Wagner Dance</h2></a>
            </div>
            </body>
            </html>`
        }
        transporter.sendMail(response, (err, info) => {
            if (err) {
            console.log(err);
            return res(false)
            }
            if (info) {
            console.log(`message sent to: ${email} info: ${JSON.stringify(info)}`);
            return res(true)
            }
        })
    })
}
notifysam = function(err){
    sendEmail(process.env.ADMINEMAIL, '- IDM NEWSBOT - ALERT - URGENT - ERROR PROVIDING NEWS TO USERS', err)
}
module.exports = {
    sendEmail: sendEmail,
    error: notifysam
}