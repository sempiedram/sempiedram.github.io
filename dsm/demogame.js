

/*
    Author: Kevin Sem Piedra Matamoros
    This is not public nor open source software, I keep all rights for the
    parts that are mine.
    
    The symbols and background images are not mine, I am using them as
    placeholders. This is not a product that I am selling, this is a demo.
*/

/* Notes:
    - I'm using the Loader.shared loader, so multiple GameDemo instances
        shouldn't be created, but that's easily fixed by having a different
        Loader for each Game object.
    - I mostly assumed symbol images are squares.
    - The next set of random symbols is calculated in the client, because
        there is currently no server. This would be bad if this was a real product.
    - The win rates are not adjusted. In a real product, spin results
        would be calculated in the server.
    - In real use, the source code should probably be obfuscated.
    - There are some big methods, but I don't think it's inappropriate,
        because they are doing a specific thing (e.g. game.relayout()).
    - Resource file paths and some other data could be loaded from "config"
        files, but they are currently specified in code. Making this change
        would add unnecessary complexity.
    - I am new to web development: PIXI, HTML5, Javascript. So things might
        be implemented in unconventional ways. I am used to Python, and C.
    - There are some long comment and code lines.
    - I am not sure if I am using the documentation comments correctly, mainly while
        specifying the types of things.
*/


/**
 * Returns a list of integers from 0 up to n - 1.
 * This can be REALLY slow if used with a big number, but I am using it
 * with tiny numbers (< 100).
 * 
 * Based on information found on stackoverflow:
 * https://stackoverflow.com/questions/3895478/does-javascript-have-a-method-like-range-to-generate-a-range-within-the-supp
 * 
 * @param {number} n Upper limit (excluding it).
 * @returns {number[]} List of numbers from 0 up to n-1
 */
function countUpTo(n) {
    // NOTE: Slow.
    return Array.from(Array(n).keys());
}



/**
 * Extracts a PIXI.Animation from the given animationTexture.
 * This is an UGLY method, because I didn't want to create actual .json files for each animation.
 * Maybe there is a better way to tell PIXI to load an animation from a single image file.
 * 
 * @param {PIXI.Texture} animationTexture Texture from which to get the frames for the animation
 * @param {string} name The name of the animation
 * @param {number} frameCount Number of frames
 * @param {number} width Width of each frame
 * @param {number} height Height of each frame
 * @param {number} xOffset Starting offset withing the animationTexture to start getting frames
 * @param {number} yOffset Starting offset withing the animationTexture
 * @param {number} xStride X stride to advance after each frame to get to the next frame
 * @param {number} yStride Y stride to advance after each row of frames to get to the next row of frames
 * @param {number} columns Number of columns in every row of frames
 * @param {number} speed Speed at which the animation should play
 * @returns The new (Promise that resolves to a) PIXI.Animation object
 */
async function animationFromLoadedTexture(animationTexture, name, frameCount, width, height, xOffset, yOffset, xStride, yStride, columns, speed) {
    // Create the animation JSON that we will pass to PIXI.Spritesheet
    let animationJson = {
        frames: {
            /*"f0.png": {
                "frame": {"x": 0, "y": 0, "w": 180, "h": 180},
                "rotated": false,
                "trimmed": false,
                "spriteSourceSize": {"x": 0, "y": 0, "w": 180, "h": 180},
                "sourceSize": {"w": 180, "h": 180}
            }*/
        },
        animations: {
            /*"f": ["f0.png", "f1.png", "f2.png", "f3.png", "f4.png" ...]*/
        },
        meta: {
            image: "nothing.png",
            size: {w: (xOffset + (frameCount % columns) * xStride), h: (yOffset + Math.floor(frameCount / columns) * yStride)},
            scale: 1
        }
    };

    // Loop for specifying each frame.
    for(let i = 0; i < frameCount; i++) {
        let x = xOffset + xStride * (i % columns);
        let y = yOffset + yStride * Math.floor(i / columns);

        let newFrame = {
            frame: {"x": x, "y": y, "w": width, "h": height},
            rotated: false,
            trimmed: false,
            spriteSourceSize: {"x": x, "y": y, "w": width, "h": height},
            sourceSize: {"w": width, "h": height}
        };

        animationJson["frames"][name + i + ".png"] = newFrame;
    }

    animationJson["animations"][name] = countUpTo(frameCount).map(i => (name + i + ".png"));

    return new Promise(resolve => {
        const sheet = new PIXI.Spritesheet(animationTexture, animationJson);
        sheet.parse((s, textures) => {
            let frames = countUpTo(frameCount).map(i => PIXI.Texture.from(name + i + ".png"));
            resolve(frames);
        });
    });
}



/**
 * Linear interpolation between a and b
 * @param {number} a Starting value
 * @param {number} b End value
 * @param {number} k Interpolation progress (0 maps to a, 1 maps to b)
 * @returns 
 */
function linearInterpolation(a, b, k) {
    return a + (b - a) * k;
}


/**
 * Linearly interpolates from point a to point b.
 * @param {Point} a Start point
 * @param {Point} b End point
 * @param {number} k interpolation progress (0 maps to a, 1 maps to b)
 */
function pointLinearInterpolation(a, b, k) {
    return {
        x: linearInterpolation(a.x, b.x, k),
        y: linearInterpolation(a.y, b.y, k)
    };
}



/**
 * Computes a cubic bezier curve from (0, 0) -> (ax, ay) -> (bx, by) -> (1, 1)
 * @param {*} ax First control point, x component
 * @param {*} ay First control point, y component
 * @param {*} bx Second control point, x component
 * @param {*} by Second control point, y component
 * @param {*} k Progress along the bezier curve
 * @returns The point that corresponds to k in the curve
 */
