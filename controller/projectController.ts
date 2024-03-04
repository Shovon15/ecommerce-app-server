import { NextFunction, Request, Response } from "express";
import { asyncHandler } from "./../utils/asyncHandler";
import ResponseHandler from "../utils/responseHanlder";
import CategoryModel from "../models/categoryModel";
import CustomError from "../utils/errorHandler";

interface ICategory {
    name: string;
}
export const createCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { name } = req.body as ICategory;
    if (!name) {
        throw new CustomError(400, "category name is required")
    }
    const processedName = name.trim().replace(/\s+/g, "_").toLowerCase();

    await CategoryModel.create({
        name,
        value: processedName,
    });

    return res.status(200).json(new ResponseHandler(200, {}, "category create successfully"));
});
export const getCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const category = await CategoryModel.find({});
    if (category.length <= 0) {
        throw new CustomError(400, "no category item found")
    }

    return res.status(200).json(new ResponseHandler(200, { category }, "category return successfully"));
});
