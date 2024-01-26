
let peerIDBase = '_testgame11235813';

let peer;
let myPeerId = '';
let connection = null;

let mouse = {x: 0, y: 0};

let context;
let canvas;
let dpr;
let uiScale = 1;
let uiFontSize = 30;
let uiFontFamily = 'Arial';
let uiFont = () => uiFontSize + 'px ' + uiFontFamily;
let uiFontSizeBig = 33;
let uiFontFamilyBig = 'Arial';
let uiFontBig = () => uiFontSize + 'px ' + uiFontFamily;
let canvasIsFullscreen = false;

let debug = false;

let currentLocale = 'en';

let logMessages = [];

let logoPosition = {x: 0, y: 0, size: 1};
let logoPositionState = 'shown';

// Translated strings:

let strings = {
    'en': {
        'start': 'Start',
        'settings': 'Settings',
        'back': 'Back',
        'connect': 'Connect',
        'disconnect': 'Disconnect',
        'connecting': 'Connecting...',
        'error': 'Error',
        'warning': 'Warning',
        'notice': 'Notice',
        'info': 'Info',
        'connectToPeer': 'Connect to peer',
        'fullscreen': 'Fullscreen',
        'enterValue': 'Enter value for: ',
        'enteredFullscreen': 'Entered fullscreen mode',
        'exitedFullscreen': 'Exited fullscreen mode',
        'connectedToPeerServerWithId': 'Connected to PeerServer with the following ID: ',
        'connectionReceivedFrom': 'Connection received from: ',
        'received': 'Received: ',
        'disconnectedFromPeerServer': 'Disconnected from PeerServer',
        'myPeerIdIs': 'My peer ID is: ',
        'myPeerId': 'My peer ID',
        'peerId': 'Peer ID',
        'helloFrom': 'Hello from: ',
        'changeLanguage': 'Change language',
        'hiButton': 'Hi!',
        'hello': 'Hello!',
        'empires': 'Empires',
        'DDD': 'DDD',
        'toggleDebug': 'Toggle debug',
        'sendMessage': 'Send message'
    },
    'es': {
        'start': 'Empezar',
        'settings': 'Configuración',
        'back': 'Atrás',
        'connect': 'Conectar',
        'disconnect': 'Desconectar',
        'connecting': 'Conectando...',
        'error': 'Error',
        'warning': 'Advertencia',
        'notice': 'Aviso',
        'info': 'Información',
        'connectToPeer': 'Conectar a par',
        'fullscreen': 'Pantalla completa',
        'enterValue': 'Introducir valor para: ',
        'enteredFullscreen': 'Pantalla completa',
        'exitedFullscreen': 'Salida: Pantalla completa',
        'connectedToPeerServerWithId': 'Conectado a PeerServer con la siguiente ID: ',
        'connectionReceivedFrom': 'Conexión recibida de: ',
        'received': 'Recibido: ',
        'disconnectedFromPeerServer': 'Desconectado de PeerServer',
        'myPeerIdIs': 'Mi ID de par es: ',
        'myPeerId': 'Mi ID',
        'peerId': 'ID de par',
        'helloFrom': 'Hola de: ',
        'changeLanguage': 'Cambiar idioma',
        'hiButton': '¡Hola!',
        'hello': '¡Hola!',
        'empires': 'Imperios',
        'DDD': 'DDD',
        'toggleDebug': 'Alternar depuración',
        'sendMessage': 'Enviar mensaje'
    },
    'jp': {
        'start': 'スタート',
        'settings': '設定',
        'back': 'バック',
        'connect': '接続',
        'disconnect': '切断',
        'connecting': '接続中...',
        'error': 'エラー',
        'warning': '警告',
        'notice': '注意',
        'info': '情報',
        'connectToPeer': '接続する',
        'fullscreen': '全画面表示',
        'enterValue': '入力値: ',
        'enteredFullscreen': 'フルスクリーンモードに入りました',
        'exitedFullscreen': 'フルスクリーンモードを終了しました',
        'connectedToPeerServerWithId': '次のIDでPeerServerに接続しました: ',
        'connectionReceivedFrom': '次のIDからの接続を受信しました: ',
        'received': '受信した: ',
        'disconnectedFromPeerServer': 'PeerServerから切断されました',
        'myPeerIdIs': '私のピアIDは次のとおりです: ',
        'myPeerId': '私のピアID',
        'peerId': 'ピアID',
        'helloFrom': 'こんにちは: ',
        'changeLanguage': '言語を変更',
        'hiButton': 'こんにちは！',
        'hello': 'こんにちは！',
        'empires': 'エンパイア',
        'DDD': 'DDD',
        'toggleDebug': 'デバッグを切り替える',
        'sendMessage': 'メッセージを送信する'
    }
};



function localizeString(string, language, alternative) {
    if(strings[language] && strings[language][string]) {
        return strings[language][string];
    }
    
    if(alternative) {
        return alternative;
    }

    return strings['en'][string];
}

