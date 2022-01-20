const mailer = require("nodemailer")
const mailInfo = require('../config.json').mailInfo

module.exports = {
    createTransporter: function(){
        return mailer.createTransport({
            service: mailInfo.service,
            auth: {
                user: mailInfo.user,
                pass: mailInfo.pass
            }
        })
    },
    sendMail: function(destination, subject, content, callback){
        const mailOption = {
            from: mailInfo.user,
            to: destination,
            subject: subject, 
            text: content
        }

        const tranporter = this.createTransporter()
        tranporter.sendMail(mailOption, callback)
    }
}