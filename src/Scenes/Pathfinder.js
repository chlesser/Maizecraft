class Pathfinder extends Phaser.Scene {
    constructor() {
        super("pathfinderScene");

        // npc pool
        this.npcPool = null;

        // modes
        this.placeMode = false;

        //map properties
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;
    }

    preload() {
        this.load.spritesheet('chars', 'assets/chars.png');
    }

    create() {
        this.placeMode = false;
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
        
        // Detect walkable tiles via tile property "path"
        const walkableTiles = [];
        for (let i = 0; i < this.tileset.total; i++) {
            const props = this.tileset.getTileProperties(i);
            if (props?.path) {
                walkableTiles.push(i);
            }
        }

        // get path start and end points
        this.pathEndpoints = this.getPathEndpoints();

        //easy star
        this.finder = new EasyStar.js();
        this.finder.setGrid(this.grid);
        this.finder.setAcceptableTiles(walkableTiles);
        this.finder.disableDiagonals(); // DISABLED for simple movement
        this.finder.setIterationsPerCalculation(1000);
        this.finder.calculate();

        //initialize clothing options
        this.clothingOptions = {
            bodies: [0, 1, 54, 55, 108, 109, 162, 163], //162 and 163 are green
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
    }

    update() {
        /*delete later*/
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.spawnNPC();
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.D)) {
            const activeNpcs = this.npcPool.getChildren().filter(npc => npc.active);
            if (activeNpcs.length > 0) {
                this.despawnNPC(activeNpcs[0]);
            }
        }
        if (Phaser.Input.Keyboard.JustDown(this.keys.P)) {
            // place turret test
            if (this.placeMode) {
                this.placeMode = false;
            } else {
                // toggle place mode and generate an NPC that hugs the cursor
                this.spawnNPC();
                this.placeMode = true;
            }
        }
        if(this.placeMode) {
            this.handlePlacemode();
        }
    }

//---------------------------- HELPER FUNCTIONS ----------------------------//

    spawnNPC() {
        // set start spawn point for npcs
        const {start} = this.pathEndpoints;
        const x = (start.x + 0.5) * this.TILESIZE;
        const y = (start.y + 0.5) * this.TILESIZE;

        //NPC from pool but keep it hidden (so it doesnt flicker)
        const npc = this.npcPool.get(0, 0);
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
        npc.x = x;
        npc.y = y;
        this.randomizeNPC(npc);

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
    spawnTurret() {
        const turret = new Turret()
    }


    // NOT FULLY WORKING YET
    // NPCs only walk from start to end off intended path as of noew
    assignPathfinding(npc) {
        const { start, end } = this.pathEndpoints;

        this.finder.findPath(start.x, start.y, end.x, end.y, path => {
            if (!path || path.length === 0) {
                console.warn("No path found!");
                return;
            }

            this.followPath(npc, path);
        });

        this.finder.calculate();
    }


    followPath(npc, path) {
        // for testing - REMOVE LATER
        const graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 } });
        //

        const points = path.map(step => ({
            x: (step.x + 0.5) * this.TILESIZE,
            y: (step.y + 0.5) * this.TILESIZE
        }));

        // draw path line - REMOVE LATER
        for (let i = 0; i < points.length - 1; i++) {
            graphics.strokeLineShape(new Phaser.Geom.Line(
                points[i].x, points[i].y,
                points[i + 1].x, points[i + 1].y
            ));
        }
        // 

        this.tweens.add({
            targets: npc,
            props: {
                x: { value: points.map(p => p.x), ease: 'Linear' },
                y: { value: points.map(p => p.y), ease: 'Linear' }
            },
            duration: path.length * 300,
            onComplete: () => this.assignPathfinding(npc)
        });
    }


    getPathEndpoints() {
        const objects = this.map.getObjectLayer("PathPoints").objects;
        let start = null;
        let end = null;

        objects.forEach(obj => {
            const tileX = Math.floor(obj.x / this.TILESIZE);
            const tileY = Math.floor(obj.y / this.TILESIZE);
            if (obj.name === "start") start = { x: tileX, y: tileY };
            if (obj.name === "end") end = { x: tileX, y: tileY };
        });

        return { start, end };
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
        isPlaceable
        Input --> Takes in a tile index
        Output ---> Boolean
        Description --> This function checks if a tile is obstructed by checking its properties.
            If the tile has no properties or the walkway property is not set, it returns true (obstructed).
            Otherwise, it returns false (not obstructed).
    */
    isPlaceable(tileIndex) {
        const properties = this.tileset.getTileProperties(tileIndex);
        return !(properties || properties.walkway);
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

    handlePlacemode(turret) {
        if (turret != null) {
                turret.x = Math.floor(this.pointer.worldX / this.TILESIZE)
                turret.y = Math.floor(this.pointer.worldY / this.TILESIZE)
        }

        if (this.pointer.isDown) {
            const tileX = Math.floor(this.pointer.worldX / this.TILESIZE);
            const tileY = Math.floor(this.pointer.worldY / this.TILESIZE);
            const tileIndex = this.map.getTileAt(tileX, tileY, true, this.groundLayer);
            if (tileIndex && this.isPlaceable(tileIndex.index)) { // Check if the tile exists empty
                const npc = this.spawnNPC();
                npc.x = (tileX + 0.5) * this.TILESIZE;
                npc.y = (tileY + 0.5) * this.TILESIZE;
                this.placeMode = false; // Exit place mode after placing
            }
        }
    }
}