function cubicBezier(ax, ay, bx, by, k) {
    let a = {
        x: ax,
        y: ay
    };
    let b = {
        x: bx,
        y: by
    };
    
    // First pass: 0,0 -> a -> b -> 1,1
    let c = pointLinearInterpolation({x: 0, y: 0}, a, k);
    let d = pointLinearInterpolation(a, b, k);
    let e = pointLinearInterpolation(b, {x: 1, y: 1}, k);
    
    // Second pass: c -> d -> e
    let f = pointLinearInterpolation(c, d, k);
    let g = pointLinearInterpolation(d, e, k);
    
    // Third pass: f -> g
    let h = pointLinearInterpolation(f, g, k);
    
    return h.y;
}



/**
 * @param {number} k Current progress, from 0 to 1
 * @returns Scalar that corresponds to the animation state
 */
function bounceAnimation(k) {
    // I took these values from https://easings.net/
    return cubicBezier(0.68, -0.6, 0.32, 1.6, k);
}



/**
* Returns the dimensions of the biggest area with the given aspect ratio (width/height)
* that can fit inside the given "outer" size. The inner area will be limited either by
* its height, or by its width. If the inner area is wider than the outer area is wide,
* then the inner area will be limited by it's width.
* 
* @param {float} areaRatio The ratio of the area whose size is being maximized.
* @param {int} outerWidth Width of the outer area.
* @param {int} outerHeight Height of the outer area.
*/
function maxAreaDimensions(innerAreaRatio, outerWidth, outerHeight) {
    let outerAreaRatio = outerWidth/outerHeight;
    let result = {};
    if(outerAreaRatio > innerAreaRatio) {
        // The limit is the outer area's height.
        result.height = outerHeight;
        result.width = innerAreaRatio * result.height;
    }else {
        // The limit is the outer area's width.
        result.width = outerWidth;
        result.height = (1/innerAreaRatio) * result.width;
    }

    return result;
}



/**
 * Computes the offset from the start of the reference area needed
 * to center the other area in the reference area. The area to be
 * positioned doesn't need to be smaller than the reference area.
 * 
 * @param {number} areaToPositionSize 
 * @param {number} referenceAreaStart 
 * @param {number} referenceAreaSize 
 */
function centeredOn(areaToPositionSize, referenceAreaStart, referenceAreaSize) {
    return referenceAreaStart + (referenceAreaSize - areaToPositionSize)/2;
}



/**
 * Scales the given PIXI.js element to the given height.
 * 
 * @param {number} sprite Sprite to scale.
 * @param {number} newHeight New height.
 * @param {number} referenceHeight Optional reference height, if not provided, sprite.height will be used
 *      (which fails for some PIXI.js elements that have already been scaled).
 * 
 */
function scaleToSpecificHeight(sprite, newHeight, referenceHeight) {
    let currentWidth = sprite.width;
    let currentHeight = sprite.height;
    let ratio = newHeight/currentHeight;
    sprite.width = ratio * currentWidth;
    sprite.height = ratio * currentHeight;
}



/**
 * Scales the given PIXI.js element to the given height.
 * 
 * @param {number} sprite Sprite to scale.
 * @param {number} newHeight New height.
 * @param {number} referenceHeight Optional reference height, if not provided, sprite.height will be used
 *      (which fails for some PIXI.js elements that have already been scaled).
 * 
 */
function scaleToSpecificWidth(sprite, newWidth) {
    let currentWidth = sprite.width;
    let currentHeight = sprite.height;
    let ratio = newWidth/currentWidth;
    sprite.width = ratio * currentWidth;
    sprite.height = ratio * currentHeight;
}



/**
 * Starting from the first reel, the next reel has to have the same symbol either on the same row, the row
 * above, or the row below, all the way to the last reel.
 * 
 * @param {*} reels 
 * @param {*} rows 
 * @returns Array with arrays of size <reels> where index n indicates the 
 *  row needed for that reel for that line to be complete
 */
function generateWinLines(reels, rows) {
    let maximumNumberOfWinLines = 1000000;
    
    let lines = [];
    
    for(let row = 0; row < rows; row++) {
        lines.push([row]);
    }
    
    // Possible lines are expanded <reels - 1> times.
    for(let expansionIndex = 0; expansionIndex < reels - 1; expansionIndex++) {
        let expandedLines = [];
        for(let line of lines) {
            
            for(let offset = -1; offset < 2; offset++) {
                let nextStep = line[line.length - 1] + offset;
                if(nextStep >= 0 && nextStep < rows) {
                    if(expandedLines.length < maximumNumberOfWinLines) {
                        expandedLines.push(line.concat(nextStep));
                    }
                }
            }
            
        }
        lines = expandedLines;
    }
    
    console.log("Number of lines to win: " + lines.length);
    return lines;
}



/**
 * GameDemo contains logic, loading of assets, layout of elements, interface logic, etc, for the game.
 */
