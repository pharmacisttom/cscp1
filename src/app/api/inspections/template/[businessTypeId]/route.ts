import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ businessTypeId: string }> }
) {
  try {
    const { businessTypeId } = await context.params;

    const template = await prisma.inspectionTemplate.findFirst({
      where: { businessTypeId, isActive: true },
      include: {
        versions: {
          where: { status: "ACTIVE" },
          take: 1,
          include: {
            sections: {
              orderBy: { sortOrder: "asc" },
              include: {
                questions: {
                  orderBy: { sortOrder: "asc" },
                },
              },
            },
          },
        },
      },
    });

    if (!template || template.versions.length === 0) {
      return NextResponse.json(
        { success: false, error: "Template not found for business type" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template.versions[0],
    });
  } catch (error: any) {
    console.error("Fetch template error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch template" },
      { status: 500 }
    );
  }
}
