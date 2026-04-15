import prisma from "@/prisma";
import { NextRequest, NextResponse } from "next/server";

type PostBody = {
  id?: unknown;
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

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as PostBody;
    const name = parseString(body.name, "name");
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

    if (
      body.includeComments !== undefined &&
      typeof body.includeComments !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "includeComments" },
        { status: 400 },
      );
    }

    if (
      body.includeModifiers !== undefined &&
      typeof body.includeModifiers !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid payload", field: "includeModifiers" },
        { status: 400 },
      );
    }

    const preparationStepId =
      body.id === undefined ? crypto.randomUUID() : parseString(body.id, "id");

    const createdPreparationStep = await prisma.preparationStep.create({
      data: {
        id: preparationStepId,
        name,
        stationId,
        includeComments: Boolean(body.includeComments),
        includeModifiers: Boolean(body.includeModifiers),
      },
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
      id: createdPreparationStep.id,
      name: createdPreparationStep.name,
      stationId: createdPreparationStep.stationId,
      stationName: createdPreparationStep.station?.name || null,
      includeComments: createdPreparationStep.includeComments,
      includeModifiers: createdPreparationStep.includeModifiers,
    });
  } catch (error) {
    if (error instanceof Error && error.message) {
      return NextResponse.json(
        { error: "Invalid payload", field: error.message },
        { status: 400 },
      );
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Preparation step already exists", field: "id" },
        { status: 409 },
      );
    }

    console.error("POST /api/preparation-steps error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
