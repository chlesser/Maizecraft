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
        this.isWaveRunning = false;


        //logic
        this.cornfieldhealth = 10
        this.corn = 100;

        //shop costs
        this.shopCosts = {
            warrior: 50,
            archer: 100,
            wizard: 300,
            refresh: 50,
            level1: 50,
            level2: 250,
            level3: 500,
        }
        
        
        this.currentWave = 1;
        this.waveSet = 5; //each set contains 5 waves
        this.spawnInterval = null;
        this.enemiesInWave = 0;
        this.killedEnemies = 0;
        
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
        this.uiLayer = this.map.createLayer("Forbidden", this.tileset, 0, 0).setVisible(false);


        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.cameras.main.setZoom(this.SCALE);

        this.grid = this.layersToGrid([this.groundLayer, this.pathLayer, this.treesLayer]);

        //so sorry gang i went and did it this way...
        this.pathPoints = [
            { x: (0) * this.TILESIZE, y: (9) * this.TILESIZE },    // Point 1
            { x: (9) * this.TILESIZE, y: (9) * this.TILESIZE },   // Point 2
            { x: (9) * this.TILESIZE, y: (15) * this.TILESIZE },   // Point 3
            { x: (17) * this.TILESIZE, y: (15) * this.TILESIZE },   // Point 4
            { x: (17) * this.TILESIZE, y: (3) * this.TILESIZE },  // Point 5
            { x: (25) * this.TILESIZE, y: (3) * this.TILESIZE },  // Point 6
            { x: (25) * this.TILESIZE, y: (15) * this.TILESIZE },  // Point 7
            { x: (33) * this.TILESIZE, y: (15) * this.TILESIZE },  // Point 8
            { x: (33) * this.TILESIZE, y: (9) * this.TILESIZE },   // Point 9
            { x: (40) * this.TILESIZE, y: (9) * this.TILESIZE },   // Point 10
        ];
        
        this.currentPathIndex = 0;

       
        //initialize clothing options
        this.clothingOptions = {
            bodies: [0, 1, 54, 55, 108, 109], //162 and 163 are green
            orcbodies: [162, 163],
            warriorArmor: this.generateWarriorArmorFrames(),
            archerArmor: this.generateArcherArmorFrames(),
            wizardArmor: this.generateWizardArmorFrames(),
            weapons: this.generateWeaponFrames(),
            bows: this.generateBowFrames(),
            staffs: this.generateStaffFrames(),
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
                    switch (this.currentTurret.turret.type) {
                        case 'warrior':
                            this.updateCornCounter(this.shopCosts.warrior); 
                            break;
                        case 'archer':
                            this.updateCornCounter(this.shopCosts.archer); 
                            break;
                        case 'wizard':
                            this.updateCornCounter(this.shopCosts.wizard); 
                            break;
                        default:
                            console.warn("Unknown turret type");
                    }
                    this.currentTurret.destroy();
                    this.currentTurret = null;
                }
                if(this.currentRune != null) {
                    this.currentRune.destroy();
                    this.currentRune = null;
                }
            }
        })

        // functions to create UI
        this.createUI();

        // TO DO
        // this.createHealthBar();
        this.createCornCounter();
    }

    update() {
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
        //WAVE LOGIC
        if (this.isWaveRunning) {
            for(const hero of this.turrets)
            {
                hero.turret.update(this.enemies); // Update each turret's logic
            }
        }

    }


