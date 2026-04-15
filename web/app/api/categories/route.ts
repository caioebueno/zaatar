import getProducts from "@/src/getProducts";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { categories } = await getProducts();

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories error:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
