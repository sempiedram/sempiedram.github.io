
async function game_init() {
    const playAreaRatio = 1.21; // Approximate width/height ratio of reels area
    let game = new GameDemo(playAreaRatio, 1200, 700, "./assets/");
    
    game.app.view.onselectstart = () => false;
    document.getElementById("game").appendChild(game.app.view);
    
    window.onfocus = (e) => {
        if(game.soundOn == 0) {
            Howler.volume(0);
        } else if(game.soundOn == 1) {
            Howler.volume(0.7);
        } else {
            Howler.volume(0.1);
        }
    };
    
    window.onblur = (e) => {
        Howler.volume(0);
    };
    
    let canvasSizeButtons = {
        "landscapeButton": {
            name: "Landscape Mobile", 
            width: 650,
            height: 350
        },
        "portraitButton": {
            name: "Portrait Mobile", 
            width: 279,
            height: 547
        },
        "pcButton": {
            name: "PC", 
            width: 976,
            height: 549
        },
        "pcBigButton": {
            name: "PC Big", 
            width: 1200,
            height: 700
        },
        "wideButton": {
            name: "PC Wide", 
            width: 1200,
            height: 300
        },
    };
    
    for(let canvasSizeButton in canvasSizeButtons) {
        let button = canvasSizeButtons[canvasSizeButton];
        button.element = document.getElementById(canvasSizeButton);
        
        button.element.onclick = (event) => {
          console.log("Resizing to \"" + button.name + "\": " + button.width + "x" + button.height);
          game.resizeTo(button.width, button.height);
        };
    }
    
    function doCanvasResize() {
        if(!document.fullscreenElement) {
            let windowWidth = window.innerWidth - 100;
            let windowHeight = window.innerHeight - 100;
            
            let windowRatio = windowWidth/windowHeight;
            
            let newGameArea = maxAreaDimensions(1.8, windowWidth, windowHeight);
            if(windowRatio < .8) {
                newGameArea = maxAreaDimensions(.65, windowWidth, windowHeight);
            }
            game.resizeTo(newGameArea.width, newGameArea.height);
        }
    }

    
    game.loadAll(doCanvasResize);
    window.onresize = doCanvasResize;
    
    setTimeout(doCanvasResize, 100);
};

window.onload = game_init;
