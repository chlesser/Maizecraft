class Pathfinder extends Phaser.Scene {
    constructor() {
        super("pathfinderScene");
        this.npcPool = null;
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;
    }

    preload() {
        this.load.spritesheet('chars', 'assets/chars.png');
    }

    create() {
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
        this.keys = this.input.keyboard.addKeys('R,D');
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
        
        this.randomizeNPC(npc);

        this.time.delayedCall(50, () => {
            Object.values(npc.sprites).forEach(sprite => sprite.setVisible(true));
            npc.setVisible(true);
            this.startNPCMovement(npc);
        });

        return npc;
    }

    startNPCMovement(npc) {
        const nextIndex = (npc.currentPathIndex + 1) % this.pathPoints.length;
        const nextPoint = this.pathPoints[nextIndex];
        
        npc.currentPathIndex = nextIndex;

        const dx = nextPoint.x - npc.x;
        const dy = nextPoint.y - npc.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 64;
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
}