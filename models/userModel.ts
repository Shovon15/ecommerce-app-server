import mongoose, { Schema, Document, model, models, Model } from 'mongoose';
import bcrypt from "bcryptjs";
// import { idText } from 'typescript';
// import { accessTokenExpireTime, accessTokenSecret, refreshTokenSecret } from '../secret';
import { sign } from 'jsonwebtoken';
import { accessTokenSecret, refreshTokenSecret } from '../secret';

export interface IAvatar {
    public_id: string;
    url: string;
}

export interface IUser extends Document {
    name: string;
    email: string;
    password?: string;
    avatar: IAvatar;
    refreshToken: string;
    isVerified: boolean;
    comparePassword: (password: string) => Promise<boolean>;
    generateAccessToken: () => string;
    generateRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new Schema({
    name: {
        type: String,
        required: [true, 'name is required']
    },
    email: {
        type: String,
        required: [true, "email is required"],
        trim: true,
        unique: true,
        lowercase: true,
        validate: {
            validator: function (value: string) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(value);
            },
            message: "Please enter a valid email",
        },
    },
    password: {
        type: String,
        // required: [true, "password is required"],
        trim: true,
        minLength: [6, "password should be minimum 6 charectures"],
        select: false,

    },
    avatar: {
        public_id: String,
        url: String,
    },
    refreshToken: {
        type: String
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });



//encrypt password
userSchema.pre<IUser>('save', async function (next) {
    try {

        if (this.password && this.isModified('password')) {
            const salt = await bcrypt.genSalt(10);
            this.password = await bcrypt.hash(this.password, salt);
        }

        next();
    } catch (error: any) {
        return next(error);
    }
});

// generate access token
userSchema.methods.generateAccessToken = function () {

    return sign(
        {
            id: this._id,
            email: this.email
        },
        accessTokenSecret,
        {
            expiresIn: "5m",
        }
    );
};

// generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return sign(
        {
            id: this._id,
        },
        refreshTokenSecret,
        {
            expiresIn: "5m",
        }
    );
}

//compare password
userSchema.methods.comparePassword = async function (enteredPassword: string): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password)
}

const UserModel: Model<IUser> = (models.Users || mongoose.model<IUser>('Users', userSchema)) as Model<IUser>;

export default UserModel;