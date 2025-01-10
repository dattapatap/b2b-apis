import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import errorHandler from './middlewares/errorHandler.js';

const app = express()

// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }))
app.use(cors({
    origin: (origin, callback) => {
        callback(null, true);
    },
    credentials: true
}));


app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())
app.use(errorHandler)

 

// Public routes
import  publicRouter from './routes/public.routes.js'
app.use("/api/v1", publicRouter)

// Routes for admin
import  adminRouter from './routes/admin.routes.js'
app.use("/api/v1/admin", adminRouter)

// Router for User
import  userRouter from './routes/user.routes.js'
app.use("/api/v1/users", userRouter)


export default app; 