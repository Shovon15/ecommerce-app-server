import { asyncHandler } from "./../utils/asyncHandler";
import { NextFunction, Request, Response } from "express";
import CustomError from "../utils/errorHandler";
import ResponseHandler from "../utils/responseHanlder";
import UserModel, { IUser } from "../models/userModel";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { activationTokenSecret, refreshTokenSecret } from "../secret";
import sendMail from "../config/sendMail";

interface ITokenOptions {
    httpOnly: boolean;
    sameSite: "lax" | "strict" | "none" | undefined;
    secure?: boolean;
}

interface IActivationToken {
    token: string;
    activationCode: string;
}

interface IRegistrationBody {
    name: string;
    email: string;
}

const createActivationToken = (user: IRegistrationBody): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
    const token = sign(
        {
            activationCode,
            user,
        },
        activationTokenSecret,
        {
            expiresIn: "5m",
        }
    );

    return {
        token,
        activationCode,
    };
};

const generateAccessAndRefereshTokens = async (userId: string) => {
    try {
        const user = await UserModel.findById({ _id: userId });
        if (!user) {
            throw new CustomError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new CustomError(500, "Something went wrong while generating referesh and access token");
    }
};
// test route////
export const user = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserModel.find({});
    return res.status(200).json(new ResponseHandler(200, { user }, "User return Successfully"));
});

export const userRegister = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    if ([email, name, password].some((field) => field?.trim() === "")) {
        throw new CustomError(400, "All fields are required");
    }

    const isEmailExist = await UserModel.findOne({
        $or: [{ email }],
    });

    let token;
    const registeredIUser: IRegistrationBody = {
        name,
        email,
    };

    if (isEmailExist && isEmailExist.isVerified === true) {
        throw new CustomError(400, "Email already in use.");

    } else if (isEmailExist && isEmailExist.isVerified === false) {
        token = createActivationToken(registeredIUser);

        console.log(token, "activation token and code")

        // const data = { user: { name }, activationCode: token.activationCode };
        // await sendMail({
        //     email: isEmailExist.email,
        //     subject: "Activate your account",
        //     template: "activationEmail.ejs",
        //     data,
        // });

    } else {
        token = createActivationToken(registeredIUser);

        console.log(token, "activation token and code")
        const user = await UserModel.create({
            email,
            password,
            name,
        });

        // const data = { user: { name }, activationCode: token.activationCode };
        // await sendMail({
        //     email: user.email,
        //     subject: "Activate your account",
        //     template: "activationEmail.ejs",
        //     data,
        // });
    }

    // const avatarLocalPath = req.file?.path;
    // if (!avatarLocalPath) {
    //     throw new CustomError(400, "Avatar file is required");
    // }

    // const avatar = await uploadOnCloudinary(avatarLocalPath);
    // // console.log(avatar, "avatar");

    // if (!avatar) {
    //     throw new CustomError(400, "Avatar file is required");
    // }

    return res.status(201).json(
        new ResponseHandler(
            201,
            {
                activationToken: token.token,
            },
            "User registered Successfully"
        )
    );
});

interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}
export const userActivation = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activation_token, activation_code } = req.body as IActivationRequest;

        // // Verify the activation token
        const decodedToken = verify(activation_token, activationTokenSecret) as {
            user: IUser;
            activationCode: string;
        };

        const { user, activationCode } = decodedToken;

        if (activation_code !== activationCode) {
            throw new CustomError(400, "Invalid code");
        }
        if (!decodedToken) {
            throw new CustomError(400, "Invalid token");
        }
        const existUser = await UserModel.findOne({ email: user.email });
        // const existUser = await findUserByEmail(UserModel, user.email);

        if (!existUser) {
            throw new CustomError(400, "user does not exist.");
        }

        existUser.isVerified = true;

        await existUser.save();

        return res.status(201).json(new ResponseHandler(201, { existUser }, "User verified Successfully"));
    } catch (error: any) {
        // Handle errors appropriately
        return next(new CustomError(400, error.message));
    }
});

