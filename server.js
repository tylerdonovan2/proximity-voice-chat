const express = require('express')
const app = express()
const server = require('http').Server(app)
const io = require('socket.io')(server)

const proximityThreshold = 0.5

const activeUsers = {

}

app.use(express.static('static'))


app.set('view engine', 'ejs')


app.get('/',(req,res) =>{
    res.render("index.ejs")
})

io.on('connection', socket => {

    socket.on('join-room',(room,userId,geolocation) => {
        activeUsers[userId] = {"coordinates":geolocation}
        console.log("User Connected:",room,userId)
        console.log("Total Users:",Object.keys(activeUsers).length)

        socket.join(room)
        socket.broadcast.to(room).emit('user-connected', userId)

        socket.on('update-location',(arg,callback) => {
            console.log("Location Update:", userId)
            activeUsers[userId].coordinates = arg
            callback({"status":"OK"})
        })

        socket.on('disconnect', () => {
            socket.broadcast.to(room).emit('user-disconnected', userId)
            delete(activeUsers[userId])
            console.log("User Disconnected:",room,userId)
            console.log("Total Users:",Object.keys(activeUsers).length)
        })

        socket.on('proximity-list',(userId,callback) => {
            console.log("Proximity List:",userId)
            callback(getUsersInProximity(userId))
        })

        socket.on('proximity-check',(userId1,userId2) => {
            console.log("Proximity Check:",userId1,userId2)
            let response = false
            d = coordinateDistance(activeUsers[userId1].coordinates,activeUsers[userId2].coordinates)
            try{
                response = Boolean(d<proximityThreshold)
            } catch{
                response = false
            }
            socket.emit('proximity-check',userId1,userId2,response)
        })
    })

})


function getUsersInProximity(userId){
    let users = []
    for (let i = 0; i < Object.keys(activeUsers).length; i++){
        otherId = Object.keys(activeUsers)[i]
        if (otherId == userId) continue

        d = coordinateDistance(activeUsers[otherId].coordinates,activeUsers[userId].coordinates)
        try{
            console.log(userId, "Is",d,"Miles Away From",otherId,activeUsers[otherId].coordinates,activeUsers[userId].coordinates)
        } catch{
            return []
        }
        
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