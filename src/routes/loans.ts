import express from 'express'
import { businessLoanSchema, businessLoanVerifySchema } from '../zod/loanSchema'
import { generateOTP, resend } from '../lib/email'
import { db } from '../lib/db'
export const loanRouter = express.Router()

loanRouter.post('/business-loan',async(req,res)=>{
    const userId = res.locals.userId as string
    if(!userId){
        res.status(401).end()
    }
    else{
        const {city,fullName,loanAmount,mobileNumber,monthlyIncome,occupationType,panNumber,pincode,propertyType} = businessLoanSchema.parse(req.body);
        const user = await db.user.findUnique({where : {id : userId},select : {email : true}})
        const otp = generateOTP();
        const newLoan = await db.businessLoan.create({
            data : {
                userId,
                city,fullName,loanAmount,mobileNumber,monthlyIncome,occupationType,panNumber,pincode,propertyType,
                otp,otpCreationDate : new Date()
            }
        })
        // send otp for verification
        await resend.emails.send({
            from :"Acme <onboarding@resend.dev>",
            to : [user?.email as string],
            subject : "loan verification",
            html  : `<p> otp for business loan verification is ${otp} </p>`
        })

        res.json({loanId : newLoan.id})
    }
})

loanRouter.post('/business-loan-verify',async(req,res)=>{
    const userId = res.locals.userId as string
    const {otp,businessLoanId} = businessLoanVerifySchema.parse(req.body)
    const result = await db.businessLoan.findUnique({
        where : {id : businessLoanId,otp,userId},
        select : {otpCreationDate : true}
    })
    if(!result) res.status(400).end()
    else {
        const currentTime = Date.now();
        const otpCreationTime = result.otpCreationDate;
        if(currentTime - otpCreationTime.getTime() <= 5*60*1000){
            await db.businessLoan.update({
                where : {id : businessLoanId},
                data : {verified : true}
            })
        }
        else{
            res.status(401).end()
        }
    }
})

loanRouter.post('/business-loan-otp-regenerate',async(req,res)=>{
    try {
        const userId = res.locals.userId as string
        const businessLoanId = req.query.businessLoanId as string
        const otp = generateOTP()
        const {user} = await db.businessLoan.update({
            where : {id : businessLoanId,userId},
            data : {otp,otpCreationDate : new Date()},
            select : {user : {select : {email : true}}}
        })
        await resend.emails.send({
            from :"Acme <onboarding@resend.dev>",
            to : [user.email as string],
            subject : "loan verification",
            html  : `<p> otp for business loan verification is ${otp} </p>`
        })
    } catch (error) {
        res.status(401).end()
    }
    
})