import express from 'express'
import mongoose from 'mongoose';
import cors from 'cors'
import bodyParser from 'body-parser';


const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(express.json());


const PORT = process.env.PORT || 5000;


// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/digitalb2b')
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Basic route
app.get('/', (req, res) => {
    res.send('Hello, MERN Stack!');
});

app.get('/login-url', (req, res) => {
    res.send('<h1> You tube page </h1>');
});

//get list of 5 jokes
app.get("/api/jokes", (req, res)=>{
    res.json([{"id" : 1, "name" : "this is joke"}])
})



// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));