//---------------------------- HELPER FUNCTIONS ----------------------------//


        startWave() {
            if (this.isWaveRunning) return;
            this.isWaveRunning = true;
            if (this.spawnInterval) this.spawnInterval.destroy();
            this.isWaveRunning = true;

            console.log(`Starting Wave ${this.currentWave}`);
    
            const powerPoints = (2 * this.currentWave) + 3;
            const waveType = this.currentWave % 5 || 5;
    
            switch (waveType) {
                case 1: this.spawnWaveType1(powerPoints); break;
                case 2: this.spawnWaveType2(powerPoints); break;
                case 3: this.spawnWaveType3(powerPoints); break;
                case 4: this.spawnWaveType4(powerPoints); break;
                case 5: this.spawnWaveType5(powerPoints); break;
            }
        }

        spawnWaveType1(powerPoints) {
        //Wave 1: .1 PP on 10 creatures
        const ppPerEnemy = Math.max(0.1 * powerPoints / 10, 1);
        this.enemiesInWave = 10;
        
        this.spawnInterval = this.time.addEvent({
            delay: 1200,
            callback: () => {
                this.spawnEnemy(ppPerEnemy);
            },
            callbackScope: this,
            repeat: this.enemiesInWave - 1
        });
        
        //spawn first enemy immediately
        this.spawnEnemy(ppPerEnemy);
        }

    spawnWaveType2(powerPoints) {
        //Wave 2: .25 PP on 2 creatures, .1 PP on 5 creatures
        const strongPP = Math.max(0.25 * powerPoints / 2, 1);
        const weakPP = Math.max(0.1 * powerPoints / 5, 1);
        this.enemiesInWave = 7; // 2 strong + 5 weak
        
        //spawn strong enemies
        this.time.addEvent({
            delay: 1200,
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
                this.spawnEnemy(weakPP); //first weak enemy
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
        //award corn
        this.killedEnemies++;
        if (enemy.stats) {
            console.log(`Enemy defeated! Awarded ${enemy.stats.corn} corn`);
            this.updateCornCounter(enemy.stats.corn); 
        } 
        this.despawnNPC(enemy);
        this.enemies.splice(this.enemies.indexOf(enemy), 1); // Remove from enemies list
        enemy.destroy(); // Destroy the enemy object
    
        if (this.isWaveRunning) {
            this.checkWaveComplete();
        }
    }

    checkWaveComplete() {
    if (this.enemies.length === 0 && this.killedEnemies >= this.enemiesInWave) {
        this.isWaveRunning = false;
        this.waveComplete();
        }
    }

    waveComplete() {
        console.log(`Wave ${this.currentWave} complete!`);
    this.isWaveRunning = false;
    this.killedEnemies = 0; // Reset killed enemies count
    this.enemiesInWave = 0; // Reset enemies in wave count
    
    // Cleanup (spawnInterval might still exist for wave types 2/3/4)
    if (this.spawnInterval) this.spawnInterval.destroy();
    
    this.currentWave++;
    if (this.currentWave % 5 === 1) this.waveSet++;
    
    // Start next wave after delay
    this.time.delayedCall(5000, () => {
        if (!this.isWaveRunning && this.scene) { // Safety checks
            this.startWave();
        }
    }, [], this);
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
                wig: this.add.sprite(0, 0, 'chars', 0).setVisible(false),
                item: this.add.sprite(0, 0, 'chars', 0).setVisible(false) // Turret item sprite
            };
            npc.add(Object.values(npc.sprites));
        }

        //set location and randomize
        switch (type) {
            case 'warrior':
                this.randomizeWarrior(npc);
                break;
            case 'archer':
                this.randomizeArcher(npc);
                break;
            case 'wizard':
                this.randomizeWizard(npc);
                break;
            default:
                this.randomizeNPC(npc);
        }
        npc.setDepth(500); // Ensure turrets are drawn above other sprites
        const turret = new Turret(type, this);
        turret.tileSize = this.TILESIZE; // Set tile size based on scale
        npc.turret = turret;


        //Brief delay before showing to prevent flicker
        this.time.delayedCall(50, () => {
            Object.values(npc.sprites).forEach(sprite => sprite.setVisible(true));
            npc.setVisible(true);
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
        console.log(this.enemies.indexOf(npc));
        
        //reduce corn field health
        this.cornfieldhealth -= npc.stats ? npc.stats.damage : 1;
        console.log("damage " + npc.stats.damage);
        console.log(this.cornfieldhealth);
        
        this.despawnNPC(npc);
        this.enemies.splice(this.enemies.indexOf(npc), 1); // Remove from enemies list
        npc.destroy(); // Destroy the enemy object
        this.checkWaveComplete();
    }

    //mark enemies
    spawnEnemy(powerPoints, isBoss = false, miniBoss = false) {
        const enemy = this.spawnNPC();
        
        //Mark as enemy for wave system
        enemy.isEnemy = true;
        enemy.setScale(1.5);
        
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
        
        //Visual indication for bosses
        if (isBoss) {
            enemy.setScale(2.2); //larger size
        }
        else if (miniBoss) {
            enemy.setScale(1.8); //larger size
        }
        
        //track enemy death
        enemy.takeDamage = (damage) => {
            this.enemyHit(enemy, damage);
        };
        this.enemies.push(enemy);
        return enemy;
    }
    enemyHit(enemy, damage) {
        if (!enemy.isEnemy) return; // Ignore if not an enemy
        
        enemy.stats.health -= damage;
        
        if (enemy.stats.health <= 0) {
            this.enemyDefeated(enemy);
        } else {
            this.flashRed(enemy); // Flash red to indicate damage
            // Optionally, you can add a visual effect or sound here
        }
    }
    flashRed(npc) {
        // Flash the sprite red to indicate damage

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

    /*
        these sections choose the desired frame for the clothing item.
    */
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

    randomizeWarrior(npc) { //wow!
        const {body, drawls, shoes, armor, wig, item} = npc.sprites;
        body.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.bodies));
        drawls.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.drawls));
        shoes.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.shoes));
        armor.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.warriorArmor));
        wig.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.wig));
        //randomize weapon
        item.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.weapons));
        //npc.setScale(Phaser.Math.Between(0, 1) ? -1 : 1, 1);
        npc.setScale(this.TURRET_SCALE)
    }

    randomizeArcher(npc) { //wow!
        const {body, drawls, shoes, armor, wig, item} = npc.sprites;
        body.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.bodies));
        drawls.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.drawls));
        shoes.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.shoes));
        armor.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.archerArmor));
        wig.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.wig));
        //randomize bow
        item.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.bows));
        //npc.setScale(Phaser.Math.Between(0, 1) ? -1 : 1, 1);
        npc.setScale(this.TURRET_SCALE)
    }

    randomizeWizard(npc) { //wow!
        const {body, drawls, shoes, armor, wig, item} = npc.sprites;
        body.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.bodies));
        drawls.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.drawls));
        shoes.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.shoes));
        armor.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.wizardArmor));
        wig.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.wig));
        //randomize staff
        item.setFrame(Phaser.Utils.Array.GetRandom(this.clothingOptions.staffs));
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

    /*
        These generation sections are used to get an array that exclusively holds the frames for the desired clothing item.
    */

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
    generateWarriorArmorFrames() {
        const keyFrames = [];
    
        for (let row = 4; row < 10; row+=5) {
            const rowStart = row * 54;
            for (let col = 6; col <= 17; col++) {
                keyFrames.push(rowStart + col);
            }
        }
    
        return keyFrames;
    }
    generateArcherArmorFrames() {
        const keyFrames = [];
    
        for (let row = 1; row < 10; row+=5) {
            const rowStart = row * 54;
            for (let col = 6; col <= 17; col++) {
                keyFrames.push(rowStart + col);
            }
        }
    
        return keyFrames;
    }
    generateWizardArmorFrames() {
        const keyFrames = [];
    
        for (let row = 2; row < 10; row+=5) {
            const rowStart = row * 54;
            for (let col = 6; col <= 17; col++) {
                if((col - 6) % 4 <= 1) {
                    keyFrames.push(rowStart + col);
                }
            }
        }
    
        return keyFrames;
    }
    generateWeaponFrames() {
        const keyFrames = [];
    
        for (let row = 0; row < 10; row++) {
            const rowStart = row * 54;
            for (let col = 42; col <= 51; col++) {
                if(col <= 46 && row <= 3) continue; // Skip the first 4 rows for weapons, keeping columns 46-51
                keyFrames.push(rowStart + col);
            }
        }
    
        return keyFrames;
    }
    generateBowFrames() {
        const keyFrames = [];
    
        for (let row = 0; row < 5; row++) {
            const rowStart = row * 54;
            for (let col = 52; col <= 53; col++) {
                keyFrames.push(rowStart + col);
            }
        }
    
        return keyFrames;
    }
    generateStaffFrames() {
        const keyFrames = [];
    
        for (let row = 0; row <= 3; row++) {
            const rowStart = row * 54;
            for (let col = 42; col <= 46; col++) {
                keyFrames.push(rowStart + col);
            }
        }
    
        return keyFrames;
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
        Helper function gets a cost from a type
    */
    getCost(type) {
        switch (type) {
            case 'warrior':
                return this.shopCosts.warrior;
            case 'archer':
                return this.shopCosts.archer;
            case 'wizard':
                return this.shopCosts.wizard;
            case 'refresh':
                return this.shopCosts.refresh;
            case 'level1':
                return this.shopCosts.level1;
            case 'level2':
                return this.shopCosts.level2;
            case 'level3':
                return this.shopCosts.level3;
            default:
                console.warn("Unknown turret type");
                return 0;
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
        const tileIndex4 = this.map.getTileAt(tileX, tileY, true, this.uiLayer);

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
                    if (friend.turret.tileX === scaledX && friend.turret.tileY === scaledY)
                    {
                        this.flashRed(hero); // Flash red to indicate tile is occupied
                        return; // Exit if the tile is already occupied
                    }
                }
                //we make sure there is a tile on the first layer, and not the second or third layer
                if (tileIndex && tileIndex2.index == -1 && tileIndex3.index == -1 && tileIndex4.index == -1) { // Check if the tile exists empty
                    this.currentTurret = null; // Clear current hero reference
                    this.modeReset();
                    hero.turret.tileX = scaledX; // Set turret's tile position
                    hero.turret.tileY = scaledY; // Set turret's tile position
                    hero.turret.realX = hero.x; // Set turret's real position
                    hero.turret.realY = hero.y; // Set turret's real position
                    hero.setDepth(1); // Ensure turrets are drawn above other sprites
                    this.turrets.push(hero); // Add turret to the list of placed turrets
                } else {
                    this.flashRed(hero); // Flash red to indicate tile is occupied
                }
            } else {
                for(const friend of this.turrets) {
                    if (friend.turret.tileX === scaledX && friend.turret.tileY === scaledY)
                    {
                        hero.setAlpha(0.5);
                    }
                }
                //we make sure there is a tile on the first layer, and not the second or third layer
                if (tileIndex && tileIndex2.index == -1 && tileIndex3.index == -1 && tileIndex4.index == -1) { // Check if the tile exists empty
                    hero.setAlpha(1);
                } else {
                    hero.setAlpha(0.5);
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
                if(this.turrets.length === 0) {
                    this.flashRed(rune); // Flash red to indicate no turrets available
                    console
                    return; // Exit if no turrets are available
                }
                for(const friend of this.turrets) {
                    if (friend.turret.tileX === scaledX && friend.turret.tileY === scaledY) {
                        let executionResult = friend.turret.addRune(rune);
                        //this is upon success
                        if(executionResult) {
                            this.currentRune = null; // Clear current rune reference
                            this.modeReset(); // Exit rune mode after placing
                            return; // Exit after placing the rune
                        } else {
                            this.flashRed(rune); // Flash red to indicate tile is occupied
                        }
                    } else {
                        this.flashRed(rune); // Flash red to indicate tile is occupied
                    }
                }
            } else {
                let found = false;
                for(const friend of this.turrets) {
                    if (friend.turret.tileX === scaledX && friend.turret.tileY === scaledY) {
                        found = true;
                        let executionResult = friend.turret.ensureSanity(rune.level, rune.type);
                        //this is upon success
                        if(executionResult) {
                            rune.setAlpha(1); // Set rune to semi-transparent
                        } else {
                            rune.setAlpha(0.5); // Reset rune alpha if not valid
                        }
                    }
                }
                if(!found) {
                    rune.setAlpha(0.5); // Reset rune alpha if no turret found
                }
            }
        }
    }

    /*------- Tina's UI Corner -------*/
    createUI() {
        // UI bar background - replace with asset later
        this.uiBar = this.add.sprite(this.map.widthInPixels/2, this.map.heightInPixels/2 + (18 * this.TILESIZE), 'backSprite')
            .setDepth(100)
            .setOrigin(0, 0)
            .setScrollFactor(0);

        // Button spacing settings
        const iconSpacing = 52;
        const startX = this.map.widthInPixels/2 + (8.75 * this.TILESIZE);
        const y = this.map.heightInPixels/2 + (21.5 * this.TILESIZE);

        // Turret types
        const turretTypes = ['warrior', 'archer', 'wizard'];

        // make a button for each turret type
        turretTypes.forEach((type, i) => {
            const iconKey = `${type}Icon`; 
            const x = startX + i * iconSpacing;

            //creating how much each costs
            let cost = this.getCost(type);
            let shopCornText = this.add.text(x - 2, y + 16, `🌽${cost}`, {
                    fontSize: '12px',
                    fill: '#fff',
                    stroke: '#000',
                    strokeThickness: 4,
                }).setScrollFactor(0).setDepth(102).setOrigin(0.5, 0.5);
            
            const button = this.add.image(x, y, iconKey)
                .setDisplaySize(48, 64)  
                .setInteractive()
                .setOrigin(0.5, 0.5)
                .setScrollFactor(0)
                .setDepth(101)
                .on('pointerdown', () => {
                    if(this.corn < cost) {
                        //shake the button if not enough corn
                        this.tweens.add({
                            targets: [button, shopCornText],
                            x: button.x + 5,
                            duration: 100,
                            yoyo: true,
                            ease: 'Back.easeIn',
                            onComplete: () => {
                            }
                        });
                    } else {
                        button.setScale(0.8); // Scale down on click
                        shopCornText.setScale(0.8); // Scale down the corn text
                        this.updateCornCounter(-cost); // Update corn counter with negative value
                        if(this.mode.DEFAULT) {
                            this.currentTurret = this.spawnTurret(type);
                            this.modeReset('PLACE');
                            console.log(`Spawned turret of type: ${type}`);
                        }
                        this.tweens.add({
                            targets: [button, shopCornText],
                            scaleX: 1,
                            scaleY: 1,
                            duration: 150,
                            ease: 'Back.easeOut'
                        });
                    }
                });

        });

    }

    createCornCounter() {
        this.cornText = this.add.text(this.map.widthInPixels/2 + this.TILESIZE, this.map.heightInPixels/2 + this.TILESIZE, `🌽 ${this.corn}`, {
            fontSize: '20px',
            fill: '#fff',
            stroke: '#000',
        strokeThickness: 4,
        shadow: {
            offsetX: 2,
            offsetY: 2,
            color: '#444',
            blur: 2,
            stroke: true
        }}).setScrollFactor(0);
    }

    updateCornCounter(amount = 0) {
        // change font + corn photo later 
        this.corn += amount; // Update corn count
        this.cornText.setText(`🌽 ${this.corn}`);

        // corn jumpscare animation
        this.cornText.setScale(1);
        this.tweens.add({
            targets: this.cornText,
            scaleX: 1.08,
            scaleY: 1.08,
            duration: 80,
            yoyo: true,
            ease: 'Back.easeOut'
        });

        // corn pizazz
        if (amount > 0) {
            const floatText = this.add.text(this.cornText.x + 80, this.cornText.y +20, `+${amount}`, {
                fontSize: '18px',
                fontStyle: 'bold',
                fill: '#ffff66',
                stroke: '#000',
                strokeThickness: 2
            })
            .setScrollFactor(0)
            .setDepth(201)
            .setOrigin(0.5);

            this.tweens.add({
                targets: floatText,
                y: floatText.y - 30,
                alpha: 0,
                duration: 800,
                ease: 'Cubic.easeOut',
                onComplete: () => floatText.destroy()
            });
        }
    }


}