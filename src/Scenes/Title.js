class Title extends Phaser.Scene {
  constructor() {
    super('titleScene');
  }

  create() {

    const { width, height } = this.scale;

    // title card background image
    this.add.image(width / 2, height / 2, "titleBg").setDisplaySize(1280, 800);

    // Game title
    this.add.bitmapText(width / 2, height / 2 - 250, "pixelFont", "Maizecraft", 150).setOrigin(0.5);


    // Play Button
    const playButton = this.add.bitmapText(width / 2, height / 2, "pixelFont", "Play", 80)
        .setOrigin(0.5)
        .setInteractive();

    playButton.on('pointerdown', () => {
      this.sound.removeAll();
      this.scene.start('pathfinderScene');
    });

    // Help Button
    const helpButton = this.add.bitmapText(width / 2, height / 2 + 100, "pixelFont", "Help", 80)
        .setOrigin(0.5)
        .setInteractive();

    helpButton.on('pointerdown', () => {
        this.createHelpPopup(this.scale.width / 2, this.scale.height / 2);
    });

    // Settings Button
    const settingsButton = this.add.bitmapText(width / 2, height / 2 + 200, "pixelFont", "Settings", 80)
        .setOrigin(0.5)
        .setInteractive();

    settingsButton.on('pointerdown', () => {
      this.createSettingsPopup(width / 2, height / 2);
    });

    this.lobby = this.sound.add('ambiance', {loop: false,volume: .07  });
    this.lobby.play();

    }

    createSettingsPopup(x, y) {
        const { width, height } = this.scale;

        // blocks input within menu 
        const blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.001)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(100); 

        // container for popup 
        const popup = this.add.container(x, y).setDepth(1002);

        const bg = this.add.rectangle(0, 0, 400, 300, 0x000000, 0.8)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);

        const label = this.add.bitmapText(0, -120, 'pixelFont', 'Volume', 32).setOrigin(0.5);

        const close = this.add.bitmapText(0, 120, 'pixelFont', 'Close', 32)
            .setOrigin(0.5)
            .setInteractive();

        close.on('pointerdown', () => {
            popup.destroy();
            blocker.destroy();
        });

        popup.add([bg, label, close]);

        // add audio adjuster
    }

    createHelpPopup(x, y) {
        const { width, height } = this.scale;

        const blocker = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.001)
            .setInteractive()
            .setScrollFactor(0)
            .setDepth(100);

        const popup = this.add.container(x, y).setDepth(100);

        const bg = this.add.rectangle(0, 0, 500, 320, 0x000000, 0.8)
            .setOrigin(0.5)
            .setStrokeStyle(2, 0xffffff);

        const title = this.add.bitmapText(0, -120, 'pixelFont', 'How to Play', 40).setOrigin(0.5);

        const bodyText = this.add.bitmapText(0, -20, 'pixelFont',
            "Place turrets to stop waves of\n" +
            "enemies and protect your corn farm.\n",
            24
        ).setOrigin(0.5);

        const close = this.add.bitmapText(0, 120, 'pixelFont', 'Close', 32)
            .setOrigin(0.5)
            .setInteractive();

        close.on('pointerdown', () => {
            popup.destroy();
            blocker.destroy();
        });

        popup.add([bg, title, bodyText, close]);
    }
    
}