class GameDemo {
    /**
     * Creates the game object. After creation of the game object, call loadAll() to load resources,
     * then call relayout() to update the layout.
     * 
     * @param {number} playAreaRatio width/height ratio of the area where the reels are placed
     * @param {number} initialWidth Width passed to PIXI.Application constructor
     * @param {number} initialHeight Width passed to PIXI.Application constructor
     * @param {string} assetsFolder Root folder where to look for assets
     */
    constructor(playAreaRatio, initialWidth, initialHeight, assetsFolder) {
        this.assetsFolder = assetsFolder;
        this.playAreaRatio = playAreaRatio;
        this.app = new PIXI.Application({
            width: initialWidth,
            height: initialHeight,
            backgroundColor: 0xa9d5e4
        });

        let playAreaDimensions = maxAreaDimensions(playAreaRatio, initialWidth, initialHeight);
        this.playArea = new PIXI.Rectangle(0, 0, playAreaDimensions.width, playAreaDimensions.height);
        
        /**
         * Reels area defined in units of playArea (i.e. this.reelsArea.width = 1 is equivalent to playArea.width, if )
         */
        this.reelsAreaProportions = new PIXI.Rectangle(0.1, 0.20, 0.77, 0.65);
        
        this.reelConfigurations = [
            {
                buttonTextureId: "reels2x3",
                reels: 2,
                rows: 3
            },
            {
                buttonTextureId: "reels3x2",
                reels: 3,
                rows: 2
            },
            {
                buttonTextureId: "reels3x3",
                reels: 3,
                rows: 3
            },
            {
                buttonTextureId: "reels3x4",
                reels: 3,
                rows: 4
            },
            {
                buttonTextureId: "reels4x3",
                reels: 4,
                rows: 3
            },
            {
                buttonTextureId: "reels5x3",
                reels: 5,
                rows: 3
            },
            {
                buttonTextureId: "reels4x4",
                reels: 4,
                rows: 4
            },
            {
                buttonTextureId: "reels6x5",
                reels: 6,
                rows: 5
            },
        ];
        
        this.currentReelConfiguration = 4; // TODO: Do this differently, too hacky.
        
        // Initial reel count, and row count
        this.reelCount = 4;
        this.rowCount = 3;
        
        this.reelsContainer = new PIXI.Container();
        this.reels = [];
        this.animatedSymbols = [];
        this.paddingSymbols = 3; // Extra symbols that may be shown above and below real symbols in the spinning animation
        
        
        this.soundOn = true;
        this.balance = 10000; // TODO: IMPORTANT: Use a different type to store balance. For example: https://github.com/MikeMcl/decimal.js/, or ints with a big multiplier 1000000 = 1.0
        
        this.betIndexSelected = 5;
        this.betOptions = [1, 2, 5, 10, 20, 50, 60, 100];
        
        this.playingAnimation = false; // Whether the spinning animation is currently playing
        this.fastSpinning = false;
        this.spinningStart = 0;
        this.spinningDuration = 4200; // In milliseconds
        
        /**
         * "Win lines" are lists of length <reelCount> where line[i] is
         *  the row in the reel i needed to complete that line.
         */
        this.allWinLines = [];
        
        this.allWinLines = generateWinLines(this.reelCount, this.rowCount);
        this.lineWinsToAnimate = [];
        
        /**
         * this.symbols.name: used to store the state of the reels
         * this.symbols.value: full line of a symbol pays value * bet
         * this.symbols.weight: determines the probability to get that symbol
         */
        this.symbols = [
            {
                name: "astronaut",
                value: 1,
                weight: 1
            },
            {
                name: "bear",
                value: 1,
                weight: 1
            },
            {
                name: "doll",
                value: .5,
                weight: 1
            },
            {
                name: "girl",
                value: 2,
                weight: 1
            },
            {
                name: "guy",
                value: 2,
                weight: 1
            },
            {
                name: "moonDog",
                value: 10,
                weight: 1
            },
            {
                name: "moonFlag",
                value: 3,
                weight: 1
            },
            {
                name: "rocket",
                value: 3,
                weight: 1
            },
            {
                name: "stbasilcathedral",
                value: 3,
                weight: 1
            },
            {
                name: "vodka",
                value: 3,
                weight: 1
            },
        ];
        
        this.symbolsByName = {};
        
        this.symbolsTotalWeight = 0;
        for(let symbol of this.symbols) {
            this.symbolsTotalWeight += symbol.weight;
            
            this.symbolsByName[symbol.name] = symbol;
        }
        
        this.debug = false;
    }
    
    /**
     * Loads all images, sounds, and creates the interface elements, then it calls the given callback.
     * TODO: Maybe assets should be configured elsewhere, in some sort of config file.
     * 
     * @param {*} onloadCallback Called when loading and layout is finished.
     */
    loadAll(onloadCallback) {
    
        // Load all images using PIXI.Loader.shared.add:
        for(let symbol of this.symbols) {
            PIXI.Loader.shared.add(symbol.name, this.assetsFolder + "./images/symbols/" + symbol.name + ".png");
            PIXI.Loader.shared.add(symbol.name + "_anim", this.assetsFolder + "./images/symbols/" + symbol.name + "_anim.png");
            PIXI.Loader.shared.add(symbol.name + "_blur", this.assetsFolder + "./images/symbols/" + symbol.name + "_blur.png");
        }

        let imagesToLoad = {
            // Background Images:
            "banderines": "./images/background/banderines.png",
            "background": "./images/background/background.png",
            "foreground": "./images/background/foreground.png",
            
            // UI/Button Images:
            "autoPlayButton":   "./images/ui/autospin.png",
            "betButton":        "./images/ui/bet.png",
            "closeButton":      "./images/ui/close.png",
            "fastSpinButton":   "./images/ui/fastSpin.png",
            "fullscreenButton": "./images/ui/fullscreen.png",
            "settingsButton":   "./images/ui/settings.png",
            "soundOffButton":   "./images/ui/soundOff.png",
            "soundOnButton":    "./images/ui/soundOn.png",
            "spinButton":       "./images/ui/spin.png",
            "stopButton":       "./images/ui/stop.png",
        };
        
        for(let reelConfiguration of this.reelConfigurations) {
            PIXI.Loader.shared.add(reelConfiguration.buttonTextureId, this.assetsFolder + `./images/ui/${reelConfiguration.buttonTextureId}.png`);
        }
        
        PIXI.Loader.shared.onError.add((e) => {
            // TODO: Maybe do something else on load error. Currently, I care.
            console.log(e);
        });

        // Load all images in imagesToLoad:
        for(let resourceName in imagesToLoad) {
            PIXI.Loader.shared.add(resourceName, this.assetsFolder + imagesToLoad[resourceName]);
        }
    
        PIXI.Loader.shared.load((loader, resources) => this.loadSounds(loader, resources, onloadCallback));
    }
    
