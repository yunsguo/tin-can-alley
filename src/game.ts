import { loadColliders } from "./modules/colliderSetup";
import { Rifle, Cooldown } from "./modules/rifle";
import { Sound } from "./modules/sound";
import { Ball, BallFlag } from "./modules/ball";

// Sounds
const shotWoodSound = new Sound(new AudioClip("sounds/shotWood.mp3"), false);

// Setup models
const base = new Entity();
base.addComponent(new GLTFShape("models/baseLight.glb"));
engine.addEntity(base);

const tinCanAlley = new Entity()
tinCanAlley.addComponent(new GLTFShape("models/tinCanAlley.glb"))
tinCanAlley.addComponent(new Transform())
engine.addEntity(tinCanAlley)

const gun = new Rifle(new GLTFShape("models/rifle.glb"), new Transform());
gun.getComponent(Transform).position.set(0.075, -0.5, 0.2);
gun.getComponent(Transform).rotation = Quaternion.Euler(-5, 0, 0);
gun.setParent(Attachable.FIRST_PERSON_CAMERA);

// Setup our world
const world = new CANNON.World();
world.quatNormalizeSkip = 0;
world.quatNormalizeFast = false;
world.gravity.set(0, -9.82, 0); // m/s²


// Setup ground material
const physicsMaterial = new CANNON.Material("groundMaterial");
const ballContactMaterial = new CANNON.ContactMaterial(
  physicsMaterial,
  physicsMaterial,
  { friction: 1, restitution: 0.5 }
);
world.addContactMaterial(ballContactMaterial);

// Setup cans
var N = 180;

const balls: Ball[] = (
  Array.apply(null, { length: N } as unknown[]).map(
    Number.call,
    Number
  ) as number[]
).map(
  (i) =>
    new Ball(
      new Transform({ position: new Vector3(0, i, 0) }),
      physicsMaterial,
      world,
      1,
      1.204
    )
);

// Create a ground plane and apply physics material
const groundShape: CANNON.Plane = new CANNON.Plane();
const groundBody: CANNON.Body = new CANNON.Body({ mass: 0 });
groundBody.addShape(groundShape);
groundBody.material = physicsMaterial;
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2); // Reorient ground plane to be in the y-axis
groundBody.position.set(0, 0.05, 0);
world.addBody(groundBody); // Add ground body to world

// Set high to prevent tunnelling
const FIXED_TIME_STEPS = 1.0 / 60.0;
const MAX_TIME_STEPS = 30;

class PhysicsSystem implements ISystem {
  update(dt: number): void {
    world.step(FIXED_TIME_STEPS, dt, MAX_TIME_STEPS);
    balls.forEach((ball) => {
      ball.getComponent(Transform).position.copyFrom(ball.body.position);
      ball.getComponent(Transform).rotation.copyFrom(ball.body.quaternion);
    });
  }
}
engine.addSystem(new PhysicsSystem());

// Controls
const input = Input.instance;
input.subscribe("BUTTON_DOWN", ActionButton.POINTER, true, (event) => {
  if (gun.hasComponent(Cooldown)) return;

  gun.playFireAnim();
  log("hit", event);
  if (event.hit?.meshName == "hit_collider") {
    let forwardVector: Vector3 = Vector3.Forward().rotate(
      Camera.instance.rotation
    );
    let entity = engine.entities[event.hit?.entityId] as Ball;
    entity.hasComponent(BallFlag)
      ? entity.hit(forwardVector, event.hit?.hitPoint)
      : shotWoodSound.getComponent(AudioSource).playOnce();
  }
});

// Load colliders
loadColliders(world);