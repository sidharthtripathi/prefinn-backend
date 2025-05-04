import express from 'express'
import dotevn from 'dotenv'
import authRouter from './routes/auth'
import bodyParser = require('body-parser')
import jwt, { JwtPayload } from 'jsonwebtoken'
const cookieParser = require('cookie-parser');

dotevn.config()
const PORT  = process.env.PORT || 3000
const server = express()
server.use(cookieParser());

server.use(bodyParser.json())

// authorization middleware
server.use((req,res,next)=>{
    try {
        const authToken = req.cookies["auth-token"]
        const user = jwt.verify(authToken,process.env.JWT_SECRET as string) as JwtPayload
        res.locals = {userId : user.id}
    } catch (error) {
        // console.log(error)
        res.locals = {userId : null}
    }
    finally{
        next()
    }
})

server.use("/auth",authRouter)

server.listen(PORT,()=>{
    console.log("server is up and running",PORT)
})