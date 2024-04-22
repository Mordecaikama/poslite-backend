const nodemailer = require('nodemailer')
require('dotenv').config()

// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com',
//   port: 465,
//   secure: true,
//   service: 'gmail',
//   auth: {
//     user: process.env.Nodemailer_email,
//     pass: `${process.env.Nodemailer_pass}`,
//   },
// })

// then add
// template key with value to the file path to the options

// const options = {
//   from: 'agyapongmordecai@gmail.com',
//   to: 'mezleme3@gmail.com',
//   subject: 'sending email from sendmail',
//   text: 'trying for the firstime using nodejs to send from backend to you man',
// }

const transporter = nodemailer.createTransport({
  host: 'smtppro.zoho.eu',
  secure: true,
  port: 465,
  auth: {
    user: process.env.Nodemailer_email,
    pass: process.env.Nodemailer_pass,
  },
})

module.exports = {
  transporter,
}
