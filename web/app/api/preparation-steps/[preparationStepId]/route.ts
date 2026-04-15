import prisma from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{
    preparationStepId: string;
  }>;
};

type PatchBody = {
  name?: unknown;
  stationId?: unknown;
  includeComments?: unknown;
  includeModifiers?: unknown;
};

function parseString(value: unknown, field: string): string {
  if (typeof value !== "string") {
    throw new Error(field);
  }

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(field);
  }

  return normalized;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { preparationStepId } = await context.params;
    const normalizedPreparationStepId = preparationStepId.trim();

    if (!normalizedPreparationStepId) {
      return NextResponse.json(
        { error: "Invalid payload", field: "preparationStepId" },
        { status: 400 },
      );
    }

    const body = (await request.json()) as PatchBody;
    const data: {
      name?: string;
      stationId?: string;
      includeComments?: boolean;
      includeModifiers?: boolean;
    } = {};
    let hasAnyField = false;

    if (body.name !== undefined) {
      data.name = parseString(body.name, "name");
      hasAnyField = true;
    }

    if (body.stationId !== undefined) {
      const stationId = parseString(body.stationId, "stationId");
      const station = await prisma.station.findUnique({
        where: {
          id: stationId,
        },
        select: {
          id: true,
        },
      });

      if (!station) {
        return NextResponse.json(
          { error: "Invalid payload", field: "stationId" },
          { status: 400 },
        );
      }

      data.stationId = stationId;
      hasAnyField = true;
    }

    if (body.includeComments !== undefined) {
      if (typeof body.includeComments !== "boolean") {
        return NextResponse.json(
          { error: "Invalid payload", field: "includeComments" },
          { status: 400 },
        );
      }

      data.includeComments = body.includeComments;
      hasAnyField = true;
    }

    if (body.includeModifiers !== undefined) {
      if (typeof body.includeModifiers !== "boolean") {
        return NextResponse.json(
          { error: "Invalid payload", field: "includeModifiers" },
          { status: 400 },
        );
      }

      data.includeModifiers = body.includeModifiers;
      hasAnyField = true;
    }

    if (!hasAnyField) {
      return NextResponse.json(
        { error: "Invalid payload", field: "body" },
        { status: 400 },
      );
    }

    const updatedPreparationStep = await prisma.preparationStep.update({
      where: {
        id: normalizedPreparationStepId,
      },
      data,
      include: {
        station: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      id: updatedPreparationStep.id,
      name: updatedPreparationStep.name,
      stationId: updatedPreparationStep.stationId,
      stationName: updatedPreparationStep.station?.name || null,
      includeComments: updatedPreparationStep.includeComments,
      includeModifiers: updatedPreparationStep.includeModifiers,
    });
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Preparation step not found" },
        { status: 404 },
      );
    }

    console.error("PATCH /api/preparation-steps/[preparationStepId] error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
