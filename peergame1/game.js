
let peerIDBase = "_testgame11235813";

function logEvent(event) {
    let messageElement = document.createElement("p");
    messageElement.style.color = "white";

    // Make the message have rounded corners:
    messageElement.style.borderRadius = "5px";
    messageElement.style.padding = "5px";
    messageElement.style.margin = "5px";
    messageElement.style.border = "1px solid white";
    messageElement.style.backgroundColor = "rgba(0, 0, 0, 0.5)";

    messageElement.innerText = event;

    let gameLog = document.getElementById("gameLog");
    gameLog.appendChild(messageElement);
}

window.onload = function () {
    let canvas = document.getElementById("gameCanvas");

    //canvas.width = 800;
    //canvas.height = 600;

    //canvas.style.width = "800px";
    //canvas.style.height = "600px";

    let context = canvas.getContext("2d");

    context.fillStyle = "white";
    context.fillRect(0, 0, 800, 600);

    let mouse = {x: 0, y: 0};
    
    canvas.onmousemove = (m) => {
        mouse.x = m.offsetX;
        mouse.y = m.offsetY;
    };

    let lastFrameTime = 0;

    let connectButton = document.getElementById("connectButton");
    let connectPeerButton = document.getElementById("connectPeerButton");
    let myPeerIDInput = document.getElementById("myPeerIDInput");
    let peerIDInput = document.getElementById("peerIDInput");
    
    let peer;
    let peerId = peerIDInput.value + peerIDBase;
    let myPeerId = myPeerIDInput.value + peerIDBase;

    connectButton.onclick = () => {
        
        myPeerId = myPeerIDInput.value + peerIDBase;
        peerId = peerIDInput.value + peerIDBase;

        logEvent("myPeerId: " + myPeerId);
    
        peer = new Peer(myPeerId);

        peer.on("connection", (connection) => {
            connection.on("data", (data) => {
                logEvent("Received: ", data);
            });
        });

        peer.on("error", (err) => {
            logEvent(err);
        });
    };

    connectPeerButton.onclick = () => {
        let connection = peer.connect(peerId);
        connection.on("open", function (id) {
            logEvent("My peer ID is: " + id);

            connection.send("Hello from " + myPeerId);
        });
    };

    function gameLoop() {
        let fps = 1000/(Date.now() - lastFrameTime);
        lastFrameTime = Date.now();

        context.fillStyle = "rgb(" + (((Math.sin(Date.now()/1000*5) + 1)/2)*50+50) + ", 0, 255)";
        context.fillRect(0, 0, 800, 600);

        
        context.fillStyle = "white";
        context.beginPath();
        context.ellipse(mouse.x, mouse.y, 25, 25, 0, 0, 2 * Math.PI);
        context.fill();


        context.fillText("FPS: " + fps, 20, 20);

        window.requestAnimationFrame(gameLoop);
    }

    window.requestAnimationFrame(gameLoop);
};
