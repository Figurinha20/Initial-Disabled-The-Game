let renderer = null,
    scene = null,
    camera1 = null,
    camera2 = null,
    car; // The three.js object that represents the model

let track, stadium, plane, checkpointObj;

//textures
let texTrack = new THREE.TextureLoader().load("./images/texTrack.png");
let texMarbleStadium = new THREE.TextureLoader().load("./images/texture.JPG");
let loaderCar = new THREE.OBJLoader();
let loaderCarMaterial = new THREE.MaterialLoader();

let laps = 0;
let activeCheckpoint = 0;
let collision = false;
let text, screenText;
let a = new THREE.Vector3(0, 0, 0)

let raycaster = new THREE.Raycaster();
let fontLoader = new THREE.FontLoader();
let rayDirection = new THREE.Vector3(0, -1, 0);
let intersects;

let camera1isActive = true;

//colisões?
let BBox;
let BBox2;

window.onload = function init() {
    // Create the Three.js renderer
    renderer = new THREE.WebGLRenderer();
    // Set the viewport
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor("#AAAAAA");
    document.body.appendChild(renderer.domElement);

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Adicionar background
    //background
    scene.background = new THREE.CubeTextureLoader()
        .setPath('./cube/')
        .load([
            'px.png',
            'nx.png',
            'py.png',
            'ny.png',
            'pz.png',
            'nz.png'
        ]);

    // Add TWO cameras 
    camera1 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 5000);
    camera1.position.y = 160;
    camera1.position.z = 200;
    camera1.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera1);

    camera2 = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera2.position.y = 160;
    camera2.position.z = 400;
    camera2.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera2);

    // Lights

    //directional light
    let moonlight = new THREE.DirectionalLight("#e1fafc", 0.3);
    moonlight.castShadow = true;
    scene.add(moonlight);


    let spotLightRight = new THREE.SpotLight(0xffffff, 0.8, 800, Math.PI / 2, 0.3, 0.5);
    spotLightRight.position.set(500, 200, 200);

    spotLightRight.castShadow = false;

    let spotLightLeft = new THREE.SpotLight(0xffffff, 0.8, 800, -Math.PI / 2, 0.3, 0.5);
    spotLightLeft.position.set(-500, 200, 200);

    spotLightLeft.castShadow = false;

    let spotLight = new THREE.SpotLight(0xffffff, 1, 1500, Math.PI / 16, 0.9, 0.3);
    spotLight.position.set(0, 500, 200);
    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 400;
    spotLight.shadow.mapSize.height = 400;

    spotLight.castShadow = false;

    scene.add(spotLightRight);
    scene.add(spotLightLeft);
    scene.add(spotLight);

    //Shadows
    renderer.shadowMap.enabled = true;

    //let material = new THREE.MeshBasicMaterial( {color: "#33cc0c", side: THREE.DoubleSide} );
    let texture = new THREE.TextureLoader().load("./images/grass.jpg");
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(200, 200);

    let material = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide
    })

    //floor
    let geometry = new THREE.PlaneGeometry(9000, 9000, 0);
    plane = new THREE.Mesh(geometry, material);

    plane.receiveShadow = true;

    plane.rotation.set(3 * Math.PI / 2, 0, 0);
    plane.position.set(0, -1, 0);
    scene.add(plane);




    //add Track
    let loader = new THREE.ObjectLoader();



    loader.load(
        // resource URL
        "models/track.json",

        // onLoad callback
        // Here the loaded data is assumed to be an object
        function (object) {
            track = object;
            track.receiveShadow = true;

            // Add the loaded object to the scene
            scene.add(track);
            track.scale.set(140, 140, 140)

        },

        // onProgress callback
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },

        // onError callback
        function (err) {
            console.error('An error happened');
        }
    );

    //add TV

    loader.load(
        // resource URL
        "models/tv.json",

        // onLoad callback
        // Here the loaded data is assumed to be an object
        function (object) {
            tv = object;

            tv.scale.set(140, 140, 140);
            tv.position.set(0, 140, -740);

            // Add the loaded object to the scene
            scene.add(tv);

        },

        // onProgress callback
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },

        // onError callback
        function (err) {
            console.error('An error happened');
        }
    );

    loader.load(
        // resource URL
        "models/stadium.json",

        // onLoad callback
        // Here the loaded data is assumed to be an object
        function (object) {
            stadium = object;
            // Add the loaded object to the scene

            stadium.scale.set(180, 100, 180);
            stadium.position.set(0, -100, 0);
            scene.add(stadium);
        },

        // onProgress callback
        function (xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },

        // onError callback
        function (err) {
            console.error('An error happened');
        }
    );


    // load a resource
    loaderCar.load(
        // resource URL
        './models/quickieTHREE.obj',
        // called when resource is loaded
        function (object) {
            car = object;
            car.scale.set(0.12, 0.12, 0.12);
            car.receiveShadow = true;
            car.castShadow = true;

            car.children[9].material.side = THREE.DoubleSide; //para aparecer a parte de trás da cadeira e a parte de dentro das rodas
            car.children[10].material[0].side = THREE.DoubleSide;
            car.children[11].material[0].side = THREE.DoubleSide;

            //dar cor aos materiais
            car.children[4].material[0].color = {
                r: 0,
                g: 0,
                b: 0
            };
            car.children[4].material[1].color = {
                r: 48,
                g: 49,
                b: 51
            };

            car.children[5].material[1].color = {
                r: 0,
                g: 0,
                b: 0
            };

            car.children[6].material[0].color = {
                r: 52,
                g: 95,
                b: 156
            };
            car.children[6].material[1].color = {
                r: 0,
                g: 0,
                b: 0
            };

            car.children[7].material[2].color = {
                r: 0,
                g: 0,
                b: 0
            };

            car.children[8].material[0].color = {
                r: 0,
                g: 0,
                b: 0
            };

            car.children[9].material.color = {
                r: 0,
                g: 0,
                b: 0
            };

            car.children[10].material[1].color = {
                r: 0,
                g: 0,
                b: 0
            };

            car.children[11].material[1].color = {
                r: 0,
                g: 0,
                b: 0
            };

            car.children[12].material.color = {
                r: 0,
                g: 0,
                b: 0
            };

            //mudar a posição das rodas para poder rodar no seu centro
            car.children[10].position.y += 30
            car.children[10].position.z -= 30

            car.children[11].position.y += 18
            car.children[11].position.z += 58

            car.children[10].geometry.center();
            car.children[11].geometry.center();

            car.position.z = 100;
            
            scene.add(car);
            spotLight.target = car;


            console.log(car)
        },
        // called when loading is in progresses
        function (xhr) {

            console.log((xhr.loaded / xhr.total * 100) + '% loaded');

        },
        // called when loading has errors
        function (error) {

            console.log('An error happened');

        }
    );


    //Escrever texto inicial
    fontLoader.load('./fonts/Hemi Head Rg_Bold Italic.json', function (font) {

        text = new THREE.TextGeometry(`Laps ${laps}/3`, {
            font: font,
            size: 29,
            height: 3,
            curveSegments: 12,
        });

        let textMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00
        });
        screenText = new THREE.Mesh(text, textMaterial);
        scene.add(screenText);
        screenText.position.x = -90
        screenText.position.y = 126;
        screenText.position.z = -690;
    });

    // let controls = new THREE.OrbitControls(camera);
    // controls.addEventListener('change', function () { renderer.render(scene, camera); });


    // Run the run loop
    render();
}

