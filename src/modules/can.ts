import { Sound } from "./sound"

const hitSound01 = new Sound(new AudioClip("sounds/can01.mp3"), false)
const hitSound02 = new Sound(new AudioClip("sounds/can02.mp3"), false)
const hitSound03 = new Sound(new AudioClip("sounds/can03.mp3"), false)
const hitSounds: Sound[] = [hitSound01, hitSound02, hitSound03]
const shotTinSound = new Sound(new AudioClip("sounds/shotTin.mp3"), false)

@Component("canFlag")
export class CanFlag {}

const IMPULSE_MULTIPLIER = 10

export class Can extends Entity {
  public body: CANNON.Body
  public world: CANNON.World

  constructor(transform: Transform, cannonMaterial: CANNON.Material, cannonWorld: CANNON.World) {
    super()
    engine.addEntity(this)
    this.addComponent(new GLTFShape("models/can.glb"))
    this.addComponent(transform)
    this.addComponent(new CanFlag())
    this.world = cannonWorld

    // Create physics body for coconut
    this.body = new CANNON.Body({
      mass: 1, // kg
      position: new CANNON.Vec3(transform.position.x, transform.position.y, transform.position.z), // m
      shape: new CANNON.Cylinder(0.115, 0.115, 0.286, 28), // Create cylinder shaped body with a diameter of 0.23m
    })
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2)
    // Add material and dampening to stop the can rotating and moving continuously
    this.body.sleep()
    this.body.sleepSpeedLimit = 1 // Falls asleep when velocity falls below this threshold
    this.body.material = cannonMaterial
    this.body.linearDamping = 0.4
    this.body.angularDamping = 0.4
    this.world.addBody(this.body) // Add can body to the world

    // Coconut collision
    this.body.addEventListener("collide", (e: any) => {
      // Only play sound when impact is high enough
      let relativeVelocity = e.contact.getImpactVelocityAlongNormal()
      if (Math.abs(relativeVelocity) > 0.75) {
        let randomTrackNo = Math.floor(Math.random() * 2)
        hitSounds[randomTrackNo].playAudioOnceAtPosition(this.getComponent(Transform).position)
      }
    })

  }
  hit(forwardVector: Vector3, hitPoint: Vector3 ) : void {
    this.body.wakeUp()
    shotTinSound.getComponent(AudioSource).playOnce()
    this.body.applyImpulse(
      new CANNON.Vec3(forwardVector.x * IMPULSE_MULTIPLIER, forwardVector.y * IMPULSE_MULTIPLIER, forwardVector.z * IMPULSE_MULTIPLIER),
      new CANNON.Vec3(hitPoint.x, hitPoint.y, hitPoint.z) 
    )
  }
}
