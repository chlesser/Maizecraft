class Turret {
    constructor(type) {
        //basestats
        this.baseDamage = 1;
        this.baseRange = 1;
        this.baseCooldown = 1000; // in milliseconds
        this.type = type;


        //current stats
        this.currentDamage = this.baseDamage;
        this.currentRange = this.baseRange;
        this.currentCooldown = this.baseCooldown;

        //status effects
        this.fireStack = 0;
        this.frostStack = 0;

        //engine calculations
        this.lastShotTime = 0;  //to track when the last shot was fired
        this.tileX = 0; // Tile X position
        this.tileY = 0; // Tile Y position

        //rune information
        this.runeCount = 0; // Total number of runes
        this.runes = {
            cooldown: 0,
            damage: 0,
            range: 0,
            fire: 0,
            frost: 0
        }
        this.upgradePotential = false; //this is strictly used for the sanity check, to allow for the caveat of adding a higher level rune than the current one. 

        //update stats based on type using function below
        this.updateStatsByType();
    }

    update() {
        // Update logic for the turret can be added here
        this.searchForEnemy();
    }
    searchForEnemy() {
        // Logic to search for enemies in front of the turret
        // This could involve checking the direction the turret is facing
        // and detecting if any enemies are within a certain range.
        console.log("Searching for enemies in front of the turret...");
    }
    updateStatsByType() {
        // Update turret stats based on its type
        switch (this.type) {
            case 'warrior':
                this.baseDamage = 5;
                this.baseRange = 3;
                this.baseCooldown = 1500;
                break;
            case 'archer':
                this.baseDamage = 2;
                this.baseRange = 20;
                this.baseCooldown = 800;
                break;
            case 'wizard':
                this.baseDamage = 15;
                this.baseRange = 10;
                this.baseCooldown = 4000;
                break;
            default:
                console.warn('Unknown turret type:', this.type);
        }
        // Update current stats based on base stats
        this.currentDamage = this.baseDamage;
        this.currentRange = this.baseRange;
        this.currentCooldown = this.baseCooldown;
    }
    /*
        This section is for adding runes to the turret.
            The first step is to ensure a sane level, and that the rune count is not exceeded.
            The second step is to update the current stats based on the rune type.
    */
    addRune(level, runeType) {
        console.log(`Attempting to add ${runeType} rune of level ${level} to turret of type ${this.type}`);
        if(this.runes[runeType] < level && this.runes[runeType] > 0) {
            this.upgradePotential = true; // Allow for higher level rune to be added
        }
        if(!this.ensureSanity(level)) {
            return;
        }

        //because we are upgrading, we do not increment runeCount
        if(this.upgradePotential) {
            this.upgradePotential = false; // Reset after use
        } else {
            this.runeCount++; // Increment rune count only if not upgrading
        }
        switch (runeType) {
            case 'cooldown':
                this.addCooldownRune(level);
                break;
            case 'damage':
                this.addDamageRune(level);
                break;
            case 'range':
                this.addRangeRune(level);
                break;
            case 'fire':
                this.addFireRune(level);
                break;
            case 'frost':
                this.addFrostRune(level);
                break;
            default:
                console.error('Unknown rune type:', runeType);
        }
        
        console.log(`Added ${runeType} rune of level ${level}. Current rune count: ${this.runeCount}`);
    }
    addCooldownRune(level) {
        if(level <= this.runes.cooldown) {
            console.error('No use in adding this.');
            this.runeCount--; // Decrement rune count if no upgrade is made
            return;
        }
        this.runes.cooldown = level;
        switch (level) {
            case 1:
                this.currentCooldown = this.baseCooldown * .75;
                break;
            case 2:
                this.currentCooldown = this.baseCooldown * .50;
                break;
            case 3:
                this.currentCooldown = this.baseCooldown * .25;
                break;
            default:
                console.error('Invalid cooldown rune level. Must be between 1 and 3.');
        }
    }
    addDamageRune(level) {
        if(level <= this.runes.damage) {
            console.error('No use in adding this.');
            this.runeCount--; // Decrement rune count if no upgrade is made
            return;
        }
        this.runes.damage = level;
        switch (level) {
            case 1:
                this.currentDamage = this.baseDamage * 2.5;
                break;
            case 2:
                this.currentDamage = this.baseDamage * 5;
                break;
            case 3:
                this.currentDamage = this.baseDamage * 10;
                break;
            default:
                console.error('Invalid cooldown rune level. Must be between 1 and 3.');
        }
    }
    addRangeRune(level) {
        if(level <= this.runes.range) {
            console.error('No use in adding this.');
            this.runeCount--; // Decrement rune count if no upgrade is made
            return;
        }
        this.runes.range = level;
        switch (level) {
            case 1:
                this.currentRange = this.baseRange * 1.5;
                break;
            case 2:
                this.currentRange = this.baseRange * 3;
                break;
            case 3:
                this.currentRange = this.baseRange * 6;
                break;
            default:
                console.error('Invalid cooldown rune level. Must be between 1 and 3.');
        }
    }
    addFireRune(level) {
        if(level <= this.runes.fire) {
            console.error('No use in adding this.');
            this.runeCount--; // Decrement rune count if no upgrade is made
            return;
        }
        this.runes.fire = level;
        this.fireStack = level;
    }
    addFrostRune(level) {
        if(level <= this.runes.frost) {
            console.error('No use in adding this.');
            this.runeCount--; // Decrement rune count if no upgrade is made
            return;
        }
        this.runes.frost = level;
        this.frostStack = level;
    }
    //This function returns a boolean indicating whether the rune was successfully added
    ensureSanity(level) {
        const MAXRUNES = 3;
        const MAXLEVEL = 3;
        const MINLEVEL = 1;

        //First, ensure that the level is valid and that the rune count does not exceed the maximum allowed
        if (level < MINLEVEL || level > MAXLEVEL) {
            console.error('Invalid rune level. Must be between 1 and 3.');
            return false;
        }
        //Secondly, ensure that the rune count does not exceed the maximum allowed
        if (this.runeCount >= MAXRUNES && !this.upgradePotential) {
            console.error('Maximum rune count exceeded. Cannot add more runes.');
            return false;
        }
        return true;
    }
}