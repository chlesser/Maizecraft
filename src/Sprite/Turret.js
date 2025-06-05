class Turret {
    constructor(type) {
        //stats
        this.damage = 1;
        this.range = 1;
        this.cooldown = 1000; // in milliseconds
        this.lastShotTime = 0;  //to track when the last shot was fired
        this.type = type;

        //update stats based on type using function below
        this.updateStatsByType();

        //rune information
        this.runeCount = 0;
        this.runes = {
            cooldown: 0,
            damage: 0,
            range: 0,
            fire: 0,
            frost: 0
        }
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
                this.damage = 5;
                this.range = 3;
                this.cooldown = 1500;
                break;
            case 'archer':
                this.damage = 2;
                this.range = 20;
                this.cooldown = 800;
                break;
            case 'wizard':
                this.damage = 15;
                this.range = 10;
                this.cooldown = 4000;
                break;
            default:
                console.warn('Unknown turret type:', this.type);
        }
    }
}