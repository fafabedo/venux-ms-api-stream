require('module-alias/register');
const express = require('express')
const fs = require('fs')
const path = require('path')
const app = express()
const cors = require('cors')

const env = require("dotenv").config();

const _port = process.env.LISTEN_PORT || 3012;
const port = _port;

app.use(express.json());
app.use(express.urlencoded({ extended: true }))

const routes = require("./controller/routes.json");
const Authentication = require("@vx-auth/Authentication");

app.use(cors());

// app.use((req, res, next) => {

//     Authentication
//         .setRoutes(routes)
//         .authorize(req, res)
//         .then((res) => {
//             next()
//         })
//         .catch((err) => {
//             res.status(403);
//             res.send({ status: "Forbidden" });
//         });
// })

app.get("/help", (req, res) => {
    res.status(200)
    res.send(routes);
})
// respond with "hello world" when a GET request is made to the homepage
routes.map(route => {
    switch (route.method) {
        case "get":
            app.get(route.path, (req, res) => {
                const parts = route.controller.split(":");
                const file = parts[0];
                const method = parts[1];
                const classController = require(`./controller/${file}`)
                res = classController[method](req, res);
            });
            break;

    }
})


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
