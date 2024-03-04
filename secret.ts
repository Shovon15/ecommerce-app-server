require("dotenv").config({ path: ".env" });

const serverPort = process.env.PORT!;

export {
    serverPort
}