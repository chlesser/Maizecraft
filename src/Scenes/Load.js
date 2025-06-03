class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");


        //load as sprite sheet to index randomly later...
        this.load.spritesheet("chars", "roguelikeChar_transparent.png", {
            frameWidth: 17,
            frameHeight: 17
        });

        /* TEMPORARY UNTIL WE GET ACTUAL MAP
        this.load.image("tilemap_tiles", "tilemap_packed.png");                   // Packed tilemap
        this.load.tilemapTiledJSON("three-farmhouses", "three-farmhouses.tmj");   // Tilemap in JSON
        */
       // load game map
        this.load.image("tilemap_tiles", "roguelikeSheet_transparent.png");
        this.load.tilemapTiledJSON("maizecraft-map", "maizecraft-map.tmj");


    }

    create() {
        this.scene.start("pathfinderScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}