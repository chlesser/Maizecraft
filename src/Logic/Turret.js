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
        this.tileSize = 16;
        this.tileX = 0; // Tile X position
        this.tileY = 0; // Tile Y position
        this.realX = 0; // Real X position
        this.realY = 0; // Real Y position

        //rune information
        this.runeCount = 0; // Total number of runes
        this.runes = {
            cooldown: 0,
            damage: 0,
            range: 0,
            fire: 0,
            frost: 0
        }
        this.runeSprites = [];
        this.upgradePotential = false; //this is strictly used for the sanity check, to allow for the caveat of adding a higher level rune than the current one. 

        //update stats based on type using function below
        this.updateStatsByType();
    }

    //search for the closest enemy within range and attack... this differs between turret types
    update(enemies) {
        const now = Date.now();
        console.log("date now: ", now);
        const timeSinceLastShot = now - this.lastShotTime;
        if (timeSinceLastShot < this.currentCooldown) {
            return; // Still in cooldown, do not attack
        }
        this.lastShotTime = now;

        // Update logic for the turret can be added here
        switch (this.type) {
            case 'warrior':
                this.updateWarrior(enemies);
                break;
            case 'archer':
                this.updateArcher(enemies);
                break;
            case 'wizard':
                this.updateWizard(enemies);
                break;
            default:
                console.warn('Unknown turret type:', this.type);
        }
        this.searchForEnemy(enemies);
    }

    //class updates
    updateWarrior(enemies) {
        // Warrior turret logic
        let enemiesInRange = this.withinRange(enemies);
        if(enemiesInRange.length > 0) {
            for(let enemy of enemiesInRange) {
                enemy.takeDamage(this.currentDamage); // Deal damage to the enemy
            }
        }
    }
    updateArcher(enemies) {
        // Archer turret logic
        let enemy = this.searchForEnemy(enemies);
        if(enemy != null) {
            enemy.takeDamage(this.currentDamage); // Deal damage to the enemy
        }
    }
    updateWizard(enemies) {
        // Wizard turret logic
        let enemy = this.searchForEnemy(enemies);
        if(enemy != null) {
            enemy.takeDamage(this.currentDamage); // Deal damage to the enemy
        }
    }
    /*
        Search For Enemy finds the closest enemy within range
        WithinRange finds all enemies within range
    */
    searchForEnemy(enemies) {
        let closest = null;
        let closestIndex = Infinity; // Initialize closest distance to a large value
        for(const enemy of enemies) {
            //make sure we dont go off the map
            if(enemy.x < 0 || enemy.x > this.tileSize * 40) {
                continue; // Skip enemies that are out of bounds
            }
            let distance = Phaser.Math.Distance.Between(this.realX, this.realY, enemy.x, enemy.y);
            distance /= this.tileSize; // Scale distance by tile size
            if(distance < this.currentRange && enemies.indexOf(enemy) <= closestIndex) {
                closestIndex = enemies.indexOf(enemy);
                closest = enemy; // Update closest enemy
            }
        }
        return closest;
    }
    withinRange(enemies) {
        let closest = [];
        for(const enemy of enemies) {
            //make sure we dont go off the map
            if(enemy.x < 0 || enemy.x > this.tileSize * 40) {
                continue; // Skip enemies that are out of bounds
            }
            let distance = Phaser.Math.Distance.Between(this.realX, this.realY, enemy.x, enemy.y);
            distance /= this.tileSize; // Scale distance by tile size
            if(distance < this.currentRange) {
                closest.push(enemy); // Add enemy to the list of enemies within range
            }
        }
        return closest; // Return the list of enemies within range
    }


    //this is an initialization function that sets the base stats based on the turret type
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
            Returns success or failure.
    */
    addRune(incomingRune) {
        const level = incomingRune.level;
        const runeType = incomingRune.type;
        console.log(`Attempting to add ${runeType} rune of level ${level} to turret of type ${this.type}`);
        if(!this.ensureSanity(level, runeType)) {
            return false;
        }

        //because we are upgrading, we do not increment runeCount
        if(!this.upgradePotential) {
            this.runeCount++; // Increment rune count only if not upgrading
        }
        switch (runeType) {
            case 'cooldown':
                return this.addCooldownRune(level, incomingRune);
            case 'damage':
                return this.addDamageRune(level, incomingRune);
            case 'range':
                return this.addRangeRune(level, incomingRune);
            case 'fire':
                return this.addFireRune(level, incomingRune);
            case 'frost':
                return this.addFrostRune(level, incomingRune);
            default:
                console.log('Unknown rune type:', runeType);
                return false;
        }
    }
    addCooldownRune(level, incomingRune) {
        this.runes.cooldown = level;
        this.addVisualRune(incomingRune); // Add the visual rune to the turret
        switch (level) {
            case 1:
                this.currentCooldown = this.baseCooldown * .75;
                return true;
            case 2:
                this.currentCooldown = this.baseCooldown * .50;
                return true;
            case 3:
                this.currentCooldown = this.baseCooldown * .25;
                return true;
            default:
                console.log('Invalid cooldown rune level. Must be between 1 and 3.');
                return false;
        }
    }
    addDamageRune(level, incomingRune) {
        this.runes.damage = level;
        this.addVisualRune(incomingRune); // Add the visual rune to the turret
        switch (level) {
            case 1:
                this.currentDamage = this.baseDamage * 2.5;
                return true;
            case 2:
                this.currentDamage = this.baseDamage * 5;
                return true;
            case 3:
                this.currentDamage = this.baseDamage * 10;
                return true;
            default:
                console.log('Invalid cooldown rune level. Must be between 1 and 3.');
                return false;
        }
    }
    addRangeRune(level, incomingRune) {
        this.runes.range = level;
        this.addVisualRune(incomingRune); // Add the visual rune to the turret
        switch (level) {
            case 1:
                this.currentRange = this.baseRange * 1.5;
                return true;
            case 2:
                this.currentRange = this.baseRange * 3;
                return true;
            case 3:
                this.currentRange = this.baseRange * 6;
                return true;
            default:
                console.log('Invalid cooldown rune level. Must be between 1 and 3.');
                return false;
        }
    }
    addFireRune(level, incomingRune) {
        this.runes.fire = level;
        this.fireStack = level;
        this.addVisualRune(incomingRune); // Add the visual rune to the turret
        return true;
    }
    addFrostRune(level, incomingRune) {
        this.runes.frost = level;
        this.frostStack = level;
        this.addVisualRune(incomingRune); // Add the visual rune to the turret
        return true;
    }


    //This function returns a boolean indicating whether the rune can be added or not.
    ensureSanity(level, runeType) {
        const MAXRUNES = 3;
        const MAXLEVEL = 3;
        const MINLEVEL = 1;

        //First, ensure that the level is valid and that the rune count does not exceed the maximum allowed
        if (level < MINLEVEL || level > MAXLEVEL) {
            //console.log('Invalid rune level. Must be between 1 and 3.');
            return false;
        }
        let foundLevel = 0;
        for(const [key, value] of Object.entries(this.runes)) {
            if(key === runeType) {
                foundLevel = value; // Get the current level of the rune type
                break; // Exit the loop once we find the rune type
            }
        }
        if(foundLevel < level && foundLevel > 0) {
            this.upgradePotential = true; // Allow for higher level rune to be added
        } else if (foundLevel >= level) {
            // If the rune type already exists at a higher or equal level, we do not allow adding it again
            //console.log('Rune of this type already exists at a higher or equal level.');
            return false;
        }
        else {
            //If it is not a duplicate, we check the rune count
            if (this.runeCount >= MAXRUNES && !this.upgradePotential) {
            //console.log('Maximum rune count exceeded. Cannot add more runes.');
            return false;
            }
        }
        
        return true;
    }
    //returns null, calls the offset updater
    addVisualRune(rune) {
        // Add a visual representation of the rune to the turret
        // and adding it to the turret's display.
        if(this.upgradePotential) // If we are upgrading, we replace the existing rune sprite
        {
            for(const existingRune of this.runeSprites) {
                if(existingRune.type === rune.type) {
                    this.runeSprites.splice(this.runeSprites.indexOf(existingRune), 1); // Remove the existing rune sprite
                    existingRune.destroy(); // Destroy the existing rune sprite
                    break; // Exit the loop after removing the existing rune
                }
            }
            this.upgradePotential = false; // Reset after use
        }
        rune.setScale(0.15);
        this.runeSprites.push(rune); // Add the new rune sprite to the turret's rune sprites
        // Calculate the offset position based on where it is in the array
        this.updateRuneOffsets(); // Update the positions of the rune sprites
    }
    updateRuneOffsets() {
        // Update the positions of the rune sprites based on their index
        const offsetX = 15; // Horizontal offset for rune sprites
        const offsetY = 15; // Vertical offset for rune sprites
        this.runeSprites.forEach((rune, index) => {
            rune.setPosition(this.realX + ((index - 1) * offsetX), this.realY + offsetY);
        });
    }
}