// car position
let pos = new THREE.Vector3(0, 0, 0);
// car angle: by default, the car is facing +Z direction
// so, add a rotation of PI to make the car facing -Z direction

let angle = -Math.PI/2;
let speed = 0;

function render() {
    if (car != undefined) {

        // sets the toycar object with the updated position
        //car.position.set(pos.x, pos.y, pos.z);

        //Colisoes usando RayCaster
        let origin = car.position.clone();
        origin.y += 5;
        raycaster.set(origin, rayDirection);

        //reset de intersects
        intersects = [];
        // calculate objects intersecting the picking ray
        intersects = raycaster.intersectObjects(track.children, true);

        // rotates the car by angle radians
        car.rotation.y = angle;

        manageMovement();

        //atrito
        atrition();


        //atualização da posição
        car.position.x += speed * Math.sin(angle);
        car.position.z += speed * Math.cos(angle);

        //colisão com coliseu
        if (car.position.z >= 610 || car.position.z <= -610 || car.position.x >= 720 || car.position.x <= -720) {
            car.position.x -= speed * 3 * Math.sin(angle);
            car.position.z -= speed * 3 * Math.cos(angle);
            speed *= -0.2;
        }

        //Checkpoint e Laps | 3 Laps = Win | 4 Checkpoints = 1 Lap

        //update camera 2
        let relativeCameraOffset = new THREE.Vector3(0, 250, -500);
        let cameraOffset = relativeCameraOffset.applyMatrix4(car.matrixWorld);
        camera2.position.copy(cameraOffset);
        camera2.lookAt(car.position);
        //update camera 1
        camera1.lookAt(car.position);


        createCheckpoint(activeCheckpoint);
        checkCheckpointColision();
    }


    if (camera1isActive) {
        renderer.render(scene, camera1);
    } else {
        renderer.render(scene, camera2);
    }
    requestAnimationFrame(render);
}

let keysPressed = {
    arrowUp: false,
    arrowDown: false,
    arrowLeft: false,
    arrowRight: false
};

