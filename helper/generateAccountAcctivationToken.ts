import { sign } from "jsonwebtoken";
import { activationTokenSecret } from "../secret";

export interface IRegistrationBody {
    name: string;
    email: string;
}


interface IActivationToken {
    token: string;
    activationCode: string;
}


export const createActivationToken = (user: IRegistrationBody): IActivationToken => {
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