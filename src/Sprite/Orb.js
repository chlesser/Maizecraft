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

        this.vfx = {};
        this.vfx.trail = this.scene.add.particles(0, 0, 'wiz', {
            scale: { start: .05, end: 0 },
            lifespan: 100,
            speed: 20,
            blendMode: 'ADD',
        }).setDepth(1000);

        this.vfx.trail.startFollow(this); // Make particles follow the orb
        this.vfx.trail.start();


        this.scene.tweens.add({
            targets: this,
            x: enemy.x,
            y: enemy.y,
            duration: this.flyTime, // Duration of the orb's flight
            ease: 'Linear',
            onComplete: () => {
                if(enemy && enemy.takeDamage) // Check if enemy exists and has a takeDamage method
                {
                    enemy.takeDamage(this.damage);
                }
                this.vfx.trail.stop();
                this.destroy(); // Destroy the arrow after it hits the enemy
            }
        });

    }

}