document.addEventListener('keyup', (e) => {
    switch (e.key) {
        case 'ArrowUp':
            keysPressed.arrowUp = false;
            break;
        case 'ArrowDown':
            keysPressed.arrowDown = false;
            break;
        case 'ArrowLeft':
            keysPressed.arrowLeft = false;
            break;
        case 'ArrowRight':
            keysPressed.arrowRight = false;
            break;
        default:
            break;
    }
});

document.addEventListener('keydown', (e) => {
    e.preventDefault();

    switch (e.key) {
        case 'ArrowUp':
            keysPressed.arrowUp = true;
            break;

        case 'ArrowDown':
            keysPressed.arrowDown = true;
            break;
        case 'ArrowLeft':
            keysPressed.arrowLeft = true;
            break;
        case 'ArrowRight':
            keysPressed.arrowRight = true;
            break;
        default:
            break;
    }

    if (e.keyCode == 49) { //1
        camera1isActive = true;
    }
    if (e.keyCode == 50) { //2
        camera1isActive = false;
    }
});


function manageMovement() {

    if (keysPressed.arrowUp == true) {
        forwardSpeed();
    }
    if (keysPressed.arrowDown == true) {
        backwardSpeed();
    }

    //rodar as rodas
    if (speed != 0) {
        car.children[10].rotation.x += 0.08 * speed;
        car.children[11].rotation.x += 0.165 * speed;
    }

    if (keysPressed.arrowLeft == true && speed != 0) {
        turnLeft();
    }
    if (keysPressed.arrowRight == true && speed != 0) {
        turnRight();
    }

    function forwardSpeed() {
        speed += 0.15;
        if (speed > 6) {
            speed = 6;
        }
    }

    function backwardSpeed() {
        speed -= 0.15;
        if (speed < -1) {
            speed = -1;
        }
    }

    function turnLeft() {
        angle += 0.06;
    }

    function turnRight() {
        angle -= 0.06;
    }
}

function atrition() {
    //interseção com relva (diminui speed drasticamente)
    if (intersects.length == 0) {
        speed = speed * 0.9;
    }
    if (speed > 0) {
        speed -= speed * 0.03;
    }
    if (speed < 0) {
        speed += speed * 0.03;
    }
    if (speed < 0.07 && speed > -0.07) {
        speed = 0;
    }
}

function createCheckpoint(checkpoint) {

    scene.remove(checkpointObj);

    let geometry = new THREE.CylinderGeometry(65, 65, 25, 32);
    let material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        opacity: 0.4,
        transparent: true
    });
    checkpointObj = new THREE.Mesh(geometry, material);
    //console.log("Checkpoints:" + checkpoint + " | Laps:" + laps + "/3")

    switch (checkpoint) {
        case 0:
            checkpointObj.position.z = 118;
            break;
        case 1:
            checkpointObj.position.x = -450;
            checkpointObj.position.z = -100;
            break;
        case 2:
            checkpointObj.position.z = -380;
            break;
        case 3:
            checkpointObj.position.x = 450;
            checkpointObj.position.z = -85;
            break;
        default:
            console.log("The Checkpoints Broke");
    }

    scene.add(checkpointObj);
}

function checkCheckpointColision() {
    BBox = new THREE.Box3().setFromObject(car);
    BBox2 = new THREE.Box3().setFromObject(checkpointObj);

    collision = BBox.intersectsBox(BBox2); // checks collision between mesh and othermesh

    if (collision == true) {
        
        if (activeCheckpoint < 3) {
            activeCheckpoint++;
        } else {
            activeCheckpoint = 0;

            if(laps != 3){
                laps++;
            };

            scene.remove(screenText);

            //escrever novo texto
            fontLoader.load('./fonts/Hemi Head Rg_Bold Italic.json', function (font) {

                text = new THREE.TextGeometry(`Laps ${laps}/3`, {
                    font: font,
                    size: 29,
                    height: 3,
                    curveSegments: 12,
                });

                let textMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffff00
                });
                screenText = new THREE.Mesh(text, textMaterial);
                scene.add(screenText);
                screenText.position.x = -80 - 5 * laps;
                screenText.position.y = 126;
                screenText.position.z = -690;
            });
        }
    }

    if (laps == 3 && activeCheckpoint == 1) {

        scene.remove(screenText);
        //Jogo ganho! Escrever texto final
        fontLoader.load('./fonts/Hemi Head Rg_Bold Italic.json', function (font) {

            text = new THREE.TextGeometry(`You Won`, {
                font: font,
                size: 29,
                height: 3,
                curveSegments: 12,
            });

            let textMaterial = new THREE.MeshBasicMaterial({
                color: 0xffff00
            });
            screenText = new THREE.Mesh(text, textMaterial);
            scene.add(screenText);
            screenText.position.x = -92;
            screenText.position.y = 126;
            screenText.position.z = -690;
        });
    }
}