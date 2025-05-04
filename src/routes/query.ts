import express from 'express'
import { querySchema } from '../zod/querySchema'
import { db } from '../lib/db'
export const queryRouter = express()

queryRouter.post('/',async(req,res)=>{
    try {
        const {email,fullName,mobile} = querySchema.parse(req.body)
        await db.query.create({
            data : {email,fullName,mobile}
        })
        res.status(200).end()
    } catch (error) {
        res.status(400).end()
    }
})