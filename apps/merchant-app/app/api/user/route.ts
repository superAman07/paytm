import { NextResponse } from "next/server";
import prisma from "@repo/db/client"; 

export const GET = async () => {
    await prisma.user.create({
        data: {
            email: "asd",
            name: "adsads",
            number: "1231231231",
            password: "1231231231"
        }
    });
    return NextResponse.json({
        message: "hi there"
    });
};