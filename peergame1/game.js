
let peerIDBase = "_testgame11235813";

let peer;
let myPeerId = "";

let mouse = {x: 0, y: 0};


function promptForMyPeerId() {
    let myPeerId = prompt("Enter your peer ID");
    if (myPeerId === null) {
        alert("You must enter a peer ID");
        myPeerId = promptForMyPeerId();
    }

    // Ask the player to confirm that the peer ID is correct:
    let confirmed = confirm("Your peer ID is: " + myPeerId + "\nIs this correct?");
    if (!confirmed) {
        myPeerId = promptForMyPeerId();
    }

    return myPeerId;
}

function getPeerId() {
    if (myPeerId === "") {
        myPeerId = promptForMyPeerId();
    }

    return myPeerId + peerIDBase;
}

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
    console.log("logEvent: ", event);
}

class GUI {
    constructor(images) {
        this.images = images;
        this.buttons = {};
        this.textInputs = {};
    }

    addButton(buttonId, x, y, text, onClick) {
        this.buttons[buttonId] = new GameButton(this.images, x, y, text, onClick);
    }

    addTextInput(textInputId, x, y, label) {
        this.textInputs[textInputId] = new TextInput(this.images, x, y, label);
    }

    draw(context) {
        for (let button of Object.values(this.buttons)) {
            button.draw(context);
        }

        for (let textInput of Object.values(this.textInputs)) {
            textInput.draw(context);
        }
    }

    handleMouseClick(x, y) {
        for (let button of Object.values(this.buttons)) {
            if (button.isPointInBounds(x, y)) {
                button.onClick();
                return;
            }
        }

        for (let textInput of Object.values(this.textInputs)) {
            if (textInput.isPointInBounds(x, y)) {
                let text = prompt("Enter value for: " + textInput.label);
                textInput.text = text;
                return;
            }
        }
    }
}

class GameButton {
    constructor(images, x, y, text, onClick) {
        this.images = images;

        this.x = x;
        this.y = y;
        this.textWidth = 0;

        this.text = text;

        this.onClick = onClick;
    }

    draw(context) {
        let leftImage = this.images["buttonLeft"];
        let centerImage = this.images["buttonCenter"];
        let rightImage = this.images["buttonRight"];
        context.fillStyle = "white";
        context.font = "30px Arial";

        let containsMouse = this.isPointInBounds(mouse.x, mouse.y);

        if(containsMouse) {
            leftImage = this.images["buttonLeftHover"];
            centerImage = this.images["buttonCenterHover"];
            rightImage = this.images["buttonRightHover"];
            context.fillStyle = "rgb(200, 230, 230, 255)";
            context.font = "32px Arial";

            if(mouse.pressed) {
                leftImage = this.images["buttonLeftPressed"];
                centerImage = this.images["buttonCenterPressed"];
                rightImage = this.images["buttonRightPressed"];
                context.fillStyle = "rgb(150, 200, 200, 255)";
                context.font = "30px Arial";
            }
        }

        context.drawImage(leftImage, this.x, this.y);
        this.textWidth = context.measureText(this.text).width;

        context.drawImage(centerImage, this.x + leftImage.width, this.y, this.textWidth + 3, centerImage.height);
        context.drawImage(rightImage, this.x + leftImage.width + this.textWidth, this.y);

        this.width = leftImage.width + this.textWidth + rightImage.width;
        this.height = leftImage.height;
        context.fillText(this.text, this.x + leftImage.width * 0.91, this.y + 28);
    }

