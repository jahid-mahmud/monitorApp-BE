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
        component:request.source.component,
        host:request.source.host
    }
    const error = new Error({
        name: request.metadata.name,
        namespace: request.metadata.namespace,
        reason:  request.reason,
        message:  request.message,
        source:source,
        time:  request.metadata.creationTimestamp,
        type:  request.Warning

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


app.get('/errors', (req, res) => {
    Error.find({}).then((createdErrors => {
        io.sockets.emit('errorEvent', { message: createdErrors });
        res.status(201).json(createdErrors)
    })).catch((err) => {
        res.status(500).json({
            error: err,
            success: false
        })
    })
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