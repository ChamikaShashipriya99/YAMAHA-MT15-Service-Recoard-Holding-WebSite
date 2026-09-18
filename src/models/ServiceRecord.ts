import mongoose, { Schema, Document, Model } from "mongoose";

export interface IServiceRecord extends Document {
    id?: string;
    date: string;
    mileage: number;
    oilChange: boolean;
    filterChange: boolean;
    notes?: string;
    cost?: string;
    type?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const ServiceRecordSchema = new Schema<IServiceRecord>(
    {
        date: {
            type: String,
            required: [true, "Date is required"],
        },
        mileage: {
            type: Number,
            required: [true, "Mileage is required"],
        },
        oilChange: {
            type: Boolean,
            default: false,
        },
        filterChange: {
            type: Boolean,
            default: false,
        },
        notes: {
            type: String,
            default: "",
        },
        cost: {
            type: String,
            default: "",
        },
        type: {
            type: String,
            default: "Maintenance",
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret: Record<string, any>) => {
                ret.id = ret._id ? ret._id.toString() : ret.id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
        toObject: {
            virtuals: true,
            transform: (_doc, ret: Record<string, any>) => {
                ret.id = ret._id ? ret._id.toString() : ret.id;
                delete ret._id;
                delete ret.__v;
                return ret;
            },
        },
    }
);

export const ServiceRecordModel: Model<IServiceRecord> =
    mongoose.models.ServiceRecord ||
    mongoose.model<IServiceRecord>("ServiceRecord", ServiceRecordSchema);

export default ServiceRecordModel;
