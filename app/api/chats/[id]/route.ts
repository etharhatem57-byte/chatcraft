import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, unauthorizedResponse } from "@/lib/auth";
import { deleteChat, getChat, renameChat } from "@/lib/data";
import { forbiddenResponse, isSameOrigin } from "@/lib/security";
import { renameChatSchema } from "@/lib/validation";

interface Context { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: Context) {
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();
  try {
    const { id } = await context.params;
    const chat = await getChat(user.id, id);
    if (!chat) return NextResponse.json({ error: "Conversation not found.", code: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Get chat failed", error);
    return NextResponse.json({ error: "Unable to load conversation.", code: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: Context) {
  if (!isSameOrigin(request)) return forbiddenResponse();
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();
  try {
    const body = renameChatSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid title.", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    const { id } = await context.params;
    const chat = await renameChat(user.id, id, body.data.title);
    if (!chat) return NextResponse.json({ error: "Conversation not found.", code: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ chat });
  } catch (error) {
    console.error("Rename chat failed", error);
    return NextResponse.json({ error: "Unable to rename conversation.", code: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: Context) {
  if (!isSameOrigin(request)) return forbiddenResponse();
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();
  try {
    const { id } = await context.params;
    const deleted = await deleteChat(user.id, id);
    if (!deleted) return NextResponse.json({ error: "Conversation not found.", code: "NOT_FOUND" }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete chat failed", error);
    return NextResponse.json({ error: "Unable to delete conversation.", code: "SERVER_ERROR" }, { status: 500 });
  }
}
