import dotenv from "dotenv";
import connDB from './config/database.js';
import app from './app.js'
import http from "http";
import { Server } from "socket.io";
import { Inquiry } from "./models/inquiry.model.js";



dotenv.config();

connDB().then( ()=>{
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = new Server(server, {
        cors: { origin: "*", credentials: true },
    });

    //Socket.IO events
    io.on("connection", (socket) => {
        console.log("User connected:", socket.id);

        socket.on("joinInquiry", (inquiryId) => {
            socket.join(inquiryId);
            console.log("Joined room:", inquiryId);
        });

        socket.on("sendMessage", async ({ inquiryId, senderRole, text }) => {
            const inquiry = await Inquiry.findById(inquiryId);
            if (inquiry) {
                inquiry.messages.push({ sender: senderRole, text });
                await inquiry.save();

                io.to(inquiryId).emit("newMessage", inquiry);
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

        const PORT = process.env.PORT || 8000;
    server.listen(PORT, () => {
        console.log(`Server is running at port ${PORT} 💓 ❥ 💑 🥰 💓 💓 ❣`);
    });

}).catch((error) =>{
    console.log("MongoDb Connection Error !!!", error);
})


