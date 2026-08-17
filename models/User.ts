import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true, select: false },
    language: { type: String, enum: ["en", "ar"], default: "en" },
  },
  { timestamps: true }
);

export type UserDocument = InferSchemaType<typeof userSchema>;
const User = (models.User as Model<UserDocument>) || model<UserDocument>("User", userSchema);

export default User;
