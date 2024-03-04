import { Router } from "express";
import { createCategory, getCategory } from "../controller/projectController";


const projectRouter = Router();

projectRouter.post("/create-category", createCategory);
projectRouter.get("/get-category", getCategory);



export default projectRouter;
