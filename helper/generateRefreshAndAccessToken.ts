import UserModel from "../models/userModel";
import CustomError from "../utils/errorHandler";


export const generateAccessAndRefereshTokens = async (userId: string) => {
    try {
        const user = await UserModel.findById({ _id: userId });
        if (!user) {
            throw new CustomError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return {
            accessToken,
            refreshToken
        };
    } catch (error) {
        throw new CustomError(500, "Something went wrong while generating referesh and access token");
    }
};