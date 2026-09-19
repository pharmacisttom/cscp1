import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const types = await prisma.businessType.findMany({
      orderBy: { name: "asc" }
    });
    return NextResponse.json({ success: true, data: types });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
