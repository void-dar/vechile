// app/api/users/route.ts — list + create users
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/api/prisma";

export async function GET() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      createdAt: true,
      _count: { select: { fingerprints: true, vehicles: true } },
    },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  let body: { fullName: string; email: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { fullName, email } = body;
  if (!fullName || !email) {
    return NextResponse.json({ error: "fullName and email are required" }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({ data: { fullName, email } });
    return NextResponse.json({ user }, { status: 201 });
  } catch (err: any) {
    if (err.code === "P2002") {
      return NextResponse.json({ error: "A user with that email already exists." }, { status: 409 });
    }
    console.error("User creation failed", err);
    return NextResponse.json({ error: "Could not create the user." }, { status: 500 });
  }
}
