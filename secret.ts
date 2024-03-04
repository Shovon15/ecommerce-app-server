import { Secret } from "jsonwebtoken";

require("dotenv").config({ path: ".env" });

const serverPort = process.env.PORT!;

const mongoDbUrl = process.env.MONGO_URI!;

const activationTokenSecret = process.env.ACTIVATION_TOKEN_SECRET! as Secret;
const accessTokenSecret = process.env.ACCESS_TOKEN! as Secret;
const refreshTokenSecret = process.env.REFESH_TOKEN! as Secret;

const cloudName = process.env.CLOUD_NAME;
const cloudApiKey = process.env.CLOUD_API_KEY;
const cloudApiSecret = process.env.CLOUD_API_SECRET;

export {
    serverPort,

    mongoDbUrl,

    activationTokenSecret,
    accessTokenSecret,
    refreshTokenSecret,

    cloudName,
    cloudApiKey,
    cloudApiSecret,
}