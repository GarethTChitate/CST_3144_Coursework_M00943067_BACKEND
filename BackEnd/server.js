const express = require('express');
const { MongoClient, ObjectID } = require ( 'mongodb' )
const app = express();
const PORT = process.env.PORT || 3000;
require ('dotenv').config({ path: './config.env'})

const cors = require('cors');
app.use(cors());
app.use(express.json())

app.use ((req, res, next) => {
    console.log(`Method: ${req.method} | URL: ${req.url}`)
    next();
})

/*app.use('/images', express.static(path.join(__dirname, 'images')), (req, res) => {
    res.status(404).json({ error: 'Image not found' })
})*/

const url = process.env.ATLAS_URL
let db;

MongoClient.connect(url).then(client => {
    console.log("Connected to MongoDB Atlas")
    db = client.db('lessons')
})
.catch(err => {
    console.error("Database not found")
})

app.get('/lessons', async (req, res) => {
    try {
        if (!db) return res.status(500).json ({ error: "Database not found yet"})
        const lessons = await db.collection('lessons').find({}).toArray()
        res.json(lessons)
    }
    catch (err) {
        res.status(500).json({ error: "Failed to fetch lessons", details: err.message})
    }
})

app.post('/orders', async (req, res) => {
    try{
        if (!db) return res.status(500).json({ error: "Database not connected"})
        const newOrder = req.body;
        const result = await db.collection('orders').insertOne(newOrder)
        res.status(201).json({message: "Order created", orderId: result.insertId})    
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
        const result = await db.collection('lesson').updateOne(query, {$set : {spaces: newSpaces}})
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