import { asyncHandler } from "./../utils/asyncHandler";
import { NextFunction, Request, Response } from "express";
import CustomError from "../utils/errorHandler";
import ResponseHandler from "../utils/responseHanlder";
import UserModel from "../models/userModel";
import { uploadOnCloudinary } from "../utils/cloudinary";
import { JwtPayload, sign, verify } from "jsonwebtoken";
import { activationTokenSecret, refreshTokenSecret } from "../secret";

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
            activationCode, user
        },
        activationTokenSecret,
        {
            expiresIn: "5m"
        }
    );

    return {
        token,
        activationCode
    };
};

const generateAccessAndRefereshTokens = async (userId: string) => {
    try {
        const user = await UserModel.findById({ _id: userId })
        if (!user) {
            throw new CustomError(404, "User not found");
        }

        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new CustomError(500, "Something went wrong while generating referesh and access token")
    }
}

export const user = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const user = await UserModel.find({});
    return res.status(200).json(
        new ResponseHandler(
            200,
            { user },
            "User return Successfully"
        ));
});

export const userRegister = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;

    if ([email, name, password].some((field) => field?.trim() === "")) {
        throw new CustomError(400, "All fields are required");
    }

    const isEmailExist = await UserModel.findOne({
        $or: [{ email }],
    });

    if (isEmailExist) {
        throw new CustomError(400, "Email already in use.");
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
    const registeredIUser: IRegistrationBody = {
        name, email
    }

    const token = createActivationToken(registeredIUser)

    const user = await UserModel.create({
        // avatar: {
        //     public_id: avatar.public_id,
        //     url: avatar.url,
        // },
        email,
        password,
        name,
    });

    return res.status(201).json(
        new ResponseHandler(
            201,
            { activationToken: token.token },
            "User registered Successfully"
        ));
});

interface ILoginRequest {
    email: string;
    password: string;
}
export const userLogin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {

    const { email, password: enteredPassword } = req.body as ILoginRequest;

    if (!(email || enteredPassword)) {
        throw new CustomError(400, "username or email is required")
    }

    const user = await UserModel.findOne({
        $or: [{ email }]
    }).select('+password');

    if (!user) {
        throw new CustomError(404, "User does not exist")
    }

    const isPasswordValid = await user.comparePassword(enteredPassword)

    if (!isPasswordValid) {
        throw new CustomError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await UserModel.findById(user._id).select(" -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }


    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ResponseHandler(
                200,
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
});



export const refreshAccessToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new CustomError(401, "unauthorized request")
    }

    try {
        const decodedToken = verify(
            incomingRefreshToken,
            refreshTokenSecret
        ) as JwtPayload

        const user = await UserModel.findById(decodedToken?.id);

        if (!user) {
            throw new CustomError(401, "Invalid refresh token")
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new CustomError(401, "Refresh token is expired or used")

        }

        const options = {
            httpOnly: true,
            secure: true
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefereshTokens(user._id)

        return res
            .status(200)
            // .cookie("accessToken", accessToken, options)
            // .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ResponseHandler(
                    200,
                    {
                        accessToken, refreshToken: newRefreshToken
                    },
                    "Access token refreshed"
                )
            )
    } catch (error: any) {
        throw new CustomError(401, error?.message || "Invalid refresh token")
    }

})

interface CustomRequest extends Request {
    user?: any; // Define the user property
}
export const userLogout = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.user;
    await UserModel.findByIdAndUpdate(
        userId,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ResponseHandler(200,
            {
                accessToken: "",
                user: null
            }, "User logged Out"))
})
export const userInfo = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    const userId = req.user;
    const accessToken = req.cookies;

    if (!userId) {
        return next(new CustomError(400, "User ID not provided in the request"));
    }

    const userInfo = await UserModel.findOne({
        $or: [{ _id: userId }]
    }).select('-password -refreshToken');;

    if (!userInfo) {
        throw new CustomError(404, "User not found, Please login");
    }

    return res
        .status(200)
        .json(new ResponseHandler(200, { user: userInfo, accessToken }, "User info"))
})


