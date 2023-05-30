const socket = io('/')
const peer = new Peer(undefined, {
    // host: '2f54-2601-40c-c000-4690-5d4b-4990-6d4a-b5d9.ngrok-free.app',
    // port: '',
    host: 'localhost',
    port: 3001,
    // secure: true,
    // path: "/",
});
const peers = {}

const audioContainer = document.querySelector("#container")

const ROOM_ID = "1"

let myId = ""
let myStream = null

let currentGeoLocation = null

navigator.mediaDevices.getUserMedia({audio:true}).then(stream => {
    myAudio = createUser(stream)
    myAudio.muted = true
    myStream = stream

    peer.on('call',call => {
        call.answer(stream)

        handleConnection(call.peer,call)
    })

    socket.on('user-connected',id => {
        socket.emit('proximity-check',myId,id)

        socket.on('proximity-check',(id1,id2,inProximity) => {
            if(!(id1 == myId && id2 == id && inProximity)) return

            const call = peer.call(id, stream)
            
            handleConnection(id,call)
            
        })
    })
})

peer.on('open', id => {
	console.log('My peer ID is: ' + id);
    myId = id
    socket.emit('join-room', ROOM_ID, id)
    
    setInterval(() => {getGeoLocation()},1000)
});

socket.on('user-disconnected', id => {
    endCall(id)

})

function endCall(id){
    if (peers[id]) {
        peers[id].close()
        delete(peers[id])
    }
}

function getGeoLocation(){
    navigator.geolocation.getCurrentPosition(geolocation => {
        const geoLocation = {latitude: geolocation.coords.latitude,longitude:geolocation.coords.longitude}
        if (geoLocation == currentGeoLocation) return

        currentGeoLocation = geoLocation
        socket.emit('update-location',geoLocation,() =>{
            socket.emit('proximity-list',(inProximity)=>{
                const currentCalls = Object.keys(peers)
                
                const endCalls = currentCalls.filter(x => !inProximity.includes(x))
                const startCalls = inProximity.filter(x => !currentCalls.includes(x))


                // end calls no longer in proximity
                for(let i = 0;i< endCalls.length;i++){
                    endCall(i)
                }

                // start calls that are now in proximity
                for(let i = 0;i< startCalls.length;i++){
                    const call = peer.call(startCalls[i], myStream)
            
                    handleConnection(startCalls[i],call)
                }

                
            })
        })
    })
}

function handleConnection(id,call){
    var userElement = document.createElement("div")
    call.on('stream',s => {
        console.log("Creating user",call.peer)
        createUser(s,userElement)
    })

    call.on('close', () => {
        console.log("Call Closed Removing Element")
        userElement.remove()
    })
    
    peers[id] = call
}

function createUser(stream,element = null){
    const userElement = !element ? document.createElement("div") : element

    userElement.className = "user"

    const audioElement = document.createElement("audio")
    userElement.appendChild(audioElement)

    audioElement.srcObject = stream

    audioElement.addEventListener('loadedmetadata',() =>{
        audioElement.play()
    })

    audioContainer.appendChild(userElement)

    return userElement
}
