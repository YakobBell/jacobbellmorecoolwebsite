// Manages the physics simulation for the scene using CANNON.js.
/**
 * Initializes and configures the physics world.
 * This function sets up a CANNON.js world, defines gravity, and adds static bodies
 * for the floor and a desk to create the basic physical environment.
 * @returns {{world: CANNON.World}} An object containing the configured physics world instance.
 */
export function setupPhysics() {
    // Create a new physics world
    const world = new CANNON.World();
    world.gravity.set(0, -9.82, 0); // Set gravity

    // Create a static plane for the floor
    const floorShape = new CANNON.Plane();
    const floorBody = new CANNON.Body({ mass: 0 }); // mass 0 makes it static
    floorBody.addShape(floorShape);
    floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Rotate to be horizontal
    world.addBody(floorBody);

    // Create a static box for the desk
    const deskShape = new CANNON.Box(new CANNON.Vec3(10, 0.4, 6)); // Dimensions of the desk
    const deskBody = new CANNON.Body({ mass: 0 });
    deskBody.addShape(deskShape);
    deskBody.position.set(0, -1.5, 0); // Position of the desk
    world.addBody(deskBody);

    return { world };
}

/**
 * Advances the physics simulation by a fixed time step.
 * This function should be called in the main animation loop to update the physics world.
 * @param {CANNON.World} world - The CANNON.js world instance to update.
 */
export function updatePhysics(world) {
    world.step(1 / 60);
}