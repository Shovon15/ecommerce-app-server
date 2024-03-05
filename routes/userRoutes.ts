import { Router } from "express";
import { userRegister, userLogin, userLogout, userInfo, refreshAccessToken, user, socialAuth, userActivation } from "../controller/userController";
import { upload } from "../middleware/multer.middleware";
import { isAuthenticated } from "../middleware/auth.middleware";

const userRouter = Router();

// userRouter.post(
//     "/signup",
//     upload.fields([
//         {
//             name: "avatar",
//             maxCount: 1,
//         },
//     ]),
//     userRegister
// );
userRouter.post("/signup", upload.single("avatar"), userRegister);
userRouter.post("/login", userLogin);
userRouter.post("/user-activation", userActivation);
userRouter.post("/social-login", socialAuth);
userRouter.post("/refresh-access-token", refreshAccessToken);
userRouter.post("/logout", isAuthenticated, userLogout);
userRouter.post("/user-info", isAuthenticated, userInfo);

//test route (get all user)
// userRouter.get("/user", user);


export default userRouter;
