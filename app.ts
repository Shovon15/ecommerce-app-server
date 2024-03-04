import express, { NextFunction, Request, Response } from "express"
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import { clientOrigin } from "./secret";
// import userRouter from "./routes/userRoutes";
// import { ErrorHandler } from "./utils/error";
// import projectRouter from "./routes/projectRoutes";

export const app = express();

// middleware--------------------
// app.use(express.json({ limit: "100mb" }));
// app.use(cors({
//     origin: clientOrigin,
//     credentials: true,

// }));
// app.use(cookieParser());

//routes
// app.use("/api/v1", userRouter);
// app.use("/api/v1/project", projectRouter);

app.get("/", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).send({
        success: true,
        message: "Welcome to Shovon portfolio server!!!",
    });
});

// app.use(ErrorHandler);