import { InferSchemaType, Model, Schema, model, models } from "mongoose";

const messageSchema = new Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 30000 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
);

const chatSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 80 },
    language: { type: String, enum: ["en", "ar"], default: "en" },
    messages: { type: [messageSchema], default: [] },
  },
  { timestamps: true }
);

chatSchema.index({ userId: 1, updatedAt: -1 });

export type ChatDocument = InferSchemaType<typeof chatSchema>;
const Chat = (models.Chat as Model<ChatDocument>) || model<ChatDocument>("Chat", chatSchema);

export default Chat;
