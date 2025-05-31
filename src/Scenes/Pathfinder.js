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
        this.load.image('tilemap_tiles', 'assets/tiles.png');
        this.load.tilemapTiledJSON('three-farmhouses', 'assets/three-farmhouses.json');
    }

    create() {
        //Initialize tilemap - this map is temporary
        this.map = this.add.tilemap("three-farmhouses", this.TILESIZE, this.TILESIZE);
        if (!this.map) {
            console.error("Tilemap failed to load!");
            return;
        }

        this.tileset = this.map.addTilesetImage("kenney-tiny-town", "tilemap_tiles");
        this.groundLayer = this.map.createLayer("Ground-n-Walkways", this.tileset, 0, 0);
        this.treesLayer = this.map.createLayer("Trees-n-Bushes", this.tileset, 0, 0);
        this.housesLayer = this.map.createLayer("Houses-n-Fences", this.tileset, 0, 0);


        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);

        //temporary map
        const walkables = [1, 2, 3, 30, 40, 41, 42, 43, 44, 95, 13, 14, 15, 25, 26, 27, 37, 38, 39, 70, 84];
        this.grid = this.layersToGrid([this.groundLayer, this.treesLayer, this.housesLayer]);

        //easy star
        this.finder = new EasyStar.js();
        this.finder.setGrid(this.grid);
        this.finder.setAcceptableTiles(walkables);
        this.finder.enableDiagonals();
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
        this.keys = this.input.keyboard.addKeys('R,D');
    }

    update() {
        /*delete later*/
        if (Phaser.Input.Keyboard.JustDown(this.keys.R)) {
            this.spawnNPC(
                Phaser.Math.Between(5, this.map.width - 5) * this.TILESIZE,
                Phaser.Math.Between(5, this.map.height - 5) * this.TILESIZE
            );
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.D)) {
            const activeNpcs = this.npcPool.getChildren().filter(npc => npc.active);
            if (activeNpcs.length > 0) {
                this.despawnNPC(activeNpcs[0]);
            }
        }
    }

    spawnNPC(x, y) {
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
        this.time.delayedCall(Phaser.Math.Between(500, 1500), () => {
            this.assignPathfinding(npc);
        });
    });
    return npc;
}
    //TO FIX LATER
    assignPathfinding(npc) { //this will get changed once we have map and actual paths
        //current grid position
        const currentX = Math.floor(npc.x / this.TILESIZE);
        const currentY = Math.floor(npc.y / this.TILESIZE);

        //define walkable tiles
        const walkableTiles = [1, 2, 3, 30, 40, 41, 42, 43, 44, 95, 13, 14, 15, 25, 26, 27, 37, 38, 39, 70, 84];
        const directions = [
            { x: 0, y: -1, weight: 1 }, //up
            { x: 1, y: 0, weight: 1 },  //right
            { x: 0, y: 1, weight: 1 },  //down
            { x: -1, y: 0, weight: 1 }  //left
        ];
        const validMoves = directions.filter(dir => {
            const newX = currentX + dir.x;
            const newY = currentY + dir.y;
            return newX >= 0 && newX < this.grid[0].length && 
                   newY >= 0 && newY < this.grid.length &&
                   walkableTiles.includes(this.grid[newY][newX]);
        });

        if (validMoves.length > 0) {
            const move = Phaser.Utils.Array.GetRandom(validMoves);
            const targetX = currentX + move.x;
            const targetY = currentY + move.y;

            //moves one tile
            this.tweens.add({
                targets: npc,
                x: (targetX + 0.5) * this.TILESIZE,
                y: (targetY + 0.5) * this.TILESIZE,
                duration: 400,
                onComplete: () => {
                    this.time.delayedCall(Phaser.Math.Between(0, 2000), () => {
                        this.assignPathfinding(npc);
                    });
                }
            });
        }else {
            this.time.delayedCall(Phaser.Math.Between(2000, 4000), () => {
                this.assignPathfinding(npc);
            });
            
        }
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

    followPath(npc, path) {
        const points = path.map(step => ({
            x: (step.x + 0.5) * this.TILESIZE,
            y: (step.y + 0.5) * this.TILESIZE
        }));

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