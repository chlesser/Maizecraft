class Rune extends Phaser.GameObjects.Sprite {
    constructor(type, level, scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        this.setOrigin(0.5, 0.5);
        this.setScale(0.5);
        this.setDepth(1);
        this.type = type; // Type of rune (e.g., 'cooldown', 'damage', 'range', 'frost')
        this.level = level; // Level of the rune (1, 2, or 3)
        this.selected = false;
        this.makeMeSpecial(); // Set the texture based on type and level
        scene.add.existing(this);
    }
    makeMeSpecial() {
        const concat = this.type + "Rune" + this.level;
        this.setTexture(concat); // Default texture for rune
    }
    Select() {
        this.selected = true;
        this.setTint(0x00ff00); // Change color to indicate selection
    }
    update() {
        
    }
}