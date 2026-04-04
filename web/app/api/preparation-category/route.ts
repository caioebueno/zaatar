import updatePreparationCategory from "@/src/updatePreparationCategory";
import { NextRequest, NextResponse } from "next/server";
import type { TPreparationStepCategory } from "@/src/types/station";

export async function PUT(request: NextRequest) {
  try {
    const preparationCategory =
      (await request.json()) as TPreparationStepCategory;

    if (
      !preparationCategory?.id ||
      !Array.isArray(preparationCategory.steps)
    ) {
      return NextResponse.json(
        { error: "Invalid preparation category payload" },
        { status: 400 },
      );
    }

    await updatePreparationCategory(preparationCategory);
    return NextResponse.json({});
  } catch (error) {
    console.error("PUT /api/preparation-category error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
