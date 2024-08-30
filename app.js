require('dotenv').config();
const express = require("express");
const app = express();

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require("twilio")(accountSid, authToken);

app.use(express.json()); // To parse JSON bodies

// In-memory storage for OTPs (could also use a database)
let otpStore = {};

const sendSMS = async (to, body) => {
  let msgOptions = {
    from: process.env.TWILIO_FROM_NUMBER,
    to,
    body
  };
  try {
    const message = await client.messages.create(msgOptions);
    console.log("Message sent: ", message.sid);
  } catch (error) {
    console.log(error);
  }
};

app.get("/", (req, res) => {
  const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a 6-digit OTP
  const to = process.env.TO_NUMBER;

  otpStore[to] = {
    otp: generatedOTP,
    expiresAt: Date.now() + 5 * 60 * 1000 // OTP expires in 5 minutes
  };

  sendSMS(to, `Your OTP is: ${generatedOTP}`);
  res.send("OTP sent successfully");
});

app.post("/verify-otp", (req, res) => {
  const { otp, to } = req.body;

  if (otpStore[to]) {
    if (Date.now() > otpStore[to].expiresAt) {
      return res.status(400).send("OTP expired");
    }

    if (otpStore[to].otp === otp) {
      delete otpStore[to]; // OTP is verified, remove it from storage
      return res.send("OTP verified successfully");
    } else {
      return res.status(400).send("Invalid OTP");
    }
  } else {
    return res.status(400).send("No OTP found for this number");
  }
});

app.listen(8080, () => {
  console.log("Server is running on port 8080");
});