    /**
     * This is called by loadAll(), so there is no need to call it manually.
     * 
     * Loads all required audio files.
     */
    loadSounds(pixiLoader, pixiResources, onloadCallback) {
        this.sounds = {};
        
        this.sounds.spinning = new Howl({
            src: this.assetsFolder + "./sounds/spinning2.mp3"
        });
        this.sounds.buttonClick = new Howl({
            src: this.assetsFolder + "./sounds/buttonClick.mp3"
        });
        this.sounds.smallWin = new Howl({
            src: this.assetsFolder + "./sounds/win.wav"
        });
        this.sounds.reelClick = new Howl({
            src: this.assetsFolder + "./sounds/click.wav"
        });
        this.sounds.backgroundMusic = new Howl({
            src: this.assetsFolder + "./sounds/march of the preobrazhensky regiment.ogg",
            autoplay: true,
            loop: true,
            volume: 0.4
        });
        
        Howler.volume(0.6);
        
        this.createElements(pixiLoader, pixiResources, onloadCallback);
    }
    
    /**
     * This is called by loadAll (at the end of loadSounds), so there is no need to call it manually.
     * 
     * Creates Sprites after all resources have been loaded, adds them to the stage.
     */
    async createElements(pixiLoader, resources, onloadCallback) {
        this.symbolTextures = {};
        this.symbolTexturesBlur = {};
        this.symbolAnimations = {};
        
        this.reelsButtonTextures = {};
        
        for(let symbol of this.symbols) {
            this.symbolTextures[symbol.name] = resources[symbol.name].texture;
            this.symbolTexturesBlur[symbol.name] = resources[symbol.name + "_blur"].texture;
            this.symbolAnimations[symbol.name] = await animationFromLoadedTexture(resources[symbol.name + "_anim"].texture, symbol.name, 20, 180, 180, 0, 0, 180, 180, 20, .3);
        }
        
        for(let reelConfiguration of this.reelConfigurations) {
            let id = reelConfiguration.buttonTextureId;
            
            this.reelsButtonTextures[id] = resources[id].texture;
        }
    
        this.backgroundSprite = PIXI.Sprite.from("background");
        this.banderinesSprite = PIXI.Sprite.from("banderines");
        this.foregroundSprite = PIXI.Sprite.from("foreground");
    
        this.backgroundContainer = new PIXI.Container();
        this.backgroundContainer.addChild(this.backgroundSprite);
        this.backgroundContainer.addChild(this.banderinesSprite);
        this.backgroundContainer.addChild(this.foregroundSprite);

        this.app.stage.addChild(this.backgroundContainer);

        
        this.spinButton = PIXI.Sprite.from("spinButton");
        this.betButton = PIXI.Sprite.from("betButton");
        this.fastSpinButton = PIXI.Sprite.from("fastSpinButton");
        this.fullscreenButton = PIXI.Sprite.from("fullscreenButton");
        this.reelsButton = PIXI.Sprite.from(this.reelConfigurations[this.currentReelConfiguration].buttonTextureId);
        
        this.toggleSoundButton = PIXI.Sprite.from("soundOnButton");
        this.settingsButton = PIXI.Sprite.from("settingsButton");
        this.autoPlayButton = PIXI.Sprite.from("autoPlayButton");
        
        
        this.allButtons = [
            this.spinButton, 
            this.betButton,
            this.fastSpinButton,
            this.fullscreenButton,
            this.reelsButton,
            
            this.toggleSoundButton,
            this.settingsButton,
            this.autoPlayButton,
        ];
        
        this.app.stage.addChild(this.reelsContainer);
        
        // Add all buttons to the stage:
        for(let button of this.allButtons) {
            this.app.stage.addChild(button);
        
            button.interactive = true;
            button.buttonMode = true;
        }
        
        this.toggleSoundButton.on("pointerdown", e => this.toggleSound());
        
        this.spinButton.on("pointerdown", e => this.doSpin());
        this.fullscreenButton.on("pointerdown", e => this.toggleFullscreen());
        this.betButton.on("pointerdown", e => this.changeBet());
        this.fastSpinButton.on("pointerdown", e => this.toggleFastSpin());
        this.reelsButton.on("pointerdown", e => this.nextReelLayout());
        
        
        this.graphicsOverlay = new PIXI.Graphics();
        this.app.stage.addChild(this.graphicsOverlay);
        
        this.textStyle = new PIXI.TextStyle({
            fontFamily: "Arial",
            fontSize: 40 / window.devicePixelRatio,
            //fontWeight: "bold",
            fill: "#FFFFFF",
            stroke: "#000000",
            strokeThickness: 3
        });
        
        this.balanceLabel = new PIXI.Text("Balance: " + this.balance, this.textStyle);
        this.updateBalance();
        this.balanceLabel.anchor.set(1, 0);
        this.app.stage.addChild(this.balanceLabel);
        
        this.betLabel = new PIXI.Text("Bet: " + this.betAmount(), this.textStyle);
        this.app.stage.addChild(this.betLabel);
        
        
        this.winAmountText = new PIXI.Text("WON", {
            fontFamily: "Arial",
            fontSize: 60,
            fill: "#FFFFFF",
            dropShadow: true,
            dropShadowColor: "#000000",
            dropShadowBlur: 5,
            stroke: "#000000",
            strokeThickness: 4
        });
        
        this.app.stage.addChild(this.winAmountText);
        this.winAmountText.visible = false;
        
        
        this.growReels();
        
        onloadCallback();
    }
    
    /**
     * TODO: This whole method is really ugly. Don't look at it.
     */
    nextReelLayout() {
        if(this.playingAnimation) return;
        
        this.currentReelConfiguration++;
        this.currentReelConfiguration %= this.reelConfigurations.length;
        
        let newReelConfiguration = this.reelConfigurations[this.currentReelConfiguration];
        
        this.useReelLayout(newReelConfiguration);
    }
    
    useReelLayout(layout) {
        this.reelsButton.texture = this.reelsButtonTextures[layout.buttonTextureId];
        
        this.reelCount = layout.reels;
        this.rowCount = layout.rows;
        
        // Add more reels if needed and relayout:
        this.growReels();
    }
    
