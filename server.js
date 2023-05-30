const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const proximityThreshold = 0.25

const activeUsers = {

}

app.use(express.static('static'))


app.set('view engine', 'ejs')


app.get('/',(req,res) =>{
    res.render("index.ejs")
})

io.on('connection', socket => {

    socket.on('join-room',(room,id) => {
        activeUsers[id] = {"coordinates":null}
        console.log("User Connected:",room,id)
        console.log("Total Users:",Object.keys(activeUsers).length)

        socket.join(room)
        socket.broadcast.to(room).emit('user-connected', id)

        socket.on('update-location',(arg,callback) => {
            activeUsers[id].coordinates = arg
            callback()
        })

        socket.on('disconnect', () => {
            socket.broadcast.to(room).emit('user-disconnected', id)
            delete(activeUsers[id])
            console.log("User Disconnected:",room,id)
            console.log("Total Users:",Object.keys(activeUsers).length)
        })

        socket.on('proximity-list',id => {
            socket.emit('proximity-list', getUsersInProximity(id))
        })

        socket.on('proximity-check',(id1,id2) => {
            // d = coordinateDistance(activeUsers[id1].coordinates,activeUsers[id2].coordinates)
            d = 0
            socket.emit('proximity-check',id1,id2,Boolean(d<proximityThreshold))
        })
    })

})


function getUsersInProximity(id){
    let users = []
    for (let i = 0; i < Object.keys(activeUsers).length; i++){
        otherId = Object.keys(activeUsers)[i]
        if (otherId == id) continue

        // d = coordinateDistance(activeUsers[otherId].coordinates,activeUsers[id].coordinates)
        d = 0

        if (d < proximityThreshold){
            users.push(otherId)
        }
    }
    return users
}

function degreesToRadians(deg){
    return deg * (Math.PI/180)
}

const r = 3963.1906 // earths circumference in miles
function coordinateDistance(coords1,coords2){
    return 2 * r * Math.asin(Math.sqrt( Math.pow(Math.sin(( degreesToRadians(coords2.latitude-coords1.latitude) )/2),2) + Math.cos(degreesToRadians(coords1.latitude)) * Math.cos(degreesToRadians(coords2.latitude)) * Math.pow( Math.sin( ( degreesToRadians(coords2.longitude - coords1.longitude) )/2 ) , 2) ))
}
  
server.listen(3000)