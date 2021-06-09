const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = require('twilio')(accountSid, authToken);

client.messages.create({
    to: process.env.MY_PHONE_NUMBER,
    from: '+1',
    body: 'This is a testing message.....'
})
.then((message) => console.log(message.sid));