    isPointInBounds(x, y) {
        let pointInsideRectBounds = x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;

        // Test if the point is inside the mask:

        // These are the Image objects that we will be testing against:
        let leftMask = this.images["buttonLeftMask"];
        let centerMask = this.images["buttonCenterMask"];
        let rightMask = this.images["buttonRightMask"];

        if (!pointInsideRectBounds) {
            return false;
        }

        if(leftMask.context.getImageData(x - this.x, y - this.y, 1, 1).data[3] > 0) {
            return true;
        }

        if((x > this.x + leftMask.width) && (x < this.x + leftMask.width + this.textWidth) && centerMask.context.getImageData(3, y - this.y, 1, 1).data[3] > 0) {
            return true;
        }

        if((x > this.x + leftMask.width + this.textWidth) && rightMask.context.getImageData(x - this.x - leftMask.width - this.textWidth, y - this.y, 1, 1).data[3] > 0) {
            return true;
        }

        return false;
    }
}

class TextInput {
    constructor(images, x, y, label) {
        this.images = images;

        this.x = x;
        this.y = y;

        this.label = label;
        this.text = "";
        this.textWidth = 0;
    }

    textToDisplay() {
        return this.label + ": " + this.text;
    }

    draw(context) {
        let leftImage = this.images["textInputLeft"];
        let centerImage = this.images["textInputCenter"];
        let rightImage = this.images["textInputRight"];

        let mouseInside = this.isPointInBounds(mouse.x, mouse.y);

        context.fillStyle = "black";
        context.font = "30px Arial";

        if(mouseInside) {
            context.fillStyle = "rgb(200, 200, 200, 255)";
        }

        context.drawImage(leftImage, this.x, this.y);
        this.textWidth = context.measureText(this.textToDisplay()).width;

        context.drawImage(centerImage, this.x + leftImage.width, this.y, this.textWidth + 3, centerImage.height);
        context.drawImage(rightImage, this.x + leftImage.width + this.textWidth, this.y);

        this.width = leftImage.width + this.textWidth + rightImage.width;
        this.height = leftImage.height;
        context.fillText(this.textToDisplay(), this.x + leftImage.width * 0.91, this.y + 28);
    }

    isPointInBounds(x, y) {
        let pointInsideRectBounds = x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;

        return pointInsideRectBounds;
        // Test if the point is inside the mask:

        // These are the Image objects that we will be testing against:
        // let leftMask = this.images["textInputLeftMask"];
        // let centerMask = this.images["textInputCenterMask"];
        // let rightMask = this.images["textInputRightMask"];

        // if (!pointInsideRectBounds) {
        //     return false;
        // }

        // if(leftMask.context.getImageData(x - this.x, y - this.y, 1, 1).data[3] > 0) {
        //     return true;
        // }

        // if((x > this.x + leftMask.width) && (x < this.x + leftMask.width + this.textWidth) && centerMask.context.getImageData(3, y - this.y, 1, 1).data[3] > 0) {
        //     return true;
        // }

        // if((x > this.x + leftMask.width + this.textWidth) && rightMask.context.getImageData(x - this.x - leftMask.width - this.textWidth, y - this.y, 1, 1).data[3] > 0) {
        //     return true;
        // }

        // return false;
    }
}

function renderImageInItsOwnContext(images, imageKey) {
    let image = images[imageKey];
    let canvas = document.createElement("canvas");
    let context = canvas.getContext("2d", {willReadFrequently: true});

    canvas.width = image.width;
    canvas.height = image.height;

    context.drawImage(image, 0, 0);

    images[imageKey].canvas  = canvas;
    images[imageKey].context = context;
}

function loadImageResources(images, callback) {
    let loadedImages = {};
    let numLoadedImages = 0;
    let numImages = 0;

    for (let key in images) {
        numImages++;
    }

    for (let key in images) {
        loadedImages[key] = new Image();
        //loadedImages[key].crossOrigin = "anonymous";
        loadedImages[key].onload = () => {
            numLoadedImages++;
            if (numLoadedImages === numImages) {
                callback(loadedImages);
            }
        };
        loadedImages[key].src = images[key];
    }

    return loadedImages;
}

