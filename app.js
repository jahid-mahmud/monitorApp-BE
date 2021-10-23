const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const cors = require('cors');
const { Error } = require('./models/errorModel');
require('dotenv/config');
var http = require('http');
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origins: [process.env.ALLOW_OROGIN],
        methods: ["GET", "POST"],
        credentials: false
    }
});
io.on('connection', (socket) => {
    console.log("Client connected");
});

const api = process.env.API_URL;


app.use(cors());
app.options('*', cors())

//middleware
app.use(bodyParser.json());
app.use(morgan('tiny'));



app.post('/errors', (req, res) => {
    const request = req.body;
    const source = {
        component: request.source.component,
        host: request.source.host
    }
    const error = new Error({
        name: request.metadata.name,
        namespace: request.metadata.namespace,
        reason: request.reason,
        message: request.message,
        source: source,
        time: request.metadata.creationTimestamp,
        type: request.Warning,
        createDate: new Date()

    });
    error.save().then((createdError => {
        io.sockets.emit('errorEvent', { message: error });
        res.status(201).json(createdError)
    })).catch((err) => {
        res.status(500).json({
            error: err,
            success: false
        })
    })
})



app.get('/errors', async (req, res) => {
    var dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - 1);
    var createdErrors = await Error.find({
        createDate: {
            $gte: new Date(dateFilter)
        }
    }).sort({createDate:'desc'})
    if (createdErrors.length) {
        res.status(201).json(createdErrors)
    }
    else {
        res.status(500).json({
            error: 'NOT_FOUND',
            success: false
        })
    }

})

//Database
mongoose.connect(process.env.CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    dbName: 'eshop-database'
})
    .then(() => {
        console.log('Database Connection is ready...')
    })
    .catch((err) => {
        console.log(err);
    })

server.listen(3000, () => {

    console.log('server is running http://localhost:3000');
})