class Lose extends Phaser.Scene {
  constructor() {
    super('loseScene');
  }
  create() {

  }

  init(data) {

    const { width, height } = this.scale;

    // title card background image
    this.add.image(width / 2, height / 2, "theend").setDisplaySize(1280, 800);

    // Game title
    let txt = this.add.bitmapText(width / 2, height / 2 - 150, "pixelFont", 'You made it to round ' + data.wave, 50).setOrigin(0.5);


    // Play Button
    const playButton = this.add.bitmapText(width / 2, height / 2 - 250, "pixelFont", "Restart", 80)
        .setOrigin(0.5)
        .setInteractive();

    playButton.on('pointerdown', () => {
      this.scene.start('titleScene');
    });
    }
    
}
