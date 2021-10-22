const nodemailer = require("nodemailer");

let mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.email,
    pass: process.env.pswd,
  },
});

async function sendmail(maildetails) {
  await mailTransporter.sendMail(maildetails, (err, data) => {
    if (err) {
      console.error(err);
    } else {
      console.log(`Email sent to ${maildetails.to}`);
    }
  });
}

module.exports = sendmail;
