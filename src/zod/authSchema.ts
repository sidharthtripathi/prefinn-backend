import {z} from 'zod'
export const accountCreateSchema = z.object({
    email : z.string().email(),
    password : z.string().min(8),
    userType : z.enum(['CUSTOMER','PARTNER'])
})

export const accountLoginSchema = z.object({
    email : z.string().email(),
    password : z.string().min(8),
})

export const verifyEmailSchema = z.object({
    otp : z.number().gte(0).lte(9999),
    userId : z.string()
})