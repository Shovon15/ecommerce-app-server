import mongoose, { Schema, Document, model, models, Model } from 'mongoose';


export interface ICategory extends Document {
    name: string;
    value: string;
}

const categorySchema: Schema<ICategory> = new Schema({
    name: {
        type: String,
        required: [true, 'name is required']
    },
    value: {
        type: String,
        trim: true,
        unique: true,
        lowercase: true,
        required: [true, 'value is required']
    },

}, { timestamps: true });



const CategoryModel: Model<ICategory> = (models.Category || mongoose.model<ICategory>('Category', categorySchema)) as Model<ICategory>;

export default CategoryModel;