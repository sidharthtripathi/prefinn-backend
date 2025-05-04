import express from 'express'
import { accountCreateSchema, accountLoginSchema, verifyEmailSchema } from '../zod/schema';
import { db } from '../lib/db';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { generateOTP, resend } from '../lib/email';
const authRouter = express.Router();

authRouter.post('/register',async (req,res)=>{
    try {
        const {email,password,userType} = accountCreateSchema.parse(req.body)
        const otp = generateOTP()
        const newUser = await db.user.create({data : {email,password :await bcrypt.hash(password,10),userType}})
        const newOTP = await db.otp.create({data : {userId : newUser.id,otp}})
        await resend.emails.send({
            from :"Acme <onboarding@resend.dev>",
            to : [email],
            subject : "email verification",
            html  : `<p> otp is ${newOTP.otp} </p>`
        })
         res.json(newUser)
    } catch (error) {
        console.log(error)
        res.status(400).statusMessage = "INVALID PAYLOAD"
        res.end()
    }
})

authRouter.post('/login',async(req,res)=>{
    const {email,password} = accountLoginSchema.parse(req.body)
    const account = await db.user.findUnique({
        where : {
            email,
        }
    })
    if(!(account && (await bcrypt.compare(password,account.password)))){
        res.status(401).statusMessage = "WRONG USERNAME OR PASSWORD"
        res.end()
    }
    else{
        const authToken = jwt.sign({id : account.id},process.env.JWT_SECRET as string)
        res.cookie("auth-token",authToken,{
            maxAge: 24 * 60 * 60 * 1000, // 1 day
            httpOnly: true,             // Accessible only by web server
            secure: true,               // Send over HTTPS only
          })
        res.end()
    }
})

authRouter.post('/verify-email',async(req,res)=>{
    const {otp,userId} = verifyEmailSchema.parse(req.body)
    const currentDateTime = Date.now()
    const otpRecord = await db.otp.findUnique({where : {userId}})
    // 5 minute otp verify time
    if(otpRecord && (otp===otpRecord.otp) && (currentDateTime - otpRecord.createdAt.getTime() <= 5*60*1000)){
        // update user
        await db.user.update({data : {verified : true},where : {id : userId}})
        res.status(200).end()
    }
    else{
        res.status(401).end()
    }
})

authRouter.get('/verify-email',async(req,res)=>{
    const userId = res.locals.userId as string | null
    if(!userId) res.status(401).end()
    else{
        const otp = generateOTP();
        const currentDateTime = new Date()
        const newOtp = await db.otp.update({where : {userId},data : {otp,createdAt:currentDateTime}})
        const user = await db.user.findUnique({where : {id : userId},select : {email : true}})
        await resend.emails.send({
            from :"Acme <onboarding@resend.dev>",
            to : [user?.email as string],
            subject : "email verification",
            html  : `<p> otp is ${newOtp.otp} </p>`
        })
        res.status(200).end()
    }
})

export default authRouter