window.onload = function () {
    let canvas = document.getElementById("gameCanvas");
    let context = canvas.getContext("2d");
    let dpr = window.devicePixelRatio || 1;

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context.scale(1/dpr, 1/dpr);
    }

    window.addEventListener("resize", resizeCanvas);

    loadImageResources(
        {
            "splashscreen": "resources/DDD.png",

            "buttonLeft": "resources/buttonLeft.png",
            "buttonCenter": "resources/buttonCenter.png",
            "buttonRight": "resources/buttonRight.png",

            "buttonLeftMask": "resources/buttonLeftMask.png",
            "buttonCenterMask": "resources/buttonCenterMask.png",
            "buttonRightMask": "resources/buttonRightMask.png",

            "buttonLeftHover": "resources/buttonLeftHover.png",
            "buttonCenterHover": "resources/buttonCenterHover.png",
            "buttonRightHover": "resources/buttonRightHover.png",

            "buttonLeftPressed": "resources/buttonLeftPressed.png",
            "buttonCenterPressed": "resources/buttonCenterPressed.png",
            "buttonRightPressed": "resources/buttonRightPressed.png",

            "mainBackground": "resources/mainBackground.png",
            "menuTitle": "resources/menuTitle.png",

            "textInputLeft": "resources/textInputLeft.png",
            "textInputCenter": "resources/textInputCenter.png",
            "textInputRight": "resources/textInputRight.png",

            "grassTile": "resources/grassTile1.png",
            "cornerWallTile": "resources/cornerWallTile1.png",
            "wallTile": "resources/wallTile1.png",

            "villagerAsset": "resources/villagerAsset1.png",
            "knightAsset": "resources/knightAsset1.png"
        },
        (images) => {
            renderImageInItsOwnContext(images, "buttonLeftMask");
            renderImageInItsOwnContext(images, "buttonCenterMask");
            renderImageInItsOwnContext(images, "buttonRightMask");
            renderImageInItsOwnContext(images, "textInputLeft");
            renderImageInItsOwnContext(images, "textInputCenter");
            renderImageInItsOwnContext(images, "textInputRight");


            const SPLASH_SCREEN = 0;
            const MENU_SCREEN = 1;
            const CONNECTION_SCREEN = 2;
            const GAME_SCREEN = 3;

            let currentScreen = GAME_SCREEN;
            
            let mainMenuScreen = {};
            mainMenuScreen.gui = new GUI(images);
            mainMenuScreen.gui.addButton("start", 50, canvas.height - 400, "Start", () => {
                currentScreen = CONNECTION_SCREEN;
            });
            mainMenuScreen.gui.addButton("showMessage", 50, canvas.height - 300, "Hi!", () => {
                alert("Hello!");
            });
            mainMenuScreen.gui.addButton("settings", 50, canvas.height - 200, "Settings", () => {
            });
            
            let connectionMenuScreen = {};
            connectionMenuScreen.gui = new GUI(images);
            connectionMenuScreen.gui.addTextInput("peerId", 50, canvas.height - 400, "Peer ID");

            let map = [];
            let currentType = "grassTile";

            canvas.oncontextmenu = (e) => {
                return false;
            };
            
            canvas.onmousemove = (m) => {
                mouse.x = m.offsetX;
                mouse.y = m.offsetY;

                // for mobile devices:
                if(m.touches) {
                    mouse.x = m.touches[0].clientX;
                    mouse.y = m.touches[0].clientY;
                }
            };

            canvas.onmousedown = (e) => {
                mouse.pressed = true;
                e.stopPropagation();
                e.preventDefault();

                mouse.x = e.offsetX;
                mouse.y = e.offsetY;

                switch(currentScreen) {
                    case SPLASH_SCREEN:
                        currentScreen = MENU_SCREEN;
                        break;
                    case MENU_SCREEN:
                        mainMenuScreen.gui.handleMouseClick(mouse.x, mouse.y);
                        break;
                    case CONNECTION_SCREEN:
                        connectionMenuScreen.gui.handleMouseClick(mouse.x, mouse.y);
                        break;
                    case GAME_SCREEN:
                        let mouseButton = e.button;

                        if(mouseButton === 0) {
                            let tile = {};
                            tile.x = mouse.x - images[currentType].width/2;
                            tile.y = mouse.y - images[currentType].height/2;
                            tile.type = currentType;
                            map.push(tile);
                        } else if(mouseButton === 2) {
                            if(currentType === "grassTile") {
                                currentType = "wallTile";
                            } else if(currentType === "wallTile") {
                                currentType = "cornerWallTile";
                            } else if(currentType === "cornerWallTile") {
                                currentType = "grassTile";
                            }
                        }
                        break;
                }
            };

            canvas.onwheel = (e) => {
                if(e.deltaY > 0) {
                    if(currentType === "grassTile") {
                        currentType = "wallTile";
                    } else if(currentType === "wallTile") {
                        currentType = "cornerWallTile";
                    } else if(currentType === "cornerWallTile") {
                        currentType = "villagerAsset";
                    } else if(currentType === "villagerAsset") {
                        currentType = "knightAsset";
                    } else if(currentType === "knightAsset") {
                        currentType = "grassTile";
                    }
                } else if(e.deltaY < 0) {
                    if(currentType === "grassTile") {
                        currentType = "knightAsset";
                    } else if(currentType === "knightAsset") {
                        currentType = "villagerAsset";
                    } else if(currentType === "villagerAsset") {
                        currentType = "cornerWallTile";
                    } else if(currentType === "cornerWallTile") {
                        currentType = "wallTile";
                    } else if(currentType === "wallTile") {
                        currentType = "grassTile";
                    }
                }
            };

            canvas.onmouseup = () => {
                mouse.pressed = false;
            };


            function gameLoop() {
                let fps = 1000/(Date.now() - lastFrameTime);
                lastFrameTime = Date.now();

                context.textAlign = "left";
                context.textBaseline = "top";

                switch(currentScreen) {
                    case SPLASH_SCREEN:
                        let splashScreenImageRatio = images["splashscreen"].width/images["splashscreen"].height;
                        let canvasRatio = canvas.width/canvas.height;
                        context.fillStyle = "rgb(0, 0, 0, 255)";
                        context.fillRect(0, 0, canvas.width, canvas.height);

                        
                        // Draw the splash screen image centered, and scaled to fit the canvas:
                        if (splashScreenImageRatio > canvasRatio) {
                            // The image is wider than the canvas, so we need to scale it to fit the canvas width:
                            context.drawImage(images["splashscreen"], 0, canvas.height/2 - (canvas.width/splashScreenImageRatio) / 2, canvas.width, canvas.width/splashScreenImageRatio);
                        } else {
                            // The image is taller than the canvas, so we need to scale it to fit the canvas height:
                            context.drawImage(images["splashscreen"], canvas.width/2 - (canvas.height*splashScreenImageRatio) / 2, 0, canvas.height*splashScreenImageRatio, canvas.height);
                        }

                        break;
                    case MENU_SCREEN:
                        context.fillStyle = "rgb(0, 0, 0, 255)";
                        context.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw the main menu background image to fit the screen:
                        if(images["mainBackground"].width/images["mainBackground"].height > canvas.width/canvas.height) {
                            // The image is wider than the canvas, so we need to scale it to fit the canvas width:
                            context.drawImage(images["mainBackground"], canvas.width/2 - (canvas.height*images["mainBackground"].width/images["mainBackground"].height) / 2, 0, canvas.height*images["mainBackground"].width/images["mainBackground"].height, canvas.height);
                        } else {
                            // The image is taller than the canvas, so we need to scale it to fit the canvas height:
                            context.drawImage(images["mainBackground"], 0, canvas.height/2 - (canvas.width*images["mainBackground"].height/images["mainBackground"].width) / 2, canvas.width, canvas.width*images["mainBackground"].height/images["mainBackground"].width);
                        }

                        // Draw the menu title image centered at the top of the screen:
                        //context.drawImage(images["menuTitle"], canvas.width - images["menuTitle"].width * 0.6 - 30, 0, images["menuTitle"].width * 0.6, images["menuTitle"].height * 0.6);
                        context.drawImage(images["menuTitle"], 30, 0, images["menuTitle"].width * 0.6, images["menuTitle"].height * 0.6);
                        
                        mainMenuScreen.gui.draw(context);
                        break;
                    case CONNECTION_SCREEN:
                        context.fillStyle = "rgb(0, 0, 0, 255)";
                        context.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw the main menu background image to fit the screen:
                        if(images["mainBackground"].width/images["mainBackground"].height > canvas.width/canvas.height) {
                            // The image is wider than the canvas, so we need to scale it to fit the canvas width:
                            context.drawImage(images["mainBackground"], canvas.width/2 - (canvas.height*images["mainBackground"].width/images["mainBackground"].height) / 2, 0, canvas.height*images["mainBackground"].width/images["mainBackground"].height, canvas.height);
                        } else {
                            // The image is taller than the canvas, so we need to scale it to fit the canvas height:
                            context.drawImage(images["mainBackground"], 0, canvas.height/2 - (canvas.width*images["mainBackground"].height/images["mainBackground"].width) / 2, canvas.width, canvas.width*images["mainBackground"].height/images["mainBackground"].width);
                        }

                        // Draw the menu title image centered at the top of the screen:
                        //context.drawImage(images["menuTitle"], canvas.width - images["menuTitle"].width * 0.6 - 30, 0, images["menuTitle"].width * 0.6, images["menuTitle"].height * 0.6);
                        context.drawImage(images["menuTitle"], 30, 0, images["menuTitle"].width * 0.6, images["menuTitle"].height * 0.6);
                        
                        connectionMenuScreen.gui.draw(context);
                        break;
                    case GAME_SCREEN:
                        // context.fillStyle = "rgb(" + (((Math.sin(Date.now()/1000*5) + 1)/2)*50+50) + ", 0, 255)";
                        // context.fillRect(0, 0, canvas.width, canvas.height);
                
                        
                        // context.fillStyle = "white";
                        // context.beginPath();
                        // context.ellipse(mouse.x, mouse.y, 25, 25, 0, 0, 2 * Math.PI);
                        // context.fill();

                        context.fillStyle = "rgb(200, 200, 200, 255)";
                        context.fillRect(0, 0, canvas.width, canvas.height);
                
                        
                        context.fillStyle = "white";
                        context.beginPath();
                        context.ellipse(mouse.x, mouse.y, 10, 10, 0, 0, 2 * Math.PI);
                        context.fill();

                        for(let i = 0; i < map.length; i++) {
                            let tile = map[i];
                            context.drawImage(images[tile.type], tile.x, tile.y);
                        }

                        context.drawImage(images[currentType], mouse.x - images[currentType].width/2, mouse.y - images[currentType].height/2);
                        break;
                }



                context.fillStyle = "white";
                context.font = "30px Arial";
                context.fillText("FPS: " + Number(fps).toFixed(2), 20, 20);

                window.requestAnimationFrame(gameLoop);
            }

            window.requestAnimationFrame(gameLoop);
        }
    );

    resizeCanvas();

    let lastFrameTime = 0;



    // connectButton.onclick = () => {
    //     logEvent("Connecting to PeerServer with the following ID: " + getPeerId());
    
    //     peer = new Peer(getPeerId());

    //     peer.on("connection", (dataConnection) => {
    //         logEvent("Connection received from: " + dataConnection.peer);

    //         dataConnection.on("data", (data) => {
    //             logEvent("Received: " + typeof(data));
    //             // data might not be string, so we need to convert it to string
    //             logEvent("Received: " + data.toString());
    //         });
    //     });

    //     peer.on("error", (err) => {
    //         logEvent(err);
    //     });
    // };

    // connectPeerButton.onclick = () => {
    //     let connection = peer.connect(peerId);
    //     connection.on("open", function (id) {
    //         logEvent("My peer ID is: " + id);

    //         connection.send("Hello from " + myPeerId);
    //     });
    // };

};
