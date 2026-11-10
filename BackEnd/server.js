require ('dotenv').config({ path: './config.env'})
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;


const cors = require('cors');
app.use(cors());
app.use(express.json())

app.use ((req, res, next) => {
    console.log(`Method: ${req.method} | URL: ${req.url}`)
    next();
})

const { MongoClient, ObjectID } = require ( 'mongodb' )
const uri = process.env.MONGODB_PREFIX + process.env.MONGODB_USERNAME + ":" + process.env.MONGODB_PASSWORD + process.env.MONGODB_URL
let db;

MongoClient.connect(uri).then(client => {
    console.log("Connected to MongoDB Atlas")
    db = client.db('Activities')
})
.catch(err => {
    console.error("Connection failed:", err.message)
})

app.get('/lessons', async (req, res) => {
    try {
        if (!db) return res.status(500).json ({ error: "Database not found yet"})
        const lessons = await db.collection('Lessons').find({}).toArray()
        res.json(lessons)
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch lessons", details: err.message})
    }
})

app.post('/orders', async (req, res) => {
    try{
        console.log("Received req.body:", req.body)
        if (!db) return res.status(500).json({ error: "Database not connected"})
        const newOrder = req.body;
        const result = await db.collection('Orders').insertOne(newOrder)
        res.status(201).json({message: "Order created", orderId: result.insertedId})    
    }
    catch (err) {
        res.status(500).json({error: 'Failed to save order', details: err.message})
    }
})

app.put('/lessons/:id', async (req, res) => {
    try{
        if (!db) return res.status(500).json({error: "Database not connected"})
        const lessonId = req.params.id
        const newSpaces = req.body.newSpaces
        const query = !isNaN(lessonId) ? {id: Number(lessonId)} : {_id: new ObjectId(lessonId)}
        const result = await db.collection('Lessons').updateOne(query, {$set : {spaces: newSpaces}})
        if (result.matchedCount === 0){
            return res.status(404).json({error: 'Lesson not found'})
        res.json({message: "Spaces updated"})
        }
    } catch (err) {
        res.status(500).json({error: "Failed to update spaces", details: err.message})
    }
})

app.use((req, res) => {
    res.status(404).json({error: 'Endpoint not found' })
})

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`)
})