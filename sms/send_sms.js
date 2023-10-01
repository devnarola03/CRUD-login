const twilio = require('twilio');

const otp = Math.floor(1000 + Math.random() * 9000);

const recipientPhoneNumber = '+1234567890';

const client = twilio(process.env.ACCOUNT_SID, process.env.AUTH_TOKEN);

client.messages
    .create({
        body: `Your OTP is: ${otp}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: recipientPhoneNumber,
    })
    .then((message) => {
        console.log(`OTP sent: ${message.sid}`);
    })
    .catch((error) => {
        console.error('Error sending OTP:', error);
    });
