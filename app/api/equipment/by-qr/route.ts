/**
 * API Route: Get Equipment by QR Code
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const qrCode = searchParams.get("qrCode");

        if (!qrCode) {
            return NextResponse.json(
                { error: "QR code is required" },
                { status: 400 }
            );
        }

        const equipment = await prisma.equipment.findFirst({
            where: {
                qrCode: qrCode,
            },
            select: {
                id: true,
                name: true,
                code: true,
                qrCode: true,
            },
        });

        if (!equipment) {
            return NextResponse.json(
                { error: "Equipment not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(equipment);
    } catch (error) {
        console.error("Error fetching equipment by QR code:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
