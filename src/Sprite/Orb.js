class Orb extends Phaser.GameObjects.Sprite {
    //using an object in contructor to allow for optional parameters
    constructor({scene, x, y, texture = 'orbTexture', frame = null, damage = 1, enemy = null, flyTime = 300}) {   
        super(scene, x, y, texture, frame);
        this.scene = scene;
        this.damage = damage; // Damage dealt by the orb
        this.enemy = enemy; // The enemy that the orb will target
        this.flyTime = flyTime; // Time it takes for the arrow to reach the enemy
        this.setOrigin(0.5, 0.5); // Set the origin to the center of the sprite
        this.scene.add.existing(this);

        this.scene.tweens.add({
            targets: this,
            x: enemy.x,
            y: enemy.y,
            duration: this.flyTime, // Duration of the orb's flight
            ease: 'Linear',
            onComplete: () => {
                enemy.takeDamage(this.damage);
                this.destroy(); // Destroy the orb after it hits the enemy
            }
        });
    }

}