import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInsuranceInfo {
    provider: string;
    policyNumber: string;
    policyType: string;
    issueDate: string;
    expiryDate: string;
    premiumCost?: string;
    emergencyHotline?: string;
    notes?: string;
    documentPhotoUrl?: string;
}

export interface IRevenueLicenseInfo {
    licenseNumber: string;
    provincialCouncil: string;
    issueDate: string;
    expiryDate: string;
    fee?: string;
    notes?: string;
    documentPhotoUrl?: string;
}

export interface IEmissionTestInfo {
    testCenter: string;
    certificateNumber: string;
    issueDate: string;
    expiryDate: string;
    status: "PASS" | "FAIL" | "PENDING";
    fee?: string;
    notes?: string;
    documentPhotoUrl?: string;
}

export interface IVehicleCompliance extends Document {
    bikeIdentifier: string;
    insurance: IInsuranceInfo;
    revenueLicense: IRevenueLicenseInfo;
    emissionTest: IEmissionTestInfo;
    updatedAt: Date;
    createdAt: Date;
}

const VehicleComplianceSchema = new Schema<IVehicleCompliance>(
    {
        bikeIdentifier: {
            type: String,
            required: true,
            unique: true,
            default: "YAMAHA_MT15_PRIMARY",
        },
        insurance: {
            provider: { type: String, default: "Sri Lanka Insurance // General" },
            policyNumber: { type: String, default: "POL-MT15-2026-9912" },
            policyType: { type: String, default: "Comprehensive (Full)" },
            issueDate: { type: String, default: "2026-03-15" },
            expiryDate: { type: String, default: "2027-03-14" },
            premiumCost: { type: String, default: "Rs. 24,500" },
            emergencyHotline: { type: String, default: "0112 357 357" },
            notes: { type: String, default: "Zero depreciation cover with personal accident protection" },
            documentPhotoUrl: { type: String, default: "" },
        },
        revenueLicense: {
            licenseNumber: { type: String, default: "WP-RL-2026-081923" },
            provincialCouncil: { type: String, default: "Western Province" },
            issueDate: { type: String, default: "2026-04-10" },
            expiryDate: { type: String, default: "2027-04-09" },
            fee: { type: String, default: "Rs. 2,850" },
            notes: { type: String, default: "Motorcycle 155cc annual road tax" },
            documentPhotoUrl: { type: String, default: "" },
        },
        emissionTest: {
            testCenter: { type: String, default: "DriveGreen (CleanCo)" },
            certificateNumber: { type: String, default: "VET-DG-882194" },
            issueDate: { type: String, default: "2026-04-08" },
            expiryDate: { type: String, default: "2027-04-07" },
            status: { type: String, enum: ["PASS", "FAIL", "PENDING"], default: "PASS" },
            fee: { type: String, default: "Rs. 1,650" },
            notes: { type: String, default: "Hydrocarbons & CO levels within nominal threshold" },
            documentPhotoUrl: { type: String, default: "" },
        },
    },
    {
        timestamps: true,
    }
);

const VehicleCompliance: Model<IVehicleCompliance> =
    mongoose.models.VehicleCompliance ||
    mongoose.model<IVehicleCompliance>("VehicleCompliance", VehicleComplianceSchema);

export default VehicleCompliance;
