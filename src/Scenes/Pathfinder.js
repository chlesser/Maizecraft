class Pathfinder extends Phaser.Scene {
    constructor() {
        super("pathfinderScene");

        // npc pool
        this.npcPool = null;

        // modes
        this.mode = {
            PLACE: false,
            RUNE: false,
            DEFAULT: true
        }
        this.currentTurret = null;
        this.currentRune = null;

        //map properties
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;

        //list of placed turrets
        this.turrets = [];
    }

    preload() {
        this.load.spritesheet('chars', 'assets/chars.png');
    }

    create() {
        // Initialize properties
        this.modeReset();
        this.currentTurret = null;
        this.currentRune = null;
        
        //Initialize tilemap 
        this.map = this.add.tilemap("maizecraft-map", this.TILESIZE, this.TILESIZE);
        if (!this.map) {
            console.error("Tilemap failed to load!");
            return;
        }

        this.tileset = this.map.addTilesetImage("rougelike-sheet", "tilemap_tiles");

        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0);
        this.pathLayer = this.map.createLayer("Walkways", this.tileset, 0, 0);
        this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);


        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);

        this.grid = this.layersToGrid([this.groundLayer, this.pathLayer, this.treesLayer]);

        //so sorry gang i went and did it this way...
        this.pathPoints = [
            { x: (0) * this.TILESIZE, y: (10) * this.TILESIZE },    // Point 1
            { x: (6) * this.TILESIZE, y: (10) * this.TILESIZE },   // Point 2
            { x: (6) * this.TILESIZE, y: (4) * this.TILESIZE },   // Point 3
            { x: (14) * this.TILESIZE, y: (4) * this.TILESIZE },   // Point 4
            { x: (14) * this.TILESIZE, y: (16) * this.TILESIZE },  // Point 5
            { x: (4) * this.TILESIZE, y: (16) * this.TILESIZE },  // Point 6
            { x: (4) * this.TILESIZE, y: (22) * this.TILESIZE },  // Point 7
            { x: (29) * this.TILESIZE, y: (22) * this.TILESIZE },  // Point 8
            { x: (29) * this.TILESIZE, y: (16) * this.TILESIZE },   // Point 9
            { x: (23) * this.TILESIZE, y: (16) * this.TILESIZE },   // Point 10
            { x: (23) * this.TILESIZE, y: (10) * this.TILESIZE },   // Point 11
            { x: (28) * this.TILESIZE, y: (10) * this.TILESIZE },  // Point 12
            { x: (28) * this.TILESIZE, y: (5) * this.TILESIZE },  // Point 13
            { x: (35) * this.TILESIZE, y: (5) * this.TILESIZE },  // Point 14
            { x: (35) * this.TILESIZE, y: (11) * this.TILESIZE },   // Point 15
            { x: (40) * this.TILESIZE, y: (11) * this.TILESIZE }   // Point 16
        ];
        
        this.currentPathIndex = 0;

       
        //initialize clothing options
        this.clothingOptions = {
            bodies: [0, 1, 54, 55, 108, 109], //162 and 163 are green
            orcbodies: [162, 163],
            drawls: this.generateDrawlsFrames(),
            shoes: this.generateShoesFrames(),
            armor: this.generateArmorFrames(),
            wig: this.generateWigFrames()
        };

        //npc pool (no distinction between ally and foe rn)
        this.npcPool = this.add.group({
            classType: Phaser.GameObjects.Container,
            runChildUpdate: true
        });

        //delete later
        this.keys = this.input.keyboard.addKeys('R,D,P');
        this.pointer = this.input.activePointer;
        
        //Right click to reset mode and destroy current turret/rune
        this.input.on('pointerdown', (pointer) => {
            if(pointer.rightButtonDown()) {
                this.modeReset();
                if(this.currentTurret != null) {
                    this.currentTurret.destroy();
                    this.currentTurret = null;
                }
                if(this.currentRune != null) {
                    this.currentRune.destroy();
                    this.currentRune = null;
                }
            }
        })
    }
    update() {
        /*delete later*/
        if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
            // place turret test
            if (this.mode.DEFAULT) {
                // toggle place mode and generate an NPC that hugs the cursor
                this.currentTurret = this.spawnTurret('warrior'); // Example turret type
                this.modeReset('PLACE');
            }
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            // place rune test
            if (this.mode.DEFAULT) {
                // toggle place mode and generate an NPC that hugs the cursor
                this.currentRune = this.spawnRune(); // Example turret type
                this.modeReset('RUNE');
            }
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.D)) {
            this.spawnNPC();
        }
        //HANDLE GLOBAL MODE UPDATING
        if(this.mode.PLACE)
        {
            this.handlePlacemode(this.currentTurret);
        }
        else if (this.mode.RUNE) {
            this.handleRunemode(this.currentRune);
        }
    }

