let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },

    // 40 x 25 tiles, 16px tiles
    width: 1280,
    height: 800,
    scene: [Load, Pathfinder]
}

var cursors;
const SCALE = 2.0;
var my = {sprite: {}};

const game = new Phaser.Game(config);