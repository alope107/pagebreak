// Rename core Matterjs modules for easy use.
var Engine = Matter.Engine,
Render = Matter.Render,
World = Matter.World,
Bodies = Matter.Bodies,
MouseConstraint = Matter.MouseConstraint;

var simulationStarted = false;

// Returns the offset of an element relative to the document.
// Taken from https://plainjs.com/javascript/styles/get-the-position-of-an-element-relative-to-the-document-24/
function offset(el) {
    var rect = el.getBoundingClientRect(),
    scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
    scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
}

// Returns the location of a rectangle's top left corner given
// the centroid. Assumes rectangle is parallel to x axis.
function centroidToTopLeft(x, y, width, height) {
    return {left: Math.floor(x - (width/2)),
            top: Math.floor(y - (height/2))}
}

// Returns the location of a rectangle's centroid given
// the coordinates of the top left corner. Assumes rectangle 
// is parallel to x axis.
function topLeftToCentroid(left, top, width, height) {
    return {x: Math.floor(left + (width/2)),
            y: Math.floor(top + (height/2))}
}

// Returns a rectangle Matterjs body with the same location and
// dimensions as the DOM element passed in. Stores a reference
// to the DOM element in render.element.
function rectangleFromElement(element, isStatic) {
    const location = offset(element)

    const style = window.getComputedStyle(element);
    const elemWidth = parseFloat(style.width);
    const elemHeight = parseFloat(style.height);

    // Translate position from CSS to Matterjs.
    // CSS tracks elements by their top-left corner,
    // Matterjs tracks them by their centroid.
    const bodyPos = topLeftToCentroid(location.left, location.top, 
                                      elemWidth, elemHeight);


    const rect = Bodies.rectangle(bodyPos.x, bodyPos.y, elemWidth, elemHeight,
                                  {
                                      isStatic: isStatic,
                                      render: { 
                                                element: element,
                                                width: elemWidth,
                                                height: elemHeight
                                            }
                                  });
    return rect;
}

// Creates a rectangle body for each DOM element of class "dynamic"
// or "static". Each body will be sized and positioned to fit the element.
// Dynamic bodies will have isStatic set to false, static bodies will have it
// set to true. Returns an array of the bodies.
function bodiesFromDocument() {
    const bodies = [];

    const dynamicElements = document.getElementsByClassName("dynamic");
    for (let element of dynamicElements) {
        bodies.push(rectangleFromElement(element, false));
    }

    const staticElements = document.getElementsByClassName("static");
    for (let element of staticElements) {
        bodies.push(rectangleFromElement(element, true));
    }
    return bodies;
}


// Begins running simulation and rendering.
// Creates rectangular physics bodies for each DOM element of class "dynamic"
// or "static". Runs a physics simulation and updates CSS of the DOM elements
// to match translation and rotation of the physics objects.
function startSimulation() {
    // Only start the simulation once
    if (simulationStarted) {
        return;
    }
    // create an engine
    const engine = Engine.create();

    const mouseConstraint = MouseConstraint.create(engine);
    World.add(engine.world, mouseConstraint);

    // const ground = Bodies.rectangle(400, 610, 5000, 60, { isStatic: true });
    // World.add(engine.world, ground);

    const newBodies = bodiesFromDocument();
    World.add(engine.world, newBodies);

    // Runs a step of the simulation at each animation frame.
    // Updates the engine and the CSS of all DOM elements tied to
    // a physics body.
    function simulationStep() {
        // Update the engine 16 ms (~60 FPS)
        Engine.update(engine, 16);

        for (let body of engine.world.bodies) {
            if (body.render != null && body.render.element != null) {
                const element = body.render.element;

                // Transform from Matterjs coordinates to CSS coordinates
                const cssCoord = centroidToTopLeft(body.position.x, body.position.y, 
                                                   body.render.width, body.render.height);
                
                element.style.position = "absolute";
                element.style.left = Math.floor(cssCoord.left);
                element.style.top = Math.floor(cssCoord.top);
                element.style.transform = "rotate(" + body.angle + "rad)";
            }
        }
        // Continously re-register for each frame
        window.requestAnimationFrame(simulationStep);
    }

    // Begin stepping through the simulation on the next frame
    window.requestAnimationFrame(simulationStep);
    simulationStarted = true;
}

//   window.addEventListener('DOMContentLoaded', (event) => {
//     console.log('DOM fully loaded and parsed');
//     startSimulation();
// });