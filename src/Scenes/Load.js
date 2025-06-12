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

        //load rune sprites
        //default rune
        this.load.image("defaultRune", "Runes/Grey/Rectangle-(outline)/runeGrey_rectangleOutline_036.png");
        // LEVEL 1 RUNES 
        this.load.setPath("./assets/Runes/Grey/Rectangle-(outline)/");
        this.load.image("cooldownRune1", "runeGrey_rectangleOutline_033.png");
        this.load.image("damageRune1", "runeGrey_rectangleOutline_027.png");
        this.load.image("rangeRune1", "runeGrey_rectangleOutline_003.png");
        this.load.image("fireRune1", "runeGrey_rectangleOutline_014.png");
        this.load.image("frostRune1", "runeGrey_rectangleOutline_023.png");
        // LEVEL 2 RUNES
        this.load.setPath("./assets/Runes/Blue/Rectangle-(outline)/");
        this.load.image("cooldownRune2", "runeBlue_rectangleOutline_032.png");
        this.load.image("damageRune2", "runeBlue_rectangleOutline_026.png");
        this.load.image("rangeRune2", "runeBlue_rectangleOutline_002.png");
        this.load.image("fireRune2", "runeBlue_rectangleOutline_013.png");
        this.load.image("frostRune2", "runeBlue_rectangleOutline_022.png");
        // LEVEL 3 RUNES
        this.load.setPath("./assets/Runes/Black/Rectangle-(outline)/");
        this.load.image("cooldownRune3", "runeBlack_rectangleOutline_033.png");
        this.load.image("damageRune3", "runeBlack_rectangleOutline_027.png");
        this.load.image("rangeRune3", "runeBlack_rectangleOutline_003.png");
        this.load.image("fireRune3", "runeBlack_rectangleOutline_014.png");
        this.load.image("frostRune3", "runeBlack_rectangleOutline_023.png");

        // load in UI assets
        // TEMP TIL I GET ACTUAL ICONS
        this.load.setPath("./assets/UI/");
        this.load.image('archerIcon', 'bowEditAttempt.png');
        this.load.image('warriorIcon', 'swordEditAttempt.png');
        this.load.image('wizardIcon', 'eyeEditAttempt.png');
        this.load.image('runeBackground', 'EmptyBack.png');
        this.load.image('buttonBackground', 'buttonBack.png');
        this.load.image('refreshIcon', 'refreshIcon.png');
        this.load.image('range', 'RangeSample.png');
        this.load.image('backSprite', 'back.png')

        // beautiful new fancy font
        this.load.bitmapFont("pixelFont", "font.png", "font.fnt");
        // title card background image
        this.load.image("titleBg", "TitleBg.png");

        //fix path
        this.load.setPath("./assets/");

        //My beautiful projectiles
        this.load.image("arrowTexture", "Projectiles/Arrow.png");
        this.load.image("orbTexture", "Projectiles/orb.png");


        //my more beautiful particles
        this.load.image("sparkle", "kenney_particle-pack/star_06.png");
        this.load.image("s2", "kenney_particle-pack/twirl_02.png");
        this.load.image("wiz", "kenney_particle-pack/spark_01.png");

        //sounds ;_;
        this.load.setPath("./assets/audioassets");

        //warrior
        this.load.audio('w1', 'gruff-mysword.wav');
        this.load.audio('w2', 'gruff-notmycob.wav');
        this.load.audio('w3', 'kid-realmengotowar.wav');
        this.load.audio('w4', 'kid-imissmymom.wav');
        this.load.audio('w5', 'gruff-nice.wav');
        this.load.audio('w6', 'kid-alright.wav');

        //archer
        this.load.audio('a1', 'mario-pierced.wav');
        this.load.audio('a2', 'mario-stickya.wav');
        this.load.audio('a3', 'irish-pierced.wav');
        this.load.audio('a4', 'irish-stickya.wav');
        this.load.audio('a5', 'mario-yahoo.wav');
        this.load.audio('a6', 'irish-incredible.wav');

        //wizard
        this.load.audio('m1', 'senile-sharethecorn.wav');
        this.load.audio('m2', 'senile-takealive.wav');
        this.load.audio('m3', 'nerd-sharecorn.wav');
        this.load.audio('m4', 'nerd-takealive.wav');
        this.load.audio('m5', 'loseapixel.wav');
        this.load.audio('m6', 'didyourmomdressyou.wav');
        this.load.audio('m7', 'senile-gibberish.wav');
        this.load.audio('m8', 'nerd-magicmike.wav');
        this.load.audio('m9', 'eww.wav');

        //orc
        this.load.audio('o1', 'godfather-eughh.wav');
        this.load.audio('o2', 'godfather-offer.wav');
        this.load.audio('o3', 'godfather-ouch.wav');
        this.load.audio('o4', 'godfather-owie.wav');
        this.load.audio('o5', 'godfathertakecorn.wav');
        this.load.audio('o6', 'orc-grunt1.wav');
        this.load.audio('o7', 'orc-grunt2.wav');
        this.load.audio('o8', 'orc-grunt3.wav');
        this.load.audio('o9', 'orc-dying.wav');

        //bg
        this.load.audio('ambiance', 'ambiance.mp3');

        //sound effects
        this.load.audio('a', 'arrow.mp3');
        this.load.audio('wi', 'magic.mp3');
        this.load.audio('wa', 'swipe.mp3');

    }

    create() {
        this.scene.start("titleScene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}