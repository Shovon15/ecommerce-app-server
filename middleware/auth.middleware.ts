import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";
import { accessTokenSecret } from "../secret";
import CustomError from "../utils/errorHandler";
import { NextFunction, Request, Response } from "express";
import UserModel from "../models/userModel";

import { JwtPayload } from "jsonwebtoken";

interface CustomRequest extends Request {
	user?: any; // Define the user property
}
export const isAuthenticated = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
	try {
		const access_token = req.body.token;
		// const refresh_token = req.cookies.refreshToken;
		// console.log(refresh_token, "refresh_token")
		
		if (!access_token) {
			return next(new CustomError(400, "Please login to access this resource."));
		}

		const decoded = jwt.verify(access_token, accessTokenSecret) as JwtPayload;

		if (!decoded) {
			return next(new CustomError(400, "Access token is not valid."));
		}

		const user = await UserModel.findById(decoded?.id).select("-refreshToken");

		if (!user) {
			return next(new CustomError(400, "User session not found in Redis. please login"));
		}

		req.user = user._id.toString();
		req.cookies = access_token;

		next();
	} catch (error: any) {
		throw new CustomError(400, error.message || "Access token is not valid.")
	}
});