    growReels() {
        while(this.reels.length < this.reelCount) {
            let newReel = {
                container: new PIXI.Container(),
                index: this.reels.length,
                sprites: [],
                currentSymbols: [],
                allSymbols: []
            };
            this.reels[this.reels.length] = newReel;
            
            this.reelsContainer.addChild(newReel.container);
        }
    
        // Add extra sprites to each reel if needed:
        for(let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
            let reel = this.reels[reelIndex];
            
            // Add enough sprites to the reel container:
            while(reel.sprites.length < (this.rowCount + this.paddingSymbols * 2)) {
                let newSprite = new PIXI.Sprite();
                newSprite.x = 0;
                reel.sprites.push(newSprite);
                reel.container.addChild(newSprite);
            }
            
            // Fill with random symbols if there are not enough symbols assigned yet for this reel:
            while(reel.allSymbols.length < this.rowCount + this.paddingSymbols * 2) {
                reel.allSymbols.push(this.randomSymbol());
            }
        }
        
        // Add more animated symbols if needed:
        while(this.animatedSymbols.length < this.reelCount) {
            let animatedSymbol = new PIXI.AnimatedSprite(this.symbolAnimations[this.symbols[0].name]);
            animatedSymbol.animationSpeed = 0.3; // TODO: Make this configurable somewhere else.
            animatedSymbol.visible = false;
            
            this.animatedSymbols.push(animatedSymbol);
            
            this.reelsContainer.addChild(animatedSymbol);
        }
        this.allWinLines = generateWinLines(this.reelCount, this.rowCount);
        
        // Call relayout to reposition the reels with respect to the play area:
        this.relayout()
    }
    
    /**
     * Toggles between fullscreen and normal mode.
     */
    toggleFullscreen() {
        this.sounds.buttonClick.play();
        if(!document.fullscreenElement) {
            console.log(`${window.screen.width}, ${window.screen.height}`);
            this.app.view.requestFullscreen();
            
            let screenRatio = window.screen.width/window.screen.height;
            
            if(screenRatio < 1) {
                this.resizeTo(window.screen.width * window.devicePixelRatio, window.screen.height * window.devicePixelRatio);
            }else {
                this.resizeTo(window.innerWidth * window.devicePixelRatio, window.innerHeight * window.devicePixelRatio);
            }
            
        }else {
            document.exitFullscreen();
        }
    }
    
    /**
     * Animation function to use for the reels.
     * @param {number} k Animation progress from 0 to 1
     */
    reelAnimationFunction(k) {
        return bounceAnimation(k);
    }
    
    /**
     * PIXI Ticker function to do the spinning animation.
     * @param {number} delta Time difference between now and the last time this ticker was called
     */
    spinningTicker(delta) {
        if(this.playingAnimation) {
            let elapsedSpinningTime = Date.now() - this.spinningStart;
            let spinningPercentage = elapsedSpinningTime/this.spinningDuration;
            
            if(spinningPercentage > 1) {
                spinningPercentage = 1;
            }
            
            let k = this.reelAnimationFunction(spinningPercentage);
            
            for(let reel of this.reels) {
                let oldTopSymbolIndex = reel.allSymbols.length - this.paddingSymbols - this.rowCount;
                let newTopSymbolIndex = this.paddingSymbols;
                let reelOffset = oldTopSymbolIndex + (newTopSymbolIndex - oldTopSymbolIndex) * k;
                
                let remainder = reelOffset;
                while(remainder < 0) {
                    remainder++;
                }
                remainder = remainder % 1;
                
                // There can be problems when indexing with reelOffset because remainder might not have been perfectly subtracted.
                // reelOffset should be an integer, but might not be, because of imperfect floating point operations
                reelOffset -= remainder;
                //reelOffset = Math.floor(reelOffset);
                
                // TODO: IMPORTANT: Make sure this works properly and makes sense:
                reel.container.y = -(remainder + this.paddingSymbols) * reel.container.width;
                
                
                for(let reelSpriteIndex = 0; reelSpriteIndex < reel.sprites.length; reelSpriteIndex++) {
                    let correspondingSymbolIndex = reelOffset - this.paddingSymbols + reelSpriteIndex;
                    
                    reel.sprites[reelSpriteIndex].texture = this.symbolTextures[reel.allSymbols[correspondingSymbolIndex]];
                }
                
            }
            
            
            if(spinningPercentage >= 1) {
                // The spinning animation is done.
                // this.spinning = false;
                this.sounds.spinning.stop();
                
                // TODO: Maybe replace reel.container.width with something more reliable?
                // Set the reels to their correct position, because the animation may have left them
                // slightly misplaced
                for(let reel of this.reels) {
                    reel.container.y = -reel.container.width * this.paddingSymbols;
                }
                
                // Check for full lines:
                this.lineWinsToAnimate = [];
                for(let line of this.allWinLines) {
                    let allEqual = true;
                    let firstSymbol = this.reels[0].currentSymbols[line[0]];
                    for(let reel = 1; reel < this.reelCount; reel++) {
                        if(firstSymbol != this.reels[reel].currentSymbols[line[reel]]) {
                            allEqual = false;
                            break;
                        }
                    }
                    
                    if(allEqual) {
                        this.lineWinsToAnimate.push(line.concat());
                    }
                }
                
                this.app.ticker.remove(this.spinningTicker, this);
                
                if(this.lineWinsToAnimate.length == 0) {
                    this.playingAnimation = false;
                }else {
                    this.app.ticker.add(this.winAnimations, this);
                }
            }
        }
    }
    
    /**
     * At the moment this only looks at the first symbol, and multiplies the symbol's value by this.betAmount(),
     * which means that if the bet amount is after betting, and before this calculation, this would give an 
     * incorrect result, but this could easily be fixed, it's just that I don't care to, because it's not even a
     * good way to calculate how much should be awarded to the player.
     * 
     * @param {int[]} line List with <reelCount> entries, where each entry line[i] specifies which row of reel i is being checked.
     * @returns The reward for this line.
     */
    computeWinAmount(line) {
        let symbolName = this.reels[0].currentSymbols[line[0]];
        return this.betAmount() * this.symbolsByName[symbolName].value;
    }
    
    /**
     * Ticker for the win animation: displays a big text with the win amount, and highlights the relevant
     * symbols with their animations.
     * 
     * @param {number} delta Time between this current tick and the previous.
     * @returns Nothing.
     */
    winAnimations(delta) {
        if(this.lineWinsToAnimate == undefined || this.lineWinsToAnimate.length == 0) {
            this.playingAnimation = false;
            this.app.ticker.remove(this.winAnimations, this);
            return;
        }
            
        let firstLine = this.lineWinsToAnimate[0];
        if(firstLine.start == undefined) {
            firstLine.start = Date.now();
            this.sounds.smallWin.play();
            
            firstLine.activeSpriteFilter = new PIXI.filters.AlphaFilter(1);
            firstLine.inactiveSpriteFilter = new PIXI.filters.AlphaFilter(0.2);
            
            for(let reelIndex = 0; reelIndex < this.reelCount; reelIndex++) {
                let reel = this.reels[reelIndex];
                let activeRowInReel = firstLine[reelIndex];
                
                for(let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
                    let sprite = reel.sprites[this.paddingSymbols + rowIndex];
                    
                    if(rowIndex == activeRowInReel) {
                        sprite.filters = [firstLine.activeSpriteFilter];
                    }else {
                        sprite.filters = [firstLine.inactiveSpriteFilter];
                    }
                }
            }
            
            let winAmount = this.computeWinAmount(firstLine);
            this.winAmountText.text = "WON $" + winAmount.toFixed(2);
            this.winAmountText.x = this.playArea.x + (this.playArea.width - this.winAmountText.width)/2;
            this.winAmountText.y = this.playArea.y + (this.playArea.height - this.winAmountText.height)/2;
            this.winAmountText.visible = false;
            
            // TODO: Do this some other way, or don't, whatever:
            setTimeout(() => {
                this.winAmountText.visible = true;
                setTimeout(() => {
                    this.winAmountText.visible = false;
                    this.balance += winAmount;
                    this.updateBalance();
                }, 500);
            }, 500);
            
        }else {
            let timeElapsed = Date.now() - firstLine.start;
            
            if(timeElapsed > 1000) {
                for(let reelIndex = 0; reelIndex < this.reelCount; reelIndex++) {
                    let reel = this.reels[reelIndex];
                    
                    for(let rowIndex = 0; rowIndex < this.rowCount; rowIndex++) {
                        let sprite = reel.sprites[this.paddingSymbols + rowIndex];
                        sprite.filters = [];
                    }
                }
                
                // Remove this win line from the queue of win lines to animate:
                this.lineWinsToAnimate.shift();
            }else {
                // Animation of one win line:
                // This just makes the winning line blink:
                firstLine.activeSpriteFilter.alpha = ((Math.cos(timeElapsed*Math.PI*4/1000) + 1)/2)/2 + 0.5;
            }
        }
    }
    
    /**
     * Returns the currently selected bet amount.
     * 
     * @returns Current bet amount.
     */
    betAmount() {
        return this.betOptions[this.betIndexSelected % this.betOptions.length];
    }
    
    /**
     * Returns a random symbol id (e.g., "A", "B", "C", etc).
     * 
     * @returns Random symbol id
     */
    randomSymbol() {
        // Calculate the cummulative symbol weight table only once:
        if(this.cummulativeSymbolWeightTable == undefined) {
            this.cummulativeSymbolWeightTable = [];
            let runningTotal = 0;
            
            for(let symbol of this.symbols) {
                this.cummulativeSymbolWeightTable.push(runningTotal);
                runningTotal += symbol.weight;
            }
        }
        
        
        let r = this.symbolsTotalWeight * Math.random();
        // Walk through the cummulative table until we find the range that contains r:
        for(let symbolIndex = 0; symbolIndex < this.cummulativeSymbolWeightTable.length - 1; symbolIndex++) {
            let low = this.cummulativeSymbolWeightTable[symbolIndex];
            let high = this.cummulativeSymbolWeightTable[symbolIndex + 1];
            if(low < r && r < high) {
                return this.symbols[symbolIndex].name;
            }
        }
        
        // This shouldn't be needed (?):
        return this.symbols[this.symbols.length - 1].name;
    }
    
    /**
     * Cycles through all the bet values in this.betOptions
     */
    changeBet() {
        if(!this.playingAnimation) {
            this.sounds.buttonClick.play();
            this.betIndexSelected += 1;
            this.betIndexSelected %= this.betOptions.length;
            
            this.betLabel.text = "Bet: " + this.betAmount();
        }
    }
    
    /**
     * Makes a new bet, and starts the spinning animation.
     */
    doSpin() {
        let toBet = this.betAmount();
        if(!this.playingAnimation && this.balance >= toBet) {
            this.playingAnimation = true;
            this.sounds.spinning.play();
            this.balance -= toBet;
        
            this.updateBalance();
            
            // This loop sets up the reels to have the new values at the top and the current (old) values at the bottom in reel.allSymbols    
            for(let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
                let reel = this.reels[reelIndex];
                let newValues = [];
                
                // This would be server side:
                for(let row = 0; row < this.rowCount; row++) {
                    newValues[row] = this.randomSymbol();
                }
                reel.currentSymbols = newValues;
                
                // Triggers when there have been no spins (on page load):
                if(reel.allSymbols == undefined || reel.allSymbols.length == 0) {
                    // Fill the screen with random symbols, in case it hasn't been done already inside relayout().
                    reel.allSymbols = countUpTo(30).map(n => this.randomSymbol());
                }
                
                /*  The reel is filled with:
                    
                    0   S  <-- New padding that may be visible on this spin, but will also be seen in the next spin
                    1   S  <-'
                    2   New<- New values that will be shown
                    3   New
                    4   New
                    5   New
                    6   S
                    7   S
                    8   S
                        ... A lot of padding for the spin to happen
                    n-8 S   <-- Old padding from previous spin
                    n-7 S   <-'
                    n-6 Old value
                    n-5 Old value
                    n-4 Old value
                    n-3 Old value
                    n-2 S   <-- Old padding from previous spin
                    n-1 S   <-'
                    
                */
                
                let oldValues = reel.allSymbols.slice(0, this.paddingSymbols * 2 + this.rowCount);
               
                // Construct the new symbol list for the reel by concatenating the "parts": padding, new values, padding, big padding, old values:
                reel.allSymbols = [].concat(
                                    countUpTo(this.paddingSymbols).map(n => this.randomSymbol()), // padding above the new values
                                    newValues,
                                    countUpTo(this.paddingSymbols).map(n => this.randomSymbol()), // padding below the new values
                                    countUpTo(Math.floor(5 + Math.random() * 15)).map(n => this.randomSymbol()), // padding between the old values
                                    oldValues
                                );
            }
            
            this.spinningStart = Date.now();
            this.app.ticker.add(this.spinningTicker, this);
        }
    }
    
    /**
     * Refresh the balance text.
     */
    updateBalance() {
        this.balanceLabel.text = "Balance: " + this.balance + " USD";
    }
    
    /**
     * Toggles all sounds.
     */
    toggleSound() {
        this.sounds.buttonClick.play();
        
        this.soundOn = !this.soundOn;
        
        if(this.soundOn) {
            Howler.volume(0.7);
            this.toggleSoundButton.texture = PIXI.Loader.shared.resources["soundOnButton"].texture;
        }else {
            Howler.volume(0);
            this.toggleSoundButton.texture = PIXI.Loader.shared.resources["soundOffButton"].texture;
        }
    }
    
    /**
     * Changes the spin animation speed.
     */
    toggleFastSpin() {
        if(!this.playingAnimation) {
            this.fastSpinning = !this.fastSpinning;
            if(this.fastSpinning) {
                this.spinningDuration /= 3;
                this.fastSpinButton.tint = 0xFF0000;
            }else {
                this.spinningDuration *= 3;
                this.fastSpinButton.tint = 0xFFFFFF;
            }
        }
    }

    /**
     * Recomputes all the layout in the game, can be called multiple times.
     * 
     * Uses this.app.view.width and .height as reference.
     */
    relayout() {
        let canvasWidth = this.app.view.width;
        let canvasHeight = this.app.view.height;
        
        console.log(`Relayout: ${canvasWidth}x${canvasHeight}`);
        
        // TODO: Replace this quick fix to fit the win text with canvas size:
        this.winAmountText.style.fontSize = (canvasWidth * .7) / 7;
        
        // Resize and position playArea:
        let playAreaDimensions = maxAreaDimensions(this.playAreaRatio, canvasWidth, canvasHeight);
        this.playArea.width = playAreaDimensions.width;
        this.playArea.height = playAreaDimensions.height;
        
        // Space to the left and right of the playArea (in the canvas)
        let leftRightSpace = (canvasWidth - this.playArea.width)/2;
        // Space above and below the playArea (in the canvas)
        let upDownSpace = (canvasHeight - this.playArea.height)/2;
        
        // Center playArea in the canvas:
        this.playArea.x = leftRightSpace;
        this.playArea.y = upDownSpace;
        
        
        let canvasRatio = canvasWidth / canvasHeight;
            
        // Units by which many things are sized and positioned:
        let units = this.playArea.height / 100;
        
        
            
        // Limits how far buttons can be from the play area
        let maxButtonsAreaWidth = this.playArea.width * 1.6;
        
        let reelsAreaWidth = this.playArea.width * this.reelsAreaProportions.width;
        let reelsAreaHeight = this.playArea.height * this.reelsAreaProportions.height;
            
        let gapBetweenReels = units * 1; // TODO: Maybe do this differently
            
            
        /*  Maximum distance between play area and buttons' reference limits.
            Buttons to the right of the play area will be positioned with
            respect to the canvas' width (the canvas' right side's x), but
            not if the distance from the playArea's right side to the canvas'
            right side is greater than the maximumDistanceFromPlayArea,
            instead the buttons will be placed relative to
            playArea + maximumDistanceFromPlayArea.
        */
        let maximumDistanceFromPlayArea = (maxButtonsAreaWidth - this.playArea.width)/2;
        
        let playAreaRightSide = this.playArea.x + this.playArea.width;
        
        let rightLimit = canvasWidth;
        let leftLimit = 0;
        if(rightLimit > playAreaRightSide + maximumDistanceFromPlayArea) {
            rightLimit = playAreaRightSide + maximumDistanceFromPlayArea;
            leftLimit = this.playArea.x - maximumDistanceFromPlayArea;
        }
        
        if(canvasRatio > 1) {
            // Landscape case
        
            // Scaling of UI components:
            scaleToSpecificHeight(this.spinButton, units * 25, this.spinButton.texture.height);
        
            for(let button of this.allButtons) {
                if(button !== this.spinButton) {
                    scaleToSpecificHeight(button, units * 11, button.texture.width);
                }
            }
            
            // Buttons layout:
            this.spinButton.position.set(
                rightLimit - this.spinButton.width - units * 3,
                this.spinButton.y = this.playArea.height - units * 45);
            
            this.autoPlayButton.position.set(
                this.spinButton.x,
                this.spinButton.y + this.spinButton.height + units * 3);
            
            this.fullscreenButton.position.set(
                leftLimit + units * 3,
                units * 3);
                
            this.fastSpinButton.position.set(
                this.spinButton.x + this.spinButton.width - this.fastSpinButton.width, 
                this.spinButton.y + this.spinButton.height + units * 3);
                
            this.toggleSoundButton.position.set(
                leftLimit + units * 3,
                this.spinButton.y + this.spinButton.height + units * 3);
            
            this.settingsButton.position.set(
                leftLimit + units * 3,
                this.toggleSoundButton.y - units * 13);
            
            this.betButton.position.set(
                leftLimit + units * 16,
                this.spinButton.y + this.spinButton.height + units * 3);
            
            this.reelsButton.position.set(
                leftLimit + units * 16,
                this.toggleSoundButton.y - units * 13);
        }else {
            // Portrait case
        
            // Scaling of UI components:
            scaleToSpecificHeight(this.spinButton, units * 30, this.spinButton.texture.height);
        
            for(let button of this.allButtons) {
                if(button !== this.spinButton) {
                    scaleToSpecificHeight(button, units * 13, button.texture.width);
                }
            }
            
            // Buttons layout:
            this.spinButton.position.set(
                (this.playArea.width - this.spinButton.width)/2,
                canvasHeight - units * 62);
            
            this.autoPlayButton.position.set(
                this.spinButton.x,
                this.spinButton.y + this.spinButton.height + units * 3);
            
            this.fullscreenButton.position.set(
                leftLimit + units * 3,
                units * 3);
            
            this.fastSpinButton.position.set(
                this.spinButton.x + this.spinButton.width - this.fastSpinButton.width,
                this.spinButton.y + this.spinButton.height + units * 3);
            
            this.toggleSoundButton.position.set(
                units * 2.5, 
                this.spinButton.y + this.spinButton.height + units * 3);
            
            this.betButton.position.set(
                units * 18,
                this.spinButton.y + this.spinButton.width + units * 3);
            
            this.settingsButton.position.set(
                canvasWidth - this.settingsButton.width - units * 2.5,
                this.spinButton.y + this.spinButton.height + units * 3);
            
            this.reelsButton.position.set(
                canvasWidth - this.settingsButton.width - this.reelsButton.width - units * 3 - units * 2.5,
                this.spinButton.y + this.spinButton.height + units * 3);
            
            
            // Position the play area slightly above the spin button:
            this.playArea.y = Math.max(0, this.spinButton.y - units * 105);
        }
        
        // Background images layout:
        scaleToSpecificHeight(this.backgroundContainer, this.playArea.height, this.backgroundSprite.height);
        this.backgroundContainer.y = this.playArea.y;
        this.backgroundContainer.x = leftLimit + ((rightLimit - leftLimit) - this.backgroundContainer.width)/2;
        
        
        this.balanceLabel.x = this.playArea.x + this.playArea.width - units * 2;
        this.balanceLabel.y = canvasHeight - this.balanceLabel.height  - units * 1;
        
        this.betLabel.x = this.playArea.x + units * 2;
        this.betLabel.y = canvasHeight - this.betLabel.height - units * 1;
        
        
        // Compute reel layout:
        let reelWidth = (reelsAreaWidth - (gapBetweenReels * (this.reelCount - 1)))/this.reelCount;
        let reelHeight = reelWidth * this.rowCount;
        if(reelHeight > reelsAreaHeight) {
            // NOTE: I assume all symbol textures are always square and of equal size.
            reelWidth = reelsAreaHeight/this.rowCount;
            reelHeight = reelWidth * this.rowCount;
        }
        
        // Horizontal distance from the left side of the leftmost reel, to the right side of the rightmost reel.
        let allReelsWidth = (reelWidth * this.reelCount) + (gapBetweenReels * (this.reelCount - 1));
        
        
        for(let reelIndex = 0; reelIndex < this.reels.length; reelIndex++) {
            let reel = this.reels[reelIndex];
            
            for(let spriteIndex = 0; spriteIndex < reel.sprites.length; spriteIndex++) {
                let sprite = reel.sprites[spriteIndex];
                
                sprite.texture = this.symbolTextures[reel.allSymbols[spriteIndex]];
                sprite.y = spriteIndex * sprite.height;
            }
            
            scaleToSpecificWidth(reel.container, reelWidth);
            reel.container.x = (reelWidth + gapBetweenReels) * reelIndex;
            reel.container.y = -reelWidth * this.paddingSymbols; // Negative offset to hide the upper padding symbols
            
            // Set up the animated symbols:
            scaleToSpecificWidth(this.animatedSymbols[reelIndex], reelWidth);
            this.animatedSymbols[reelIndex].x = (reelWidth + gapBetweenReels) * reelIndex;
            this.animatedSymbols[reelIndex].y = 0;
        }
        
        
        this.reelsContainer.x = centeredOn(allReelsWidth, this.playArea.x, this.playArea.width);
        this.reelsContainer.y = centeredOn(reelHeight, this.playArea.y, this.playArea.height);
        
        if(!this.debug) {
            let mask = new PIXI.Graphics()
            .beginFill(0xFFFFFF)
            .drawRect(this.reelsContainer.x, this.reelsContainer.y, allReelsWidth, reelHeight)
            .endFill();
            
            mask.filters = [new PIXI.filters.BlurFilter(20)];
            this.reelsContainer.mask = mask;
        }
        
        // Debugging information:
        if(this.debug) {
            this.graphicsOverlay.clear();
            this.graphicsOverlay.lineStyle(2, 0x00AF00);
            this.graphicsOverlay.drawRect(this.playArea.x, this.playArea.y, this.playArea.width, this.playArea.height);
            this.graphicsOverlay.lineStyle(2, 0xAF0000);
            this.graphicsOverlay.drawRect(this.reelsContainer.x, this.reelsContainer.y, allReelsWidth, reelHeight);
            this.graphicsOverlay.lineStyle(2, 0x0000AF);
            this.graphicsOverlay.drawRect(this.playArea.x - maximumDistanceFromPlayArea, this.playArea.y, this.playArea.width + maximumDistanceFromPlayArea * 2, this.playArea.height);
        }
    }

    /**
     * Changes the dimensions of the PIXI canvas or renderer and then relayout's everything.
     * @param {number} width New width
     * @param {number} height New height
     */
    resizeTo(width, height) {
        this.app.renderer.resize(width, height);

        this.relayout();
    }
}

