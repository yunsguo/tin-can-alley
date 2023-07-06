import { Sound } from "./sound";

const hitSounds: Sound[] = [1, 2, 3].map(
  (n) => new Sound(new AudioClip(`sounds/can0${n}.mp3`), false)
);
const shotTinSound = new Sound(new AudioClip("sounds/shotTin.mp3"), false);

@Component("ballFlag")
export class BallFlag {}

const IMPULSE_MULTIPLIER = 1000;

export class Ball extends Entity {
  public body: CANNON.Body;
  public world: CANNON.World;

  constructor(
    transform: Transform,
    cannonMaterial: CANNON.Material,
    cannonWorld: CANNON.World,
    radius: number, //m
    rou: number //kg/m^3
  ) {
    super("ball");
    engine.addEntity(this);
    this.addComponent(new GLTFShape("models/balloon.glb"));
    this.addComponent(transform);
    this.addComponent(new BallFlag());
    this.world = cannonWorld;

    // Create physics body for coconut
    this.body = new CANNON.Body({
      mass: (4 / 3) * Math.PI * radius * radius * radius * rou, // kg
      position: new CANNON.Vec3(
        transform.position.x,
        transform.position.y,
        transform.position.z
      ), // m
      shape: new CANNON.Sphere(radius), // Create cylinder shaped body with a diameter of 0.23m
    });
    // this.body.quaternion.setFromAxisAngle(
    //   new CANNON.Vec3(1, 0, 0),
    //   -Math.PI / 2
    // );
    // Add material and dampening to stop the can rotating and moving continuously
    // this.body.sleep();
    // this.body.sleepSpeedLimit = 1; // Falls asleep when velocity falls below this threshold
    this.body.material = cannonMaterial;
    this.body.linearDamping = 0.4;
    this.body.angularDamping = 0.4;
    this.world.addBody(this.body); // Add can body to the world

    // Coconut collision
    this.body.addEventListener("collide", (e: any) => {
      log('collide');
      // Only play sound when impact is high enough
      let relativeVelocity = e.contact.getImpactVelocityAlongNormal();
      if (Math.abs(relativeVelocity) > 0.75) {
        let randomTrackNo = Math.floor(Math.random() * 2);
        hitSounds[randomTrackNo].playAudioOnceAtPosition(
          this.getComponent(Transform).position
        );
      }
    });
  }
  hit(forwardVector: Vector3, hitPoint: Vector3): void {
    log('ball hit');
    this.body.wakeUp();
    shotTinSound.getComponent(AudioSource).playOnce();
    this.body.applyImpulse(
      new CANNON.Vec3(
        forwardVector.x * IMPULSE_MULTIPLIER,
        forwardVector.y * IMPULSE_MULTIPLIER,
        forwardVector.z * IMPULSE_MULTIPLIER
      ),
      new CANNON.Vec3(hitPoint.x, hitPoint.y, hitPoint.z)
    );
  }
}
