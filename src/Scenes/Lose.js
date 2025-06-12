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

    // Round Count
    let txt = this.add.bitmapText(width / 2, height / 2 - 150, "pixelFont", 'You made it to round ' + data.wave, 50).setOrigin(0.5);


    // Restart Button
    const playButton = this.add.bitmapText(width / 2, height / 2 - 250, "pixelFont", "Restart", 80)
        .setOrigin(0.5)
        .setInteractive();

    playButton.on('pointerdown', () => {
        this.scene.start('titleScene');
      //location.reload();
    });

    const INITIAL = 100;
    const creditSpacing = 50;
    let i = 0;
    this.add.bitmapText(width / 2, height / 2 + INITIAL + (creditSpacing * i), "pixelFont", 'Programming: Charles Lesser, Athea Reynolds, Tina Huynh', 30).setOrigin(0.5);
    i++;
    this.add.bitmapText(width / 2, height / 2 + INITIAL + (creditSpacing * i), "pixelFont", 'Sound Engineering: Athea Reynolds', 30).setOrigin(0.5);
    i++;
    this.add.bitmapText(width / 2, height / 2 + INITIAL + (creditSpacing * i), "pixelFont", 'Voices: Charles Lesser, Athea Reynolds, Tina Huynh', 30).setOrigin(0.5);
    i++;
    this.add.bitmapText(width / 2, height / 2 + INITIAL + (creditSpacing * i), "pixelFont", 'Sound Effects/Music: Mixkit.com', 30).setOrigin(0.5);
    i++;
    this.add.bitmapText(width / 2, height / 2 + INITIAL + (creditSpacing * i), "pixelFont", 'Art: Kenney Assets', 30).setOrigin(0.5);
    }
}
