import { Secret } from "jsonwebtoken";

require("dotenv").config({ path: ".env" });

const serverPort = process.env.PORT!;
const clientOrigin = process.env.CLIENT_ORIGIN!;
const mongoDbUrl = process.env.MONGO_URI!;

const activationTokenSecret = process.env.ACTIVATION_TOKEN_SECRET! as Secret;
const accessTokenSecret = process.env.ACCESS_TOKEN! as Secret;
const refreshTokenSecret = process.env.REFESH_TOKEN! as Secret;


//cloudinary
const cloudName = process.env.CLOUD_NAME;
const cloudApiKey = process.env.CLOUD_API_KEY;
const cloudApiSecret = process.env.CLOUD_API_SECRET;

//modemailer
const smtpHost = process.env.SMTP_HOST;
const smtpPort = process.env.SMTP_PORT;
const smtpPassword = process.env.SMTP_PASSWORD;
const smtpService = process.env.SMTP_SERVICE;
const smtpMail = process.env.SMTP_MAIL;

export {
    serverPort,
    clientOrigin,

    mongoDbUrl,

    activationTokenSecret,
    accessTokenSecret,
    refreshTokenSecret,

    cloudName,
    cloudApiKey,
    cloudApiSecret,

    smtpHost,
    smtpPort,
    smtpPassword,
    smtpService,
    smtpMail,
}