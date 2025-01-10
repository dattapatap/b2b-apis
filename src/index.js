import dotenv from "dotenv";
import connDB from './config/database.js';
import app from './app.js'

dotenv.config()

connDB().then( ()=>{
    app.listen(process.env.PORT || 8000, () =>{
        console.log(`Server is runnig at port ${ process.env.PORT}`);
    })
}).catch((error) =>{
    console.log("MongoDb Connection Error !!!", error);
})