function logMessage(msg, duration, type) {
    if (duration === undefined) {
        duration = 4000;
    }

    if (type === undefined) {
        type = 'info';
    }

    if (type === 'error') {
        console.error(msg);
    } else if (type === 'warning') {
        console.warn(msg);
    } else {
        console.log(msg);
    }
    
    logMessages.push({text: msg, time: Date.now(), duration: duration, type: type});
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

    relayout() {
        let buttonY = 120 * uiScale;
        let spaceBetweenElements = 20 * uiScale;

        for (let button of Object.values(this.buttons)) {
            button.y = buttonY;
            buttonY += button.height + spaceBetweenElements;
        }

        let textInputY = buttonY + spaceBetweenElements * 1.5;
        for (let textInput of Object.values(this.textInputs)) {
            textInput.y = textInputY;
            textInputY += textInput.height + spaceBetweenElements;
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
                let text = prompt(localizeString('enterValue', currentLocale, 'Enter the value for: ') + textInput.label);
                textInput.text = text;
                return;
            }
        }
    }
}

function layoutFromTheBottom(gui) {
    let buttonY = 120 * uiScale;
    let spaceBetweenElements = 20 * uiScale;
    
    let buttons = Object.values(gui.buttons);

    for(let i = buttons.length - 1; i >= 0; i--) {
        let button = buttons[i];
        button.y = canvas.height - buttonY;
        buttonY += button.height + spaceBetweenElements;
    }

    let textInputY = buttonY + spaceBetweenElements * 1.5;
    let textInputs = Object.values(gui.textInputs);

    for(let i = textInputs.length - 1; i >= 0; i--) {
        let textInput = textInputs[i];
        textInput.y = canvas.height - textInputY;
        textInputY += textInput.height + spaceBetweenElements;
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
        
        this.mode = 'button';
        this.toggled = false;
    }

    draw(context) {
        let leftImage = this.images['buttonLeft'];
        let centerImage = this.images['buttonCenter'];
        let rightImage = this.images['buttonRight'];
        context.fillStyle = 'white';
        context.font = uiFont();

        let containsMouse = this.isPointInBounds(mouse.x, mouse.y);

        if(containsMouse) {
            leftImage = this.images['buttonLeftHover'];
            centerImage = this.images['buttonCenterHover'];
            rightImage = this.images['buttonRightHover'];
            context.fillStyle = 'rgb(200, 230, 230, 255)';
            context.font = uiFontBig();

            if(mouse.pressed) {
                leftImage = this.images['buttonLeftPressed'];
                centerImage = this.images['buttonCenterPressed'];
                rightImage = this.images['buttonRightPressed'];
                context.fillStyle = 'rgb(150, 200, 200, 255)';
                context.font = uiFont();
            }
        }

        let textToDisplay = this.text;
        if(this.localizedText !== undefined) {
            textToDisplay = localizeString(this.localizedText, currentLocale, this.text);
        }

        this.textWidth = context.measureText(textToDisplay).width;
        this.width = leftImage.width * uiScale + this.textWidth + rightImage.width * uiScale;
        this.height = leftImage.height * uiScale;

        context.drawImage(centerImage, this.x + leftImage.width * uiScale - 1, this.y, this.textWidth + 3, centerImage.height * uiScale);
        context.drawImage(leftImage, this.x, this.y, leftImage.width * uiScale, leftImage.height * uiScale);
        context.drawImage(rightImage, this.x + leftImage.width * uiScale + this.textWidth, this.y, rightImage.width * uiScale, rightImage.height * uiScale);

        context.fillText(textToDisplay, this.x + leftImage.width * 0.91 * uiScale, this.y + 28 * uiScale);

        if(this.mode === 'toggle') {
            let toggleImage = this.toggled ? this.images['toggleOn'] : this.images['toggleOff'];
            context.drawImage(toggleImage, this.x + leftImage.width * uiScale + this.textWidth - 10 * uiScale, this.y + this.height * 0.2, toggleImage.width * uiScale * 0.5, toggleImage.height * uiScale * 0.5);
        }

        // Draw debug outline:
        if(debug) {
            context.strokeStyle = 'red';
            context.lineWidth = 1;
            context.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    isPointInBounds(x, y) {
        let pointInsideRectBounds = x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;

        // Test if the point is inside the mask:

        // These are the Image objects that we will be testing against:
        let leftMask = this.images['buttonLeftMask'];
        let centerMask = this.images['buttonCenterMask'];
        let rightMask = this.images['buttonRightMask'];

        if (!pointInsideRectBounds) {
            return false;
        }

        if(leftMask.context.getImageData((x - this.x) / uiScale, (y - this.y) / uiScale, 1, 1).data[3] > 0) {
            return true;
        }

        if((x > this.x + leftMask.width * uiScale) && (x < this.x + leftMask.width * uiScale + this.textWidth) && centerMask.context.getImageData(3, (y - this.y) / uiScale, 1, 1).data[3] > 0) {
            return true;
        }

        if((x > this.x + leftMask.width * uiScale + this.textWidth) && rightMask.context.getImageData((x - this.x - leftMask.width * uiScale - this.textWidth) / uiScale, (y - this.y) / uiScale, 1, 1).data[3] > 0) {
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
        this.text = '';
        this.textWidth = 0;
    }

    textToDisplay() {
        if(this.localizedText !== undefined) {
            return localizeString(this.localizedText, currentLocale, this.label) + ': ' + this.text;
        }

        return this.label + ': ' + this.text;
    }

    draw(context) {
        let leftImage = this.images['textInputLeft'];
        let centerImage = this.images['textInputCenter'];
        let rightImage = this.images['textInputRight'];

        let mouseInside = this.isPointInBounds(mouse.x, mouse.y);

        context.fillStyle = 'black';
        context.font = uiFont();

        if(mouseInside) {
            context.fillStyle = 'rgb(150, 150, 150, 255)';
        }

        context.drawImage(leftImage, this.x, this.y, leftImage.width * uiScale, leftImage.height * uiScale);
        this.textWidth = context.measureText(this.textToDisplay()).width;
        this.width = leftImage.width * uiScale + this.textWidth + rightImage.width * uiScale;
        this.height = leftImage.height * uiScale;

        context.drawImage(centerImage, this.x + leftImage.width * uiScale, this.y, this.textWidth + 3, centerImage.height * uiScale);
        context.drawImage(rightImage, this.x + leftImage.width * uiScale + this.textWidth, this.y, rightImage.width * uiScale, rightImage.height * uiScale);

        this.width = leftImage.width * uiScale + this.textWidth + rightImage.width * uiScale;
        this.height = leftImage.height * uiScale;
        context.fillText(this.textToDisplay(), this.x + leftImage.width * 0.91 * uiScale, this.y + 28 * uiScale);

        // Draw debug outline:
        if(debug) {
            context.strokeStyle = 'red';
            context.lineWidth = 1;
            context.strokeRect(this.x, this.y, this.width, this.height);
        }
    }

    isPointInBounds(x, y) {
        let pointInsideRectBounds = x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;

        // Test if the point is inside the mask:

        // These are the Image objects that we will be testing against:
        let leftMask = this.images['textInputLeft'];
        let centerMask = this.images['textInputCenter'];
        let rightMask = this.images['textInputRight'];

        if (!pointInsideRectBounds) {
            return false;
        }

        if(leftMask.context.getImageData((x - this.x) / uiScale, (y - this.y) / uiScale, 1, 1).data[3] > 0) {
            return true;
        }

        if((x > this.x + leftMask.width * uiScale) && (x < this.x + leftMask.width * uiScale + this.textWidth) && centerMask.context.getImageData(3, (y - this.y) / uiScale, 1, 1).data[3] > 0) {
            return true;
        }

        if((x > this.x + leftMask.width * uiScale + this.textWidth) && rightMask.context.getImageData((x - this.x - leftMask.width * uiScale - this.textWidth) / uiScale, (y - this.y) / uiScale, 1, 1).data[3] > 0) {
            return true;
        }

        return false;
    }
}

function renderImageInItsOwnContext(images, imageKey) {
    let image = images[imageKey];
    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d', {willReadFrequently: true});

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
        //loadedImages[key].crossOrigin = 'anonymous';
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

function goFullscreen() {
    canvas.requestFullscreen();

    context.imageSmoothingEnabled = false;

    context.scale(1/dpr, 1/dpr);
}

function resizeCanvas() {
    //logMessage('resizeCanvas()');
    dpr = window.devicePixelRatio || 1;
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    context.scale(1, 1);
    uiScale = canvas.width / 1920;
    if(uiScale < 0.5) {
        uiScale = 0.5 - (1 - (uiScale/0.5)) * 0.5;
    }
    if(uiScale < 0.5) {
        uiScale = 0.5;
    }
    uiFontSize = Math.max(30 * uiScale, 3);

    setTimeout(() => {
        dpr = window.devicePixelRatio || 1;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        context.scale(1, 1);
        uiScale = canvas.width / 1920;
        if(uiScale < 0.5) {
            uiScale = 0.5 - (1 - (uiScale/0.5)) * 0.5;
        }
        if(uiScale < 0.5) {
            uiScale = 0.5;
        }
        uiFontSize = Math.max(30 * uiScale, 3);
    }, 300);
}

function drawLogMessages() {
    let logMessageHeight = 40 * uiScale;
    let logMessagePadding = 10 * uiScale;

    context.font = (20 * uiScale) + 'px Arial';
    
    for(let i = 0; i < logMessages.length; i++) {
        let logMessage = logMessages[i];
        let logMessageWidth = context.measureText(logMessage.text).width + logMessagePadding * 2;

        let logMessageX = canvas.width - logMessageWidth - logMessagePadding;
        let logMessageY = canvas.height - logMessageHeight - logMessagePadding - i * (logMessageHeight + logMessagePadding);

        // Rounded corner box:
        context.fillStyle = 'rgb(245, 245, 245, 255)';

        if(logMessage.type === 'error') {
            context.fillStyle = 'rgb(245, 203, 193, 255)';
        } else if(logMessage.type === 'warning') {
            context.fillStyle = 'rgb(255, 250, 242, 255)';
        } else if(logMessage.type === 'notice') {
            context.fillStyle = 'rgb(229, 246, 213, 255)';
        }

        context.beginPath();
        context.moveTo(logMessageX + 10 * uiScale, logMessageY);
        context.lineTo(logMessageX + logMessageWidth - 10 * uiScale, logMessageY);
        context.quadraticCurveTo(logMessageX + logMessageWidth, logMessageY, logMessageX + logMessageWidth, logMessageY + 10 * uiScale);
        context.lineTo(logMessageX + logMessageWidth, logMessageY + logMessageHeight - 10 * uiScale);
        context.quadraticCurveTo(logMessageX + logMessageWidth, logMessageY + logMessageHeight, logMessageX + logMessageWidth - 10 * uiScale, logMessageY + logMessageHeight);
        context.lineTo(logMessageX + 10 * uiScale, logMessageY + logMessageHeight);
        context.quadraticCurveTo(logMessageX, logMessageY + logMessageHeight, logMessageX, logMessageY + logMessageHeight - 10 * uiScale);

        context.lineTo(logMessageX, logMessageY + 10 * uiScale);
        context.quadraticCurveTo(logMessageX, logMessageY, logMessageX + 10 * uiScale, logMessageY);
        context.closePath();
        context.fill();

        // Text:
        context.fillStyle = 'rgb(68, 68, 68, 255)';
        context.fillText(logMessage.text, logMessageX + logMessagePadding, logMessageY + logMessagePadding);
    }

    // Remove old log messages:
    for(let i = logMessages.length - 1; i >= 0; i--) {
        let logMessage = logMessages[i];
        if(Date.now() - logMessage.time > logMessage.duration) {
            logMessages.splice(i, 1);
        }
    }
}


window.onload = function () {
    canvas = document.getElementById('gameCanvas');
    context = canvas.getContext('2d');

    window.addEventListener('resize', resizeCanvas);

    document.addEventListener('fullscreenchange', () => {
        if (document.fullscreenElement) {
            canvasIsFullscreen = true;
            try {
                settingsScreen.gui.buttons['fullscreen'].toggled = true;
            } catch(e) {}
        } else {
            canvasIsFullscreen = false;
            try {
                settingsScreen.gui.buttons['fullscreen'].toggled = false;
            } catch(e) {}
        }
    });

    loadImageResources(
        {
            'splashscreen': 'resources/DDD.png',

            'buttonLeft': 'resources/buttonLeft.png',
            'buttonCenter': 'resources/buttonCenter.png',
            'buttonRight': 'resources/buttonRight.png',

            'buttonLeftMask': 'resources/buttonLeftMask.png',
            'buttonCenterMask': 'resources/buttonCenterMask.png',
            'buttonRightMask': 'resources/buttonRightMask.png',

            'buttonLeftHover': 'resources/buttonLeftHover.png',
            'buttonCenterHover': 'resources/buttonCenterHover.png',
            'buttonRightHover': 'resources/buttonRightHover.png',

            'buttonLeftPressed': 'resources/buttonLeftPressed.png',
            'buttonCenterPressed': 'resources/buttonCenterPressed.png',
            'buttonRightPressed': 'resources/buttonRightPressed.png',

            'mainBackground': 'resources/mainBackground.png',
            'menuTitle': 'resources/menuTitle.png',
            'menuTitleEs': 'resources/menuTitleEs.png',
            'menuTitleJp': 'resources/menuTitleJp.png',

            'textInputLeft': 'resources/textInputLeft.png',
            'textInputCenter': 'resources/textInputCenter.png',
            'textInputRight': 'resources/textInputRight.png',

            'grassTile': 'resources/grassTile1.png',
            'cornerWallTile': 'resources/cornerWallTile1.png',
            'wallTile': 'resources/wallTile1.png',

            'villagerAsset': 'resources/villagerAsset1.png',
            'knightAsset': 'resources/knightAsset1.png',

            'toggleOn': 'resources/toggleOn.png',
            'toggleOff': 'resources/toggleOff.png',
        },
        (images) => {
            renderImageInItsOwnContext(images, 'buttonLeftMask');
            renderImageInItsOwnContext(images, 'buttonCenterMask');
            renderImageInItsOwnContext(images, 'buttonRightMask');
            renderImageInItsOwnContext(images, 'textInputLeft');
            renderImageInItsOwnContext(images, 'textInputCenter');
            renderImageInItsOwnContext(images, 'textInputRight');

            let logoImage = () => {
                if(currentLocale === 'es') {
                    return images['menuTitleEs'];
                } else if(currentLocale === 'jp') {
                    return images['menuTitleJp'];
                }
                return images['menuTitle'];
            };

            function drawLogoImage() {
                context.drawImage(logoImage(), logoPosition.x, logoPosition.y, logoImage().width * logoPosition.size, logoImage().height * logoPosition.size);
            }


            const SPLASH_SCREEN = 0;
            const MENU_SCREEN = 1;
            const CONNECTION_SCREEN = 2;
            const GAME_SCREEN = 3;
            const SETTINGS_SCREEN = 4;

            let currentScreen = SPLASH_SCREEN;
            
            let mainMenuScreen = {};
            mainMenuScreen.gui = new GUI(images);
            mainMenuScreen.gui.addButton('start', 50, canvas.height - 400, localizeString('connect', currentLocale, 'Connect'), () => {
                currentScreen = CONNECTION_SCREEN;
            });
            mainMenuScreen.gui.buttons['start'].localizedText = 'connect';

            // mainMenuScreen.gui.addButton('showMessage', 50, canvas.height - 300, localizeString('hiButton', currentLocale, 'Hi!'), () => {
            //     logMessage(localizeString('hello', currentLocale, 'Hello!'), 6000, 'warning');
            // });
            // mainMenuScreen.gui.buttons['showMessage'].localizedText = 'hiButton';

            mainMenuScreen.gui.addButton('settings', 50, canvas.height - 200, localizeString('settings', currentLocale, 'Settings'), () => {
                currentScreen = SETTINGS_SCREEN;
            });
            mainMenuScreen.gui.buttons['settings'].localizedText = 'settings';

            mainMenuScreen.gui.relayout = () => layoutFromTheBottom(mainMenuScreen.gui);
            
            let connectionMenuScreen = {};
            connectionMenuScreen.gui = new GUI(images);
            connectionMenuScreen.gui.relayout = () => {
                let connectButton = connectionMenuScreen.gui.buttons['connect'];
                let connectToPeerButton = connectionMenuScreen.gui.buttons['connectToPeer'];
                let backButton = connectionMenuScreen.gui.buttons['back'];
                let myPeerIdTextInput = connectionMenuScreen.gui.textInputs['myPeerId'];
                let peerIdTextInput = connectionMenuScreen.gui.textInputs['peerId'];
                let startGameButton = connectionMenuScreen.gui.buttons['startGame'];

                myPeerIdTextInput.y = canvas.height - 400 * uiScale;
                myPeerIdTextInput.x = 50 * uiScale;

                connectButton.y = canvas.height - 400 * uiScale;
                connectButton.x = 50 * uiScale + myPeerIdTextInput.width + 20 * uiScale;

                peerIdTextInput.y = canvas.height - 300 * uiScale;
                peerIdTextInput.x = 50 * uiScale;

                connectToPeerButton.y = canvas.height - 300 * uiScale;
                connectToPeerButton.x = 50 * uiScale + peerIdTextInput.width + 20 * uiScale;

                backButton.y = canvas.height - 100 * uiScale;
                backButton.x = 50 * uiScale;

                startGameButton.y = canvas.height - 100 * uiScale;
                startGameButton.x = 50 * uiScale + backButton.width + 20 * uiScale;
            };

            connectionMenuScreen.gui.addTextInput('myPeerId', 50, canvas.height - 400, localizeString('myPeerId', currentLocale, 'My peer ID'));
            connectionMenuScreen.gui.textInputs['myPeerId'].localizedText = 'myPeerId';

            connectionMenuScreen.gui.addTextInput('peerId', 50, canvas.height - 300, localizeString('peerId', currentLocale, 'Peer ID'));
            connectionMenuScreen.gui.textInputs['peerId'].localizedText = 'peerId';
            

            let connectButtonDisconnectAction = () => {
                peer.destroy();
                myPeerId = '';

                logMessage(localizeString('disconnectedFromPeerServer', currentLocale, 'Disconnected from PeerServer'), 5000, 'notice');

                connectionMenuScreen.gui.buttons['connect'].localizedText = 'connect';
                connectionMenuScreen.gui.buttons['connect'].state = 'connect';
            };

            let connectButtonConnectAction = () => {
                peer = new Peer(connectionMenuScreen.gui.textInputs['myPeerId'].text + peerIDBase);
                peer.on('open', (id) => {
                    myPeerId = id;
                    logMessage(localizeString('connectedToPeerServerWithId', currentLocale, 'Connected to PeerServer with ID: ') + myPeerId, 5000, 'notice');

                    connectionMenuScreen.gui.buttons['connect'].localizedText = 'disconnect';
                    connectionMenuScreen.gui.buttons['connect'].state = 'disconnect';
                });

                peer.on('connection', (dataConnection) => {
                    logMessage(localizeString('connectionReceivedFrom', currentLocale, 'Connection received from: ') + dataConnection.peer);

                    connection = dataConnection;
                    connection.on('data', (data) => {
                        logMessage(localizeString('received', currentLocale, 'Received: ') + typeof(data));
                        // data might not be string, so we need to convert it to string
                        logMessage(localizeString('received', currentLocale, 'Received: ') + data.toString());
                    });
                });

                peer.on('error', (err) => {
                    console.error(err);
                    console.error(err.type);

                    switch(err.type) {
                        case 'browser-incompatible':
                            logMessage(localizeString('peerBrowserIncompatible', currentLocale, 'Browser incompatible'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        case 'disconnected':
                            logMessage(localizeString('peerDisconnected', currentLocale, 'Peer connection was already terminated'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        case 'invalid-id':
                            logMessage(localizeString('peerInvalidId', currentLocale, 'Invalid Peer ID'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        case 'invalid-key':
                            logMessage(localizeString('peerInvalidKey', currentLocale, 'Invalid PeerServer key'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        case 'network':
                            logMessage(localizeString('peerNetworkError', currentLocale, 'Peer network error'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        case 'peer-unavailable':
                            logMessage(localizeString('peerUnavailable', currentLocale, 'Peer unavailable'), 5000, 'error');
                            break;
                        case 'ssl-unavailable':
                            logMessage(localizeString('peerSslUnavailable', currentLocale, 'SSL unavailable'), 5000, 'error');
                            break;
                        case 'server-error':
                            logMessage(localizeString('peerServerError', currentLocale, 'Server error'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        case 'socket-error':
                            logMessage(localizeString('peerSocketError', currentLocale, 'Socket error'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        case 'socket-closed':
                            logMessage(localizeString('peerSocketClosed', currentLocale, 'Socket closed'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        case 'unavailable-id':
                            logMessage(localizeString('peerUnavailableId', currentLocale, 'Unavailable ID'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        case 'webrtc':
                            logMessage(localizeString('peerWebRtcError', currentLocale, 'WebRTC error'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                        default:
                            logMessage(localizeString('peerUnknownError', currentLocale, 'Unknown error'), 5000, 'error');
                            connectButtonDisconnectAction();
                            break;
                    }

                    logMessage(localizeString('error', currentLocale, 'Error') + ': ' + err, 5000, 'error');
                });

                connectionMenuScreen.gui.buttons['connect'].state = 'connecting';
                connectionMenuScreen.gui.buttons['connect'].localizedText = 'connecting';
            };

            connectionMenuScreen.gui.addButton('connect', 50, canvas.height - 300, localizeString('connect', currentLocale, 'Connect'), () => {
                if(connectionMenuScreen.gui.buttons['connect'].state === 'connect') {
                    connectButtonConnectAction();
                } else if(connectionMenuScreen.gui.buttons['connect'].state === 'disconnect') {
                    connectButtonDisconnectAction();
                }
            });
            connectionMenuScreen.gui.buttons['connect'].localizedText = 'connect';
            connectionMenuScreen.gui.buttons['connect'].state = 'connect';

            connectionMenuScreen.gui.addButton('startGame', 50, canvas.height - 200, localizeString('start', currentLocale, 'Start'), () => {
                currentScreen = GAME_SCREEN;
            });

            connectionMenuScreen.gui.addButton('back', 50, canvas.height - 200, 'Back', () => {
                currentScreen = MENU_SCREEN;
            });
            connectionMenuScreen.gui.buttons['back'].localizedText = 'back';

            connectionMenuScreen.gui.addButton('connectToPeer', 50, canvas.height - 100, localizeString('connectToPeer', currentLocale, 'Connect to peer'), () => {
                let connection1 = peer.connect(connectionMenuScreen.gui.textInputs['peerId'].text + peerIDBase, {reliable: true});
                connection1.on('open', function (id) {
                    logMessage(localizeString('myPeerIdIs', currentLocale, 'My peer ID is: ') + id);

                    connection1.send(localizeString('helloFrom', currentLocale, 'Hello from ') + myPeerId);
                });
                connection = connection1;
            });

            connectionMenuScreen.gui.buttons['connectToPeer'].localizedText = 'connectToPeer';

            let settingsScreen = {}
            settingsScreen.gui = new GUI(images);
            settingsScreen.gui.relayout = () => layoutFromTheBottom(settingsScreen.gui);

            settingsScreen.gui.addButton('changeLocale', 50, canvas.height - 100, 'Change language', () => {
                let listOfLocaleOptions = Object.keys(strings);
                let currentLocaleIndex = listOfLocaleOptions.indexOf(currentLocale);
                currentLocaleIndex++;
                if(currentLocaleIndex >= listOfLocaleOptions.length) {
                    currentLocaleIndex = 0;
                }
                currentLocale = listOfLocaleOptions[currentLocaleIndex];
            });
            settingsScreen.gui.buttons['changeLocale'].localizedText = 'changeLocale';

            settingsScreen.gui.addButton('fullscreen', 50, canvas.height - 300, localizeString('fullscreen', currentLocale, 'Fullscreen'), () => {
                if(canvasIsFullscreen) {
                    document.exitFullscreen();
                } else {
                    goFullscreen();
                }
            });
            settingsScreen.gui.buttons['fullscreen'].localizedText = 'fullscreen';
            settingsScreen.gui.buttons['fullscreen'].mode = 'toggle';

            settingsScreen.gui.addButton('toggleDebug', 50, canvas.height - 400, localizeString('toggleDebug', currentLocale, 'Toggle debug'), () => {
                debug = !debug;
            });
            settingsScreen.gui.buttons['toggleDebug'].localizedText = 'toggleDebug';

            settingsScreen.gui.addButton('back', 50, canvas.height - 200, localizeString('back', currentLocale, 'Back'), () => {
                currentScreen = MENU_SCREEN;
            });
            settingsScreen.gui.buttons['back'].localizedText = 'back';


            let gameScreen = {};
            gameScreen.gui = new GUI(images);
            gameScreen.gui.relayout = () => layoutFromTheBottom(gameScreen.gui);

            gameScreen.gui.addTextInput('message', 50, canvas.height - 100, localizeString('message', currentLocale, 'Message'));
            gameScreen.gui.textInputs['message'].localizedText = 'message';

            gameScreen.gui.addButton('sendMessage', 50, canvas.height - 200, localizeString('sendMessage', currentLocale, 'Send message'), () => {
                let message = gameScreen.gui.textInputs['message'].text;

                console.log(peer.connections);
                
                //for(let connection of Object.values(peer.connections)) {
                //    console.log(connection[0].send)
                //    connection[0].send(message);
                //}
                if(connection !== undefined) {
                    connection.send(message);
                }
            });

            let map = [];
            let currentType = 'grassTile';

            canvas.oncontextmenu = (e) => {
                return false;
            };
            
            canvas.onmousemove = (m) => {
                // console.log('mousemove: ', m.offsetX, m.offsetY, m.clientX, m.clientY, m.x, m.y);
                mouse.x = m.offsetX;
                mouse.y = m.offsetY;
            };

            canvas.onmousedown = (e) => {
                // console.log('mousedown: ', e.offsetX, e.offsetY, e.clientX, e.clientY, e.x, e.y);
                mouse.pressed = true;

                mouse.x = e.offsetX;
                mouse.y = e.offsetY;

                e.stopPropagation();
                e.preventDefault();

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

                        gameScreen.gui.handleMouseClick(mouse.x, mouse.y);

                        if(mouseButton === 0) {
                            let tile = {};
                            tile.x = mouse.x - images[currentType].width/2;
                            tile.y = mouse.y - images[currentType].height/2;
                            tile.type = currentType;
                            map.push(tile);
                        } else if(mouseButton === 2) {
                            if(currentType === 'grassTile') {
                                currentType = 'wallTile';
                            } else if(currentType === 'wallTile') {
                                currentType = 'cornerWallTile';
                            } else if(currentType === 'cornerWallTile') {
                                currentType = 'grassTile';
                            }
                        }
                        break;
                    case SETTINGS_SCREEN:
                        settingsScreen.gui.handleMouseClick(mouse.x, mouse.y);
                        break;
                }
            };

            canvas.onwheel = (e) => {
                if(e.deltaY > 0) {
                    if(currentType === 'grassTile') {
                        currentType = 'wallTile';
                    } else if(currentType === 'wallTile') {
                        currentType = 'cornerWallTile';
                    } else if(currentType === 'cornerWallTile') {
                        currentType = 'villagerAsset';
                    } else if(currentType === 'villagerAsset') {
                        currentType = 'knightAsset';
                    } else if(currentType === 'knightAsset') {
                        currentType = 'grassTile';
                    }
                } else if(e.deltaY < 0) {
                    if(currentType === 'grassTile') {
                        currentType = 'knightAsset';
                    } else if(currentType === 'knightAsset') {
                        currentType = 'villagerAsset';
                    } else if(currentType === 'villagerAsset') {
                        currentType = 'cornerWallTile';
                    } else if(currentType === 'cornerWallTile') {
                        currentType = 'wallTile';
                    } else if(currentType === 'wallTile') {
                        currentType = 'grassTile';
                    }
                }
            };

            canvas.onmouseup = () => {
                mouse.pressed = false;
            };


            function gameLoop() {
                let fps = 1000/(Date.now() - lastFrameTime);
                lastFrameTime = Date.now();

                context.textAlign = 'left';
                context.textBaseline = 'top';

                // Update logo position:
                if(logoPositionState === 'shown') {
                    let targetX = 20;
                    let targetY = 20;
                    let targetSize = Math.min((canvas.width/logoImage().width) * 0.9, Math.max(0.6 * uiScale, 0.6));
                    //console.log(logoImage.width, targetSize);

                    logoPosition.x = targetX - (targetX - logoPosition.x) * 0.97;
                    logoPosition.y = targetY - (targetY - logoPosition.y) * 0.97;
                    logoPosition.size = targetSize - (targetSize - logoPosition.size) * 0.97;
                } else {
                    let targetX = 10;
                    let targetY = 10;
                    let targetSize = Math.min((canvas.width/logoImage().width) * 0.5, Math.max(0.4 * uiScale, 0.4));
                    //console.log(logoImage.width, targetSize);

                    logoPosition.x = targetX - (targetX - logoPosition.x) * 0.95;
                    logoPosition.y = targetY - (targetY - logoPosition.y) * 0.95;
                    logoPosition.size = targetSize - (targetSize - logoPosition.size) * 0.97;
                }

                switch(currentScreen) {
                    case SPLASH_SCREEN:
                        let splashScreenImageRatio = images['splashscreen'].width/images['splashscreen'].height;
                        let canvasRatio = canvas.width/canvas.height;
                        context.fillStyle = 'rgb(0, 0, 0, 255)';
                        context.fillRect(0, 0, canvas.width, canvas.height);

                        
                        // Draw the splash screen image centered, and scaled to fit the canvas:
                        if (splashScreenImageRatio > canvasRatio) {
                            // The image is wider than the canvas, so we need to scale it to fit the canvas width:
                            context.drawImage(images['splashscreen'], 0, canvas.height/2 - (canvas.width/splashScreenImageRatio) / 2, canvas.width, canvas.width/splashScreenImageRatio);
                        } else {
                            // The image is taller than the canvas, so we need to scale it to fit the canvas height:
                            context.drawImage(images['splashscreen'], canvas.width/2 - (canvas.height*splashScreenImageRatio) / 2, 0, canvas.height*splashScreenImageRatio, canvas.height);
                        }

                        break;
                    case MENU_SCREEN:
                        if(logoPositionState != 'shown') {
                            logoPositionState = 'shown';
                        }
                        context.fillStyle = 'rgb(0, 0, 0, 255)';
                        context.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw the main menu background image to fit the screen:
                        if(images['mainBackground'].width/images['mainBackground'].height > canvas.width/canvas.height) {
                            // The image is wider than the canvas, so we need to scale it to fit the canvas width:
                            context.drawImage(images['mainBackground'], canvas.width/2 - (canvas.height*images['mainBackground'].width/images['mainBackground'].height) / 2, 0, canvas.height*images['mainBackground'].width/images['mainBackground'].height, canvas.height);
                        } else {
                            // The image is taller than the canvas, so we need to scale it to fit the canvas height:
                            context.drawImage(images['mainBackground'], 0, canvas.height/2 - (canvas.width*images['mainBackground'].height/images['mainBackground'].width) / 2, canvas.width, canvas.width*images['mainBackground'].height/images['mainBackground'].width);
                        }

                        drawLogoImage();
                        
                        mainMenuScreen.gui.relayout();
                        mainMenuScreen.gui.draw(context);
                        break;
                    case CONNECTION_SCREEN:
                        if(logoPositionState != 'hidden') {
                            logoPositionState = 'hidden';
                        }

                        context.fillStyle = 'rgb(0, 0, 0, 255)';
                        context.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw the main menu background image to fit the screen:
                        if(images['mainBackground'].width/images['mainBackground'].height > canvas.width/canvas.height) {
                            // The image is wider than the canvas, so we need to scale it to fit the canvas width:
                            context.drawImage(images['mainBackground'], canvas.width/2 - (canvas.height*images['mainBackground'].width/images['mainBackground'].height) / 2, 0, canvas.height*images['mainBackground'].width/images['mainBackground'].height, canvas.height);
                        } else {
                            // The image is taller than the canvas, so we need to scale it to fit the canvas height:
                            context.drawImage(images['mainBackground'], 0, canvas.height/2 - (canvas.width*images['mainBackground'].height/images['mainBackground'].width) / 2, canvas.width, canvas.width*images['mainBackground'].height/images['mainBackground'].width);
                        }

                        drawLogoImage();
                        
                        connectionMenuScreen.gui.relayout();
                        connectionMenuScreen.gui.draw(context);

                        break;
                    case GAME_SCREEN:
                        if(logoPositionState != 'hidden') {
                            logoPositionState = 'hidden';
                        }

                        // context.fillStyle = 'rgb(' + (((Math.sin(Date.now()/1000*5) + 1)/2)*50+50) + ', 0, 255)';
                        // context.fillRect(0, 0, canvas.width, canvas.height);
                
                        
                        // context.fillStyle = 'white';
                        // context.beginPath();
                        // context.ellipse(mouse.x, mouse.y, 25, 25, 0, 0, 2 * Math.PI);
                        // context.fill();

                        context.fillStyle = 'rgb(200, 200, 200, 255)';
                        context.fillRect(0, 0, canvas.width, canvas.height);



                
                        
                        context.fillStyle = 'white';
                        context.beginPath();
                        context.ellipse(mouse.x, mouse.y, 10, 10, 0, 0, 2 * Math.PI);
                        context.fill();

                        for(let i = 0; i < map.length; i++) {
                            let tile = map[i];
                            context.drawImage(images[tile.type], tile.x, tile.y);
                        }

                        context.drawImage(images[currentType], mouse.x - images[currentType].width/2, mouse.y - images[currentType].height/2);

                        // Draw a horizontal and vertical line to show mouse position:
                        context.strokeStyle = 'red';
                        context.beginPath();
                        context.moveTo(mouse.x, 0);
                        context.lineTo(mouse.x, canvas.height);
                        context.stroke();
                        
                        context.beginPath();
                        context.moveTo(0, mouse.y);
                        context.lineTo(canvas.width, mouse.y);
                        context.stroke();

                        gameScreen.gui.relayout();
                        gameScreen.gui.draw(context);
                        break;
                    case SETTINGS_SCREEN:
                        if(logoPositionState != 'hidden') {
                            logoPositionState = 'hidden';
                        }

                        context.fillStyle = 'rgb(0, 0, 0, 255)';
                        context.fillRect(0, 0, canvas.width, canvas.height);

                        // Draw the main menu background image to fit the screen:
                        if(images['mainBackground'].width/images['mainBackground'].height > canvas.width/canvas.height) {
                            // The image is wider than the canvas, so we need to scale it to fit the canvas width:
                            context.drawImage(images['mainBackground'], canvas.width/2 - (canvas.height*images['mainBackground'].width/images['mainBackground'].height) / 2, 0, canvas.height*images['mainBackground'].width/images['mainBackground'].height, canvas.height);
                        } else {
                            // The image is taller than the canvas, so we need to scale it to fit the canvas height:
                            context.drawImage(images['mainBackground'], 0, canvas.height/2 - (canvas.width*images['mainBackground'].height/images['mainBackground'].width) / 2, canvas.width, canvas.width*images['mainBackground'].height/images['mainBackground'].width);
                        }

                        drawLogoImage();
                        
                        settingsScreen.gui.buttons['fullscreen'].toggled = canvasIsFullscreen;
                        settingsScreen.gui.relayout();
                        settingsScreen.gui.draw(context);

                        break;
                }



                //context.fillStyle = 'white';
                //context.font = '30px Arial';
                //context.fillText('FPS: ' + Number(fps).toFixed(2), 20, 20);

                drawLogMessages();

                window.requestAnimationFrame(gameLoop);
            }

            window.requestAnimationFrame(gameLoop);
        }
    );

    resizeCanvas();

    let lastFrameTime = 0;



    // connectButton.onclick = () => {
    //     logMessage('Connecting to PeerServer with the following ID: ' + getPeerId());
    
    //     peer = new Peer(getPeerId());

    //     peer.on('connection', (dataConnection) => {
    //         logMessage('Connection received from: ' + dataConnection.peer);

    //         dataConnection.on('data', (data) => {
    //             logMessage('Received: ' + typeof(data));
    //             // data might not be string, so we need to convert it to string
    //             logMessage('Received: ' + data.toString());
    //         });
    //     });

    //     peer.on('error', (err) => {
    //         logMessage(err);
    //     });
    // };

    // connectPeerButton.onclick = () => {
    //     let connection = peer.connect(peerId);
    //     connection.on('open', function (id) {
    //         logMessage('My peer ID is: ' + id);

    //         connection.send('Hello from ' + myPeerId);
    //     });
    // };

};
