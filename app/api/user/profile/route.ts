import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, unauthorizedResponse } from "@/lib/auth";
import { countUserChats, updateUserProfile } from "@/lib/data";
import { forbiddenResponse, isSameOrigin } from "@/lib/security";
import { profileSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();
  try {
    const totalChats = await countUserChats(user.id);
    return NextResponse.json({ user, stats: { totalChats } });
  } catch (error) {
    console.error("Get profile failed", error);
    return NextResponse.json({ error: "Unable to load profile.", code: "SERVER_ERROR" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!isSameOrigin(request)) return forbiddenResponse();
  const user = await getRequestUser(request);
  if (!user) return unauthorizedResponse();
  try {
    const body = profileSchema.safeParse(await request.json());
    if (!body.success) {
      return NextResponse.json({ error: "Invalid profile details.", code: "VALIDATION_ERROR" }, { status: 400 });
    }
    const updatedUser = await updateUserProfile(user.id, body.data);
    if (!updatedUser) return unauthorizedResponse();
    const response = NextResponse.json({ user: updatedUser });
    response.cookies.set("chatcraft_language", updatedUser.language, {
      sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    console.error("Update profile failed", error);
    return NextResponse.json({ error: "Unable to update profile.", code: "SERVER_ERROR" }, { status: 500 });
  }
}
