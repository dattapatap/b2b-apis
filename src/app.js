import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import errorHandler from './middlewares/errorHandler.js';
import requestLogger from './middlewares/requestLogger.js';

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


// Mobile App Routes
import  applicationRouter from './routes/app/app.router.js'
// app.use("/api/app/v1", requestLogger('app'), applicationRouter);
app.use("/api/app/v1", applicationRouter);

// // Web routes
import  webRouter from './routes/web/web.routes.js'
app.use("/api/web/v1",  webRouter);

// Routes for admin
import  adminRouter from './routes/admin.routes.js'
app.use("/api/admin/v1", adminRouter);




app.use(errorHandler)

export default app; 