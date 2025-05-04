import express from 'express'
import { generateOTP, resend } from '../../lib/email'
import { db } from '../../lib/db'
import { homeLoanSchema, homeLoanVerifySchema } from '../../zod/loanSchema'
export const homeLoanRouter = express.Router()


homeLoanRouter.post('/',async(req,res)=>{
    const userId = res.locals.userId as string
    if(!userId){
        res.status(401).end()
    }
    else{
        const {city,fullName,loanAmount,mobileNumber,occupationType,panNumber,pincode} = homeLoanSchema.parse(req.body);
        const user = await db.user.findUnique({where : {id : userId},select : {email : true}})
        const otp = generateOTP();
        const newLoan = await db.homeLoan.create({
            data : {
                userId,
                city,fullName,loanAmount,mobileNumber,occupationType,panNumber,pincode,email : user?.email!,
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

homeLoanRouter.post('/verify',async(req,res)=>{
    const userId = res.locals.userId as string
    const {otp,homeLoanId} = homeLoanVerifySchema.parse(req.body)
    const result = await db.homeLoan.findUnique({
        where : {id : homeLoanId,otp,userId},
        select : {otpCreationDate : true}
    })
    if(!result) res.status(400).end()
    else {
        const currentTime = Date.now();
        const otpCreationTime = result.otpCreationDate;
        if(currentTime - otpCreationTime.getTime() <= 5*60*1000){
            await db.businessLoan.update({
                where : {id : homeLoanId},
                data : {verified : true}
            })
        }
        else{
            res.status(401).end()
        }
    }
})

homeLoanRouter.post('/otp-regenerate',async(req,res)=>{
    try {
        const userId = res.locals.userId as string
        const homeLoanId = req.query.homeLoanId as string
        const otp = generateOTP()
        const {user} = await db.homeLoan.update({
            where : {id : homeLoanId,userId},
            data : {otp,otpCreationDate : new Date()},
            select : {user : {select : {email : true}}}
        })
        await resend.emails.send({
            from :"Acme <onboarding@resend.dev>",
            to : [user.email as string],
            subject : "loan verification",
            html  : `<p> otp for home loan verification is ${otp} </p>`
        })
    } catch (error) {
        res.status(401).end()
    }
    
})

