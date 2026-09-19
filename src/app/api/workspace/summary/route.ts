import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");
    const district = request.headers.get("x-user-district") ? decodeURIComponent(request.headers.get("x-user-district") as string) : null;

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Get User and Officer Record
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { officer: true }
    });

    const officer = user?.officer;
    const orgId = request.headers.get("x-user-org-id") || user?.organizationId;
    if (!orgId) return NextResponse.json({ error: "Organization not found" }, { status: 401 });

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const dayStart = startOfDay(now);
    const dayEnd = endOfDay(now);

    // 2. Calculate My Performance (Inspections this month)
    const myInspectionsCount = await prisma.inspection.count({
      where: {
        createdById: userId,
        inspectionDate: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // 3. Today's Tasks
    // Fetch InspectionPlanStops where the Plan belongs to this officer and plannedDate is today
    let todaysStops: any[] = [];
    if (officer) {
      const todaysPlans = await prisma.inspectionPlan.findMany({
        where: {
          organizationId: orgId,
          officerId: officer.id,
          plannedDate: {
            gte: dayStart,
            lte: dayEnd
          }
        },
        include: {
          stops: {
            include: {
              business: {
                include: { location: true }
              }
            },
            orderBy: { stopOrder: 'asc' }
          }
        }
      });
      todaysStops = todaysPlans.flatMap(p => p.stops);
    }

    // 4. Team Leaderboard (Inspections by users in the same district this month)
    let leaderboard: any[] = [];
    if (district) {
      const allOfficersInDistrict = await prisma.officer.findMany({
        where: { organizationId: orgId, district }
      });
      
      const officerIds = allOfficersInDistrict.map(o => o.userId).filter(Boolean) as string[];

      if (officerIds.length > 0) {
        const inspectionsGroupBy = await prisma.inspection.groupBy({
          by: ['createdById'],
          where: {
            createdById: { in: officerIds },
            inspectionDate: {
              gte: monthStart,
              lte: monthEnd
            }
          },
          _count: {
            id: true
          },
          orderBy: {
            _count: {
              id: 'desc'
            }
          }
        });

        leaderboard = inspectionsGroupBy.map(group => {
          const matchedOfficer = allOfficersInDistrict.find(o => o.userId === group.createdById);
          return {
            officerName: matchedOfficer?.fullName || 'Unknown',
            count: group._count.id,
            isMe: group.createdById === userId
          };
        });

        // Add officers with 0 inspections
        allOfficersInDistrict.forEach(o => {
          if (o.userId && !leaderboard.find(l => l.officerName === o.fullName)) {
            leaderboard.push({
              officerName: o.fullName,
              count: 0,
              isMe: o.userId === userId
            });
          }
        });

        leaderboard.sort((a, b) => b.count - a.count);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        officer: officer || { fullName: "เจ้าหน้าที่" },
        performance: {
          monthlyInspections: myInspectionsCount,
        },
        todaysStops,
        leaderboard
      }
    });

  } catch (error: any) {
    console.error("Workspace Summary Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
