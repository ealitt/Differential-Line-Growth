let _maxForce = 20;
let _maxSpeed = 1.5;
let _start_radius = 200;
let _num_nodes = 10;
let _cohesionRate = 1.01;
let _sepDist = 100;

let nodes = [];
let color = 0;
let maxNodes = 400;
let pause = false;

let countFrame = 0;

function setup() {
    createCanvas(windowWidth, windowHeight);
    background(0);
    resetSketch();
}

function draw() {
    // background(51);
    console.log(frameCount);
    if(countFrame >= 500) {
        resetSketch();
    }
    if(!pause){
        let index = 0;
        for(let node of nodes) {
            node.applyForces(nodes);
            node.checkDist(index, nodes);
            node.update();
            // node.drawRigid(index, nodes);
            index++;
        }
        color++;
        if(color >= 255) color = 0;
        drawSmooth(nodes, color);
    }
    countFrame++;
}

function resetSketch() {
    countFrame = 0;
    background(0);
    resetValues();
    let posX, posY;
    let angleInc = 2*PI / _num_nodes;
    for(let angle = 0; angle <= 2*PI; angle+=angleInc){
        posX = width/2 + cos(angle) * _start_radius;
        posY = height/2 + sin(angle) * _start_radius;
        nodes.push(new Node(posX, posY));
    }
}

function resetValues() {
    nodes = [];
    color = 0;
    maxNodes = 400;
    pause = false;
}

function keyPressed() {
    if (keyCode === 80) { // if 'p' is pressed
      pause = !pause;
    } else if (keyCode === 82) { // if 'r' is pressed
        setup();
    }
  }

function drawSmooth(nodes) {
    // strokeWeight(4);
    // stroke(255, 255, 255, 50);
    // point(this.position.x, this.position.y);
    noFill();
    strokeWeight(1);
    stroke(color, 255, 255, 30);
    beginShape();
    curveVertex(
        nodes[0].position.x, 
        nodes[0].position.y
    );
    for(let i = 0; i < nodes.length; i++){
        curveVertex(
            nodes[i].position.x, 
            nodes[i].position.y
        );
    }
    curveVertex(
        nodes[0].position.x, 
        nodes[0].position.y
    );
    curveVertex(
        nodes[0].position.x, 
        nodes[0].position.y
    );
    endShape();
}

class Node {
    constructor(posX, posY) {
        this.position = createVector(posX, posY);
        this.velocity = p5.Vector.random2D();
        this.velocity.setMag(random(0,4));
        this.acceleration = createVector();
        this.maxForce = _maxForce;
        this.maxSpeed = _maxSpeed;
        this.cohesionRate = _cohesionRate;
        this.separationDist = _sepDist;
    }

    checkDist(index, nodes) {
        if(nodes.length < maxNodes){
            if (index != 0 && index != nodes.length-1){
                for (let i = -1; i <= 1; i+=4) {
                    let distance = dist(
                        this.position.x,
                        this.position.y,
                        nodes[index+i].position.x,
                        nodes[index+i].position.y
                    );
                    if (distance > this.separationDist) {
                        let posX = (this.position.x + nodes[index+i].position.x) / 2;
                        let posY = (this.position.y + nodes[index+i].position.y) / 2;
                        let newNode = new Node(posX, posY);
                        nodes.splice(index+i+1, 0, newNode);
                    }
                }
            } else if (index == 0) {
                let distance = dist(
                    this.position.x,
                    this.position.y,
                    nodes[nodes.length-1].position.x,
                    nodes[nodes.length-1].position.y
                );
                if (distance > this.separationDist) {
                    let posX = (this.position.x + nodes[nodes.length-1].position.x) / 2;
                    let posY = (this.position.y + nodes[nodes.length-1].position.y) / 2;
                    let newNode = new Node(posX, posY);
                    nodes.splice(nodes.length, 0, newNode);
                }
            }
        }
    }

    separation(nodes) {
        let steer = createVector();
        let total = 0;

        for (let other_node of nodes) {
            let distance = dist(
                this.position.x,
                this.position.y,
                other_node.position.x,
                other_node.position.y
            );

            if (other_node != this && distance < this.separationDist) {
                let diff = p5.Vector.sub(this.position, other_node.position);
                diff.div(distance); // weighted by distance
                steer.add(diff);
                total++;
            }
        }

        if(total > 0) {
            steer.div(total); // avg based on nearby nodes
            steer.setMag(this.maxSpeed);
            steer.sub(this.velocity);
            steer.limit(this.maxForce);
        }

        return steer;
    }

    cohesion(nodes) {
        let sum = createVector();
        for (let index = 0; index < nodes.length; index++) {
            if (index != 0 && index != nodes.length-1) 
                sum.add(
                    nodes[index-1].position
                ).add(
                    nodes[index+1].position
                );
            else if (index == 0) // edge case 
                sum.add(
                    nodes[nodes.length-1].position
                ).add(
                    nodes[1].position
                );
            else // edge case index == node.length-1
                sum.add(
                    nodes[0].position
                ).add(
                    nodes[nodes.length-2].position
                );
        }

        sum.div(2);
        let desired = p5.Vector.sub(sum, this.position);
        desired.setMag(this.maxSpeed);
        let steer = p5.Vector.sub(desired, this.velocity);
        steer.limit(this.maxForce);

        return steer;
    }

    applyForces(nodes) {
        this.acceleration.add(this.separation(nodes));
        this.acceleration.add(this.cohesion(nodes) * this.cohesionRate);
    }

    update() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.limit(this.maxSpeed);
        this.acceleration.mult(0);
    }

    drawRigid(index, nodes) {
        strokeWeight(4);
        stroke(255, 255, 255, 50);
        point(this.position.x, this.position.y);
        strokeWeight(1);
        stroke(255, 255, 255, 100);
        if (index + 1 < nodes.length) {
            line(this.position.x, this.position.y, nodes[index+1].position.x, nodes[index+1].position.y);
        } else {
            line(nodes[nodes.length-1].position.x, nodes[nodes.length-1].position.y, nodes[0].position.x, nodes[0].position.y);
        }
    }
}