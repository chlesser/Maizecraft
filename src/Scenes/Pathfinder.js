class Pathfinder extends Phaser.Scene {
    constructor() {
        super("pathfinderScene");

        // npc pool
        this.npcPool = null;
        this.TURRET_SCALE = 2; // Scale for turret sprites

        // modes
        this.mode = {
            PLACE: false,
            RUNE: false,
            DEFAULT: true
        }
        this.currentTurret = null;
        this.currentRune = null;


        //logic
        this.cornfieldhealth = 10
        this.corn = 0;
        
        
        this.currentWave = 1;
        this.waveSet = 5; // Each set contains 5 waves
        this.waveTimer = null;
        this.spawnInterval = null;
        this.enemiesInWave = 0;
        this.enemiesAlive = 0;
        
        //enemy stats
        this.enemyStats = {
            speed: (x) =>  0.1 * x + 1,
            health: (x) => 15 * Math.exp(0.1 * x) - 10,
            damage: (x) => 0.1 * x + 1,
            corn: (x) => 10 * x
        };

        //map properties
        this.TILESIZE = 16;
        this.SCALE = 2.0;
        this.TILEWIDTH = 40;
        this.TILEHEIGHT = 25;

        //list of placed turrets
        this.turrets = [];
        this.enemies = [];
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

        //npc pool
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
            this.startWave();
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


        startWave() {
        //clear any existing timers
        if (this.waveTimer) this.waveTimer.destroy();
        if (this.spawnInterval) this.spawnInterval.destroy();

        console.log(`Starting Wave ${this.currentWave}`);

        //calculate power points for this wave
        const powerPoints = Math.pow(2, this.currentWave);
        
        //determine wave type within the set of 5
        const waveType = this.currentWave % 5 || 5; // 1-5
        
        switch (waveType) {
            case 1:
                this.spawnWaveType1(powerPoints);
                console.log(1);
                break;
            case 2:
                this.spawnWaveType2(powerPoints);
                console.log(2);
                break;
            case 3: // miniboss
                this.spawnWaveType3(powerPoints);
                console.log(3);
                break;
            case 4: // horde
                this.spawnWaveType4(powerPoints);
                console.log(4);
                break;
            case 5: // boss
                this.spawnWaveType5(powerPoints);
                console.log(5);
                break;
        }
        
        this.waveTimer = this.time.addEvent({
            delay: 1000,
            callback: this.checkWaveComplete,
            callbackScope: this,
            loop: true
        });
    }

    spawnWaveType1(powerPoints) {
        //Wave 1: .1 PP on 10 creatures
        const ppPerEnemy = Math.max(0.1 * powerPoints / 10, 1);
        this.enemiesInWave = 10;
        
        this.spawnInterval = this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.spawnEnemy(ppPerEnemy);
            },
            callbackScope: this,
            repeat: this.enemiesInWave - 1
        });
        
        // Spawn first enemy immediately
        this.spawnEnemy(ppPerEnemy);
    }

    spawnWaveType2(powerPoints) {
        //Wave 2: .25 PP on 2 creatures, .1 PP on 5 creatures
        const strongPP = Math.max(0.25 * powerPoints / 2, 1);
        const weakPP = Math.max(0.1 * powerPoints / 5, 1);
        this.enemiesInWave = 7; // 2 strong + 5 weak
        
        //spawn strong enemies
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                this.spawnEnemy(strongPP);
            },
            callbackScope: this,
            repeat: 1
        });
        
        //spawn weak enemies
        this.time.addEvent({
            delay: 6000,
            callback: () => {
                this.spawnInterval = this.time.addEvent({
                    delay: 800,
                    callback: () => {
                        this.spawnEnemy(weakPP);
                    },
                    callbackScope: this,
                    repeat: 4
                });
                this.spawnEnemy(weakPP); // First weak enemy
            },
            callbackScope: this
        });
    }

    spawnWaveType3(powerPoints) {
        //Wave 3 (Miniboss): .5 PP on a creature, .1 PP on 5 creatures
        const bossPP = Math.max(0.5 * powerPoints, 1);
        const minionPP = Math.max(0.1 * powerPoints / 5, 1);
        this.enemiesInWave = 6; // 1 boss + 5 minions
        
        //spawn miniboss
        this.spawnEnemy(bossPP, false, true);
        
        //spawn minions after a delay
        this.time.addEvent({
            delay: 2000,
            callback: () => {
                this.spawnInterval = this.time.addEvent({
                    delay: 1000,
                    callback: () => {
                        this.spawnEnemy(minionPP);
                    },
                    callbackScope: this,
                    repeat: 4
                });
                this.spawnEnemy(minionPP); // First minion
            },
            callbackScope: this
        });
    }

    spawnWaveType4(powerPoints) {
        //Wave 4 (Horde): .02 PP on each creature
        const enemyCount = Math.min(Math.floor(powerPoints / 0.02), 50); 
        const ppPerEnemy = Math.max(0.02 * powerPoints, 1);
    
        //set the total enemies for this wave
        this.enemiesInWave = enemyCount;
        this.enemiesAlive = 0; //reset alive counter
    
        //clear any existing interval
        if (this.spawnInterval) {
            this.spawnInterval.destroy();
        }
    
    //spawn first enemy immediately
    this.spawnEnemy(ppPerEnemy);
    
    //spawn remaining enemies with interval
    if (enemyCount > 1) {
        this.spawnInterval = this.time.addEvent({
            delay: 300,
            callback: () => {
                this.spawnEnemy(ppPerEnemy);
            },
            callbackScope: this,
            repeat: enemyCount - 1
        });
    }
}

    spawnWaveType5(powerPoints) {
        //Wave 5 (Boss): .75 PP on a single creature
        const bossPP = Math.max(0.75 * powerPoints, 1);
        
        //spawn boss
        this.spawnEnemy(bossPP, true, false);
    }

    enemyDefeated(enemy) {
    this.enemiesAlive--;
    this.enemiesInWave--;
    
        //award corn
        if (enemy.stats) {
        this.corn += enemy.stats.corn;
        console.log(`Enemy defeated! Awarded ${enemy.stats.corn} corn`);
    }
    
    this.checkWaveComplete();
}

    checkWaveComplete() {
    if (this.enemiesAlive <= 0 && this.enemiesInWave <= 0) {
        this.waveComplete();
    }
}

    waveComplete() {
        console.log(`Wave ${this.currentWave} complete!`);
        
        if (this.waveTimer) this.waveTimer.destroy();
        if (this.spawnInterval) this.spawnInterval.destroy();
        
        this.currentWave++;
        if (this.currentWave % 5 === 1) {
            this.waveSet++;
        }
        
        //delay before next wave starts
        this.time.delayedCall(5000, this.startWave, [], this);
    }


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
        const nextIndex = npc.currentPathIndex + 1;
        
        //check if reached the last point
        if (nextIndex >= this.pathPoints.length) {
            this.enemyReachedEnd(npc);
            return;
        }

        const nextPoint = this.pathPoints[nextIndex];
        npc.currentPathIndex = nextIndex;

        const dx = nextPoint.x - npc.x;
        const dy = nextPoint.y - npc.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = npc.stats ? npc.stats.speed * 16 : 60; //use enemy speed if available
        //console.log(speed);
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

    //handle enemies reaching the end
    enemyReachedEnd(npc) {
        console.log("Enemy reached the end!");
        
        //reduce corn field health
        this.cornfieldhealth -= npc.stats ? npc.stats.damage : 1;
        console.log("damage " + npc.stats.damage);
        console.log(this.cornfieldhealth);
        
        this.enemiesAlive--;
        this.enemiesInWave--;
        console.log(this.enemiesAlive);
        
        this.despawnNPC(npc);
        this.checkWaveComplete();
    }

    //mark enemies
    spawnEnemy(powerPoints, isBoss = false, miniBoss = false) {
        const enemy = this.spawnNPC();
        
        //Mark as enemy for wave system
        enemy.isEnemy = true;
        
        //Calculate enemy stats based on power points
        const stats = {
            speed: this.enemyStats.speed(powerPoints),
            health: this.enemyStats.health(powerPoints),
            damage: this.enemyStats.damage(powerPoints),
            corn: this.enemyStats.corn(powerPoints)
        };
        

        enemy.stats = stats;
        enemy.isBoss = isBoss;
        enemy.currentPathIndex = 0; 
        this.enemiesAlive++;
        
        //Visual indication for bosses
        if (isBoss) {
            enemy.setScale(2.0); //larger size
        }
        if (miniBoss) {
            enemy.setScale(1.5); //larger size
        }
        
        //track enemy death
        enemy.on('destroy', () => {
            this.enemyDefeated(enemy);
        });
        this.enemies.push(enemy);
        return enemy;
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


    randomizeNPC(npc) { //wow!
        const {body, drawls, shoes, armor, wig} = npc.sprites;
        body.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.bodies));
        drawls.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.drawls));
        shoes.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.shoes));
        armor.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.armor));
        wig.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.wig));
        //npc.setScale(Phaser.Math.Between(0, 1) ? -1 : 1, 1);
        npc.setScale(this.TURRET_SCALE)
    }

    randomizeOrc(npc) { //same thing just green
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
            //we need to convert based off the scale size
            let scaledX = ((Math.trunc(tileX / this.TURRET_SCALE) + 0.5) * this.TILESIZE * this.TURRET_SCALE);
            let scaledY = ((Math.trunc(tileY / this.TURRET_SCALE) + 0.5) * this.TILESIZE * this.TURRET_SCALE);
            //then, we set the xy to snap to a tile
            hero.x = scaledX;
            hero.y = scaledY;
            //also, the hero is now visible
            hero.setVisible(true);

            //finally, we start to detect if the cursor is pressed
            if (this.pointer.isDown) {
                //first off, let's get a bool to see if that tile is occupied.
                for(const friend of this.turrets) {
                    if (friend.turret.tileX === tileX && friend.turret.tileY === tileY)
                    {
                        return; // Exit if the tile is already occupied
                    }
                }
                //we make sure there is a tile on the first layer, and not the second or third layer
                if (tileIndex && tileIndex2.index == -1 && tileIndex3.index == -1) { // Check if the tile exists empty
                    this.currentTurret = null; // Clear current hero reference
                    this.modeReset();
                    hero.turret.tileX = scaledX; // Set turret's tile position
                    hero.turret.tileY = scaledY; // Set turret's tile position
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
            //we need to convert based off the scale size
            let scaledX = ((Math.trunc(tileX / this.TURRET_SCALE) + 0.5) * this.TILESIZE * this.TURRET_SCALE);
            let scaledY = ((Math.trunc(tileY / this.TURRET_SCALE) + 0.5) * this.TILESIZE * this.TURRET_SCALE);
            //then, we set the xy to snap to a tile
            rune.x = scaledX;
            rune.y = scaledY;

            //finally, we start to detect if the cursor is pressed
            if (this.pointer.isDown) {
                //we make sure there is a turret at the tile position
                for(const friend of this.turrets) {
                    if (friend.turret.tileX === scaledX && friend.turret.tileY === scaledY) {
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