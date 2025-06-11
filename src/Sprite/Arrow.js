class Arrow extends Phaser.GameObjects.Sprite {
    //using an object in contructor to allow for optional parameters
    constructor({scene, x, y, texture = 'arrowTexture', frame = null, damage = 1, enemy = null, flyTime = 200}) {   
        super(scene, x, y, texture, frame);
        this.scene = scene;
        this.damage = damage; // Damage dealt by the arrow
        this.enemy = enemy; // The enemy that the arrow will target
        this.flyTime = flyTime; // Time it takes for the arrow to reach the enemy
        this.setOrigin(0.5, 0.5); // Set the origin to the center of the sprite
        this.setScale(0.025); // Scale down the arrow for better visibility
        //rotation towards the enemy
        this.rotation = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y) + Phaser.Math.DegToRad(90); // Adjusting for the arrow's sprite orientation
        this.scene.add.existing(this);

        this.scene.tweens.add({
            targets: this,
            x: enemy.x,
            y: enemy.y,
            duration: this.flyTime, // Duration of the arrow's flight
            ease: 'Linear',
            onComplete: () => {
                if(enemy && enemy.takeDamage) // Check if enemy exists and has a takeDamage method
                {
                    enemy.takeDamage(this.damage);
                }
                this.destroy(); // Destroy the arrow after it hits the enemy
            }
        });
    }

}