interface ILoginRequest {
    email: string;
    password: string;
}
export const userLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { email, password: enteredPassword } = req.body as ILoginRequest;

    if (!(email || enteredPassword)) {
        throw new CustomError(400, "username or email is required");
    }

    const user = await UserModel.findOne({
        $or: [{ email }],
    }).select("+password");

    if (!user) {
        throw new CustomError(404, "User does not exist");
    }
    if (user && user.isVerified === false) {
        throw new CustomError(404, "Emial is not verified please signup");
    }

    const isPasswordValid = await user.comparePassword(enteredPassword);

    if (!isPasswordValid) {
        throw new CustomError(401, "Invalid user credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    const loggedInUser = await UserModel.findById(user._id).select(" -refreshToken");

    const options: ITokenOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "lax" 
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ResponseHandler(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken,
                },
                "User logged In Successfully"
            )
        );
});

interface ISocialBody {
    name: string;
    email: string;
    avatar: any;
}
export const socialAuth = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, avatar } = req.body;

        if (!(email || name)) {
            throw new CustomError(400, "username or email is required");
        }
        const existingUser = await UserModel.findOne({
            $or: [{ email }],
        });

        // const existingUser = await findUserByEmail(UserModel, email);
        // let accessToken;
        // let user;
        let accessToken;
        let refreshToken;

        if (!existingUser) {
            const newUser = await UserModel.create({ name, email, avatar, isVerified: true });
            ({ accessToken, refreshToken } = await generateAccessAndRefereshTokens(newUser._id));
        } else {
            ({ accessToken, refreshToken } = await generateAccessAndRefereshTokens(existingUser._id));
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json(
                new ResponseHandler(
                    200,
                    {
                        accessToken,
                        refreshToken,
                        existingUser,
                    },
                    "User logged In Successfully"
                )
        );
    } catch (error: any) {
        return next(new CustomError(400, error.message));
    }
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new CustomError(401, "unauthorized request");
    }

    try {
        const decodedToken = verify(incomingRefreshToken, refreshTokenSecret) as JwtPayload;

        const user = await UserModel.findById(decodedToken?.id);

        if (!user) {
            throw new CustomError(401, "Invalid refresh token");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new CustomError(401, "Refresh token is expired or used");
        }

        const options: ITokenOptions = {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
        };

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id);

        await UserModel.findByIdAndUpdate(user._id, { refreshToken: newRefreshToken });

        return (
            res
                .status(200)
                .cookie("accessToken", accessToken, options)
                .cookie("refreshToken", newRefreshToken, options)
                .json(
                    new ResponseHandler(
                        200,
                        {
                            accessToken,
                            refreshToken: newRefreshToken,
                        },
                        "Access token refreshed"
                    )
                )
        );
    } catch (error: any) {
        throw new CustomError(401, error?.message || "Invalid refresh token");
    }
});

interface CustomRequest extends Request {
    user?: any; // Define the user property
}
export const userLogout = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.user;
    await UserModel.findByIdAndUpdate(
        userId,
        {
            $unset: {
                refreshToken: 1, // this removes the field from document
            },
        },
        {
            new: true,
        }
    );

    const options: ITokenOptions = {
        httpOnly: true,
        secure: true,
        sameSite: "lax" 
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(
            new ResponseHandler(
                200,
                {
                    accessToken: "",
                    user: null,
                },
                "User logged Out"
            )
        );
});
export const userInfo = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.user;
    const accessToken = req.cookies;

    if (!userId) {
        return next(new CustomError(400, "User ID not provided in the request"));
    }

    const userInfo = await UserModel.findOne({
        $or: [{ _id: userId }],
    }).select("-password -refreshToken");

    if (!userInfo) {
        throw new CustomError(404, "User not found, Please login");
    }

    return res.status(200).json(new ResponseHandler(200, { user: userInfo, accessToken }, "User info"));
});
