"use server"

import { getServerSession } from "next-auth"
import { authOptions } from "../auth"
import prisma from "@repo/db/client";

export async function p2pTransfer(to: string, amount: number){
    const session = await getServerSession(authOptions);
    const from = session?.user?.id;
    if(!from){
        return {message: "Error while sending"};
    }
    const toUser = await prisma.user.findFirst({
        where: {
            number: to
        }
    });
    if(!toUser){
        return {message:"User not found"}
    }
    await prisma.$transaction(async (tx)=>{  // hum log agr $transaction use nhi karenge to issue ho sakta hai like...agr maan lo money send ho gya aur agr "from" ka amount update ho gya aur tabhi server down ho jaaye tab "to" wala user ka amount update nhi hoga...to that's why we should use $transaction
        await tx.$queryRaw`SELECT * FROM "Balance" WHERE "userId"= ${Number(from)} FOR UPDATE`;  // it is called "locking" which means, same user can't send multiple amounts repidly (it will lock the DB so that 1st transaction happens first then second...and so on)
        const fromBalance = await tx.balance.findUnique({
            where: {userId: Number(from)}
        });
        if(!fromBalance || fromBalance.amount <amount){
            throw new Error("Insufficient funds");
        }
        await tx.balance.update({
            where: {
                userId: Number(from)
            },
            data: {
                amount:{
                    decrement: amount
                } 
            }
        });
        await tx.balance.update({
            where: {
                userId: toUser.id,
            },
            data: {
                amount: {
                    increment: amount
                }
            }
        }); 
        await tx.p2pTransfer.create({
            data: {
                fromUserId:Number(from),
                toUserId: toUser.id,
                amount,
                timestamp: new Date()
            }
        })
    })
}