//---------------------------- HELPER FUNCTIONS ----------------------------//

        spawnNPC() {
        const spawnPoint = this.pathPoints[0];
        const npc = this.npcPool.get(spawnPoint.x, spawnPoint.y);
        npc.setActive(true).setVisible(false);

        //initialize sprites if needed
        if (!npc.sprites) {
            npc.sprites = {
                body: this.add.sprite(0, 0, 'chars', 0).setVisible(false),
                drawls: this.add.sprite(0, 0, 'chars', 0).setVisible(false),
                shoes: this.add.sprite(0, 0, 'chars', 0).setVisible(false),
                armor: this.add.sprite(0, 0, 'chars', 0).setVisible(false),
                wig: this.add.sprite(0, 0, 'chars', 0).setVisible(false)
            };
            npc.add(Object.values(npc.sprites));
        }

        npc.x = spawnPoint.x;
        npc.y = spawnPoint.y;
        
        //add individual path tracking for each NPC
        npc.currentPathIndex = 0;
        
        this.randomizeOrc(npc);

        this.time.delayedCall(50, () => {
            Object.values(npc.sprites).forEach(sprite => sprite.setVisible(true));
            npc.setVisible(true);
            this.startNPCMovement(npc);
        });

        return npc;
    }
    /*
        spawnTurret
        Input --> Takes in a turret type as a string
        Output --> returns a new turret object
        Description --> This function creates a new turret object of the specified type.
    */

    spawnTurret(type) {
        let npc = this.npcPool.get(0, 0);
        npc.setActive(true).setVisible(false);

        //Initialize sprites if needed (while hidden)
        if (!npc.sprites) {
            npc.sprites = {
                body: this.add.sprite(0, 0, 'chars', 0).setVisible(false),
                drawls: this.add.sprite(0, 0, 'chars', 0).setVisible(false),
                shoes: this.add.sprite(0, 0, 'chars', 0).setVisible(false),
                armor: this.add.sprite(0, 0, 'chars', 0).setVisible(false),
                wig: this.add.sprite(0, 0, 'chars', 0).setVisible(false)
            };
            npc.add(Object.values(npc.sprites));
        }

        //set location and randomize
        this.randomizeNPC(npc);
        const turret = new Turret(type);
        npc.turret = turret;


        //Brief delay before showing to prevent flicker
        this.time.delayedCall(50, () => {
            Object.values(npc.sprites).forEach(sprite => sprite.setVisible(true));
            npc.setVisible(true);
            
            //Start movement after another brief delay
            // this.time.delayedCall(Phaser.Math.Between(500, 1500), () => {
            //     this.assignPathfinding(npc);
            // });
        });
        return npc;
    }
    /*
        SpawnRune spawns a rune of a random type and a random level, at 100, 100.
        Input --> None
        Output --> Rune
    */
    spawnRune() {
        const types = ['cooldown', 'damage', 'range', 'fire', 'frost'];
        const levels = [1, 2, 3];
        const type = Phaser.Utils.Array.GetRandom(types);
        const level = Phaser.Utils.Array.GetRandom(levels);

        const rune = new Rune(type, level, this, 100, 100, 'defaultRune');
        this.currentRune = rune;
        return rune;
    }

    startNPCMovement(npc) {
        const nextIndex = (npc.currentPathIndex + 1) % this.pathPoints.length;
        const nextPoint = this.pathPoints[nextIndex];
        
        npc.currentPathIndex = nextIndex;

        const dx = nextPoint.x - npc.x;
        const dy = nextPoint.y - npc.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 60; //adjust as you please
        const duration = (distance / speed) * 1000;

        this.tweens.add({
            targets: npc,
            x: nextPoint.x,
            y: nextPoint.y,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                this.startNPCMovement(npc);
            }
        });
    }

    layersToGrid(layers) {
        const grid = [];
        for (let y = 0; y < this.map.height; y++) {
            grid[y] = [];
            for (let x = 0; x < this.map.width; x++) {
                let tileValue = 0;
                for (const layer of layers) {
                    const tile = layer.getTileAt(x, y);
                    if (tile) tileValue = tile.index;
                }
                grid[y][x] = tileValue;
            }
        }
        return grid;
    }


    despawnNPC(npc) {
        this.tweens.killTweensOf(npc);
        this.npcPool.killAndHide(npc);
    }


    randomizeNPC(npc) { //again, theres no distinction between friend and foe rn
        const {body, drawls, shoes, armor, wig} = npc.sprites;
        body.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.bodies));
        drawls.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.drawls));
        shoes.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.shoes));
        armor.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.armor));
        wig.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.wig));
        npc.setScale(Phaser.Math.Between(0, 1) ? -1 : 1, 1);
    }

    randomizeOrc(npc) { //again, theres no distinction between friend and foe rn
        const {body, drawls, shoes, armor, wig} = npc.sprites;
        body.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.orcbodies));
        drawls.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.drawls));
        shoes.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.shoes));
        armor.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.armor));
        wig.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.wig));
        npc.setScale(Phaser.Math.Between(0, 1) ? -1 : 1, 1);
    }


    generateDrawlsFrames() {
        const drawls = [];
        for (let frame = 3; frame <= 435; frame += 54) {
            if (frame !== 219) drawls.push(frame);
        }
        return drawls;
    }

    
    generateShoesFrames() {
        const shoes = [];
        for (let frame = 4; frame <= 490; frame += 54) {
            shoes.push(frame);
        }
        if (!shoes.includes(219)) shoes.push(219);
        if (!shoes.includes(489)) shoes.push(489);
        return shoes;
    }


    generateArmorFrames() { //can change this up for specific classes later
        const armor = [];
        for (let row = 0; row < 10; row++) {
            const rowStart = row * 54;
            for (let col = 6; col <= 17; col++) {
                armor.push(rowStart + col);
            }
        }
        return armor;
    }


    generateWigFrames() {
        const wigFrames = [];
    
        for (let row = 0; row < 12; row++) {         
            const rowStart = row * 54;
            for (let col = 19; col <= 26; col++) { 
                //pain in my neck extra chunk
                if (!(col >= 23 && row >= 8)) {
                    wigFrames.push(rowStart + col);
                }
            }
        }
    
        return wigFrames;
    }

    /*
        modeReset simply sets all modes to false, aside from the one passed in.
    */

    modeReset(newMode) {
        for (const mode in this.mode) {
            this.mode[mode] = false;
        }
        switch (newMode) {
            case 'PLACE':
                this.mode.PLACE = true;
                break;
            case 'RUNE':
                this.mode.RUNE = true;
                break;
            default:
                this.mode.DEFAULT = true;
        }
    }

    /*
        HandlePlaceMode
        Input --> Takes in a turret object
        Output ---> null
        Description --> This function is only called when placeMode is active.
            It checks if the pointer is down and if the tile at the pointer position is both active and not a walkway
            If so, it spawns an NPC at the tile position and exits place mode.
            If the tile is not empty, it does nothing.
    */

    handlePlacemode(hero) {
        //First, identify the x and y coordinates of the tile under the pointer
        const tileX = Math.floor(this.pointer.worldX / this.TILESIZE);
        const tileY = Math.floor(this.pointer.worldY / this.TILESIZE);

        //next, we get the tile index of the tile at the pointer position for each of the three layers
        const tileIndex = this.map.getTileAt(tileX, tileY, true, this.groundLayer);
        const tileIndex2 = this.map.getTileAt(tileX, tileY, true, this.pathLayer);
        const tileIndex3 = this.map.getTileAt(tileX, tileY, true, this.treesLayer);

        //first, we make sure we were given an actual turret object
        if (hero != null) {
            //then, we set the xy to snap to a tile
            hero.x = (tileX + 0.5) * this.TILESIZE;
            hero.y = (tileY + 0.5) * this.TILESIZE;
            //also, the hero is now visible
            hero.setVisible(true);

            //finally, we start to detect if the cursor is pressed
            if (this.pointer.isDown) {
                //first off, let's get a bool to see if that tile is occupied.
                for(const friend of this.turrets) {
                    if (friend.turret.tileX === tileX && friend.turret.tileY === tileY) {
                        return; // Exit if the tile is already occupied
                    }
                }
                //we make sure there is a tile on the first layer, and not the second or third layer
                if (tileIndex && (tileIndex2.index == -1 && tileIndex3.index == -1)) { // Check if the tile exists empty
                    this.currentTurret = null; // Clear current hero reference
                    this.modeReset();
                    hero.turret.tileX = tileX; // Set turret's tile position
                    hero.turret.tileY = tileY; // Set turret's tile position
                    this.turrets.push(hero); // Add turret to the list of placed turrets
                }
            }
        }
    }
    /*
        HandlePlaceMode
        Input --> Takes in a rune class object
        Output ---> null
        Description --> This function is only called when runeMode is active.
            It checks if the pointer is down and if the pointer position is on a tile with a turret.
            If so, it adds the rune to the turret's rune list and exits rune mode.
    */

    handleRunemode(rune) {
        //First, identify the x and y coordinates of the tile under the pointer
        const tileX = Math.floor(this.pointer.worldX / this.TILESIZE);
        const tileY = Math.floor(this.pointer.worldY / this.TILESIZE);

        if(rune != null) {
            //then, we set the xy to snap to a tile
            rune.x = (tileX + 0.5) * this.TILESIZE;
            rune.y = (tileY + 0.5) * this.TILESIZE;

            //finally, we start to detect if the cursor is pressed
            if (this.pointer.isDown) {
                //we make sure there is a turret at the tile position
                for(const friend of this.turrets) {
                    if (friend.turret.tileX === tileX && friend.turret.tileY === tileY) {
                        let executionResult = friend.turret.addRune(rune.level, rune.type);
                        if(executionResult) {
                            this.currentRune = null; // Clear current rune reference
                            this.modeReset(); // Exit rune mode after placing
                            rune.destroy(); // Remove the rune from the scene
                            return; // Exit after placing the rune
                        }
                    }
                }
            }
        }
    }
}