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
  goalMinutes?: unknown;
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

function parseGoalMinutes(value: unknown): number | null {
  if (value === undefined) return null;
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (!Number.isInteger(value) || value < 0) return null;
  return value;
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
      goalMinutes?: number;
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

    if (body.goalMinutes !== undefined) {
      const goalMinutes = parseGoalMinutes(body.goalMinutes);
      if (goalMinutes === null) {
        return NextResponse.json(
          { error: "Invalid payload", field: "goalMinutes" },
          { status: 400 },
        );
      }

      data.goalMinutes = goalMinutes;
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

    const updatedPreparationStep = await prisma.$transaction(async (tx) => {
      const currentStep = await tx.preparationStep.findUnique({
        where: { id: normalizedPreparationStepId },
        select: { stationId: true },
      });

      if (!currentStep) {
        throw Object.assign(new Error("NOT_FOUND"), { code: "P2025" });
      }

      const updated = await tx.preparationStep.update({
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

      if (data.goalMinutes !== undefined) {
        await tx.preparationStep.updateMany({
          where: { stationId: currentStep.stationId },
          data: { goalMinutes: data.goalMinutes },
        });
      }

      return updated;
    });

    return NextResponse.json({
      id: updatedPreparationStep.id,
      name: updatedPreparationStep.name,
      stationId: updatedPreparationStep.stationId,
      stationName: updatedPreparationStep.station?.name || null,
      goalMinutes:
        typeof (updatedPreparationStep as { goalMinutes?: unknown }).goalMinutes ===
        "number"
          ? Math.max(
              0,
              Math.floor(
                (updatedPreparationStep as { goalMinutes?: number }).goalMinutes ?? 0,
              ),
            )
          : 0,
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
