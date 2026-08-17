import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, unauthorizedResponse } from "@/lib/auth";
import { createChat, listUserChats } from "@/lib/data";
import { rateLimit, requestKey } from "@/lib/rate-limit";
import { forbiddenResponse, isSameOrigin } from "@/lib/security";
import { createChatSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();

  try {
    const chats = await listUserChats(user.id);
    return NextResponse.json({ chats });
  } catch (error) {
    console.error("List chats failed", error);
    return NextResponse.json({ error: "Unable to load conversations.", code: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenResponse();
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();
  const limit = rateLimit(requestKey(request, "create-chat", user.id), 20, 60_000);
  if (!limit.success) {
    return NextResponse.json({ error: "Please wait before creating another chat.", code: "RATE_LIMITED" }, { status: 429 });
  }

  try {
    const body = createChatSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid language.", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    const chat = await createChat(user.id, body.data.language);
    return NextResponse.json({ chat }, { status: 201 });
  } catch (error) {
    console.error("Create chat failed", error);
    return NextResponse.json({ error: "Unable to create conversation.", code: "SERVER_ERROR" }, { status: 500 });
  }
}
