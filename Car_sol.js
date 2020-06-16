let renderer = null,
    scene = null,
    camera1 = null,
    camera2 = null,
    car;   // The three.js object that represents the model

let track, stadium, plane, checkpointObj;

//textures
let texTrack = new THREE.TextureLoader().load("./images/texture.JPG");
let texMarbleStadium = new THREE.TextureLoader().load("./images/texture.JPG");

//background
let textureCube = new THREE.CubeTextureLoader().setPath( 'cube/' ).load( 
    [ 'left.JPG', 'right.JPG', 'top.JPG', 'bottom.JPG', 'front.JPG', 'back.JPG' ] ); 


let laps = 0;
let activeCheckpoint = 0;
let collision = false;

let raycaster = new THREE.Raycaster();
let rayDirection = new THREE.Vector3( 0, -1, 0 );
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
    scene.background = textureCube;


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
    let pointLight = new THREE.PointLight(0xffffff);
    pointLight.position.set(0, 300, 200);
    pointLight.castShadow = true
    scene.add(pointLight);

    let ambientLight = new THREE.AmbientLight(0x111111);
    ambientLight.castShadow = true
    scene.add(ambientLight);

    let spotLight = new THREE.SpotLight( 0xffffff );
    spotLight.position.set( 40, 100, 0 );

    spotLight.castShadow = true;

    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;

    spotLight.shadow.camera.near = 500;
    spotLight.shadow.camera.far = 4000;
    spotLight.shadow.camera.fov = 30;

    scene.add( spotLight );

    
    //floor
    let geometry = new THREE.PlaneGeometry( 9000, 9000, 0 );
    let texGRASS = new THREE.TextureLoader().load("./images/texture.JPG" /*, function () {  callback();}*/  );
    let material = new THREE.MeshBasicMaterial( {map: texGRASS} );
    plane = new THREE.Mesh( geometry, material );
    plane.rotation.set(Math.PI/2,0,0)
    plane.position.set(0,-1,0)
    scene.add( plane );



    //add Track
    let loader = new THREE.ObjectLoader();

    loader.load(
        // resource URL
        "models/track.json",
    
        // onLoad callback
        // Here the loaded data is assumed to be an object
        function ( object ) {
            track = object;
            // Add the loaded object to the scene
            scene.add( track );
            track.scale.set(140,140,140)

        },
    
        // onProgress callback
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
    
        // onError callback
        function ( err ) {
            console.error( 'An error happened' );
        }
    );

    loader.load(
        // resource URL
        "models/stadium.json",
    
        // onLoad callback
        // Here the loaded data is assumed to be an object
        function ( object ) {
            stadium = object;
            // Add the loaded object to the scene
            scene.add( stadium );
            stadium.scale.set(180,100,180)
        },
    
        // onProgress callback
        function ( xhr ) {
            console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
        },
    
        // onError callback
        function ( err ) {
            console.error( 'An error happened' );
        }
    );

    // Car model
    let mtlLoader = new THREE.MTLLoader();
    mtlLoader.load('./models/toycar.mtl', function (materials) {
        materials.preload();
        let loader = new THREE.OBJLoader();
        loader.setMaterials(materials);
        loader.load('./models/toycar.obj', function (object) {
            car = object;
            car.scale.set(0.2, 0.2, 0.2);
            //let axes = new THREE.AxesHelper(100);
            //car.add(axes)
            scene.add(car);
        });
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

let angle = Math.PI;
let speed = 0;

function render() {
    if (car != undefined) {
        // sets the toycar object with the updated position
        //car.position.set(pos.x, pos.y, pos.z);
        
        //Colisoes usando RayCaster
        let origin = car.position.clone();
        origin.y += 5;
        raycaster.set(origin, rayDirection)

        //reset de intersects
        intersects = [];
        // calculate objects intersecting the picking ray
        intersects = raycaster.intersectObjects( track.children, true );


        

        // rotates the car by angle radians
        car.rotation.y = angle;

        manageMovement();

        //atrito
        atrition();


        //atualização da posição
        car.position.x += speed * Math.sin(angle);
        car.position.z += speed * Math.cos(angle);

        //colisão com coliseu
        if(car.position.z >= 610 || car.position.z <= -610 || car.position.x >= 720 || car.position.x <= -720){
            car.position.x -= speed*3 * Math.sin(angle);
            car.position.z -= speed *3 * Math.cos(angle);
            speed*=-0.2;
        }

        //Checkpoint e Laps | 3 Laps = Win | 4 Checkpoints = 1 Lap

        //update camera 2
        let relativeCameraOffset = new THREE.Vector3(0, 150, -250);
        let cameraOffset = relativeCameraOffset.applyMatrix4(car.matrixWorld);
        camera2.position.copy(cameraOffset);
        camera2.lookAt(car.position);
        //update camera 1
        camera1.lookAt(car.position);

        createCheckpoint(activeCheckpoint);
        checkCheckpointColision();
    }


    if (camera1isActive){
        renderer.render(scene, camera1);
    }else{
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

    if (e.keyCode == 49){    //1
        camera1isActive = true;
    }
    if (e.keyCode == 50){    //2
        camera1isActive = false;
    }
});


function manageMovement(){
    
    if (keysPressed.arrowUp == true) {
        forwardSpeed();
    }
    if (keysPressed.arrowDown == true) {
        backwardSpeed();
    }


    if (keysPressed.arrowLeft == true && speed != 0) {
        turnLeft();
    }
    if (keysPressed.arrowRight == true && speed != 0) {
        turnRight();
    }

    function forwardSpeed(){
        speed += 0.15;
        if (speed > 6){
            speed = 6;
        }
    }
    function backwardSpeed(){
        speed -= 0.15;
        if (speed < -3){
            speed = -3;
        }
    }

    function turnLeft(){
        angle += 0.06;
    }
    function turnRight(){
        angle -= 0.06; 
    }
}

function atrition(){
  //interseção com relva (diminui speed drásticamente)
        if (intersects.length == 0){
            speed=speed*0.85;
        }

        if(speed > 0){
            speed -= speed*0.03;
        }
        if(speed < 0){
            speed += speed*0.03;
        }
        if(speed < 0.07 && speed > -0.07){
            speed = 0;
        }
}

function createCheckpoint(checkpoint){
    
    scene.remove (checkpointObj);

    let geometry = new THREE.CylinderGeometry(65, 65, 25, 32);
    let material = new THREE.MeshBasicMaterial( {color: 0xffff00, opacity: 0.4, transparent: true} );
    checkpointObj = new THREE.Mesh( geometry, material );
    //console.log("Checkpoints:" + checkpoint + " | Laps:" + laps + "/3")

    switch(checkpoint) {
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
          console.log("The Checkpoints Broke")
      }

    scene.add(checkpointObj);
}

function checkCheckpointColision(){
    BBox = new THREE.Box3().setFromObject(car);
    BBox2 = new THREE.Box3().setFromObject(checkpointObj);

    collision = BBox.intersectsBox(BBox2); // checks collision between mesh and othermesh

    if (collision==true){
        if(activeCheckpoint<3){
            activeCheckpoint++
        }
        else{
            activeCheckpoint = 0
            laps++
        }
    }

    if (laps==3 && activeCheckpoint==1){
        console.log("You Won!")
    }
}


