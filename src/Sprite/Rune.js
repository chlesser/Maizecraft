class Rune extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y, texture, frame) {
        super(scene, x, y, texture, frame);
        this.setOrigin(0.5, 0.5);
        this.setScale(0.5);
        this.setDepth(1);
        scene.add.existing(this);
    }

    update() {
        // Update logic for the rune can be added here
    }
}