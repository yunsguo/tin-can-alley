import { Can, CanFlag } from "./modules/can"
import { loadColliders } from "./modules/colliderSetup"
import { Rifle, Cooldown } from "./modules/rifle"
import { Sound } from "./modules/sound"

// Sounds
const shotWoodSound = new Sound(new AudioClip("sounds/shotWood.mp3"), false)

// Setup models
const base = new Entity()
base.addComponent(new GLTFShape("models/baseLight.glb"))
engine.addEntity(base)

const tinCanAlley = new Entity()
tinCanAlley.addComponent(new GLTFShape("models/tinCanAlley.glb"))
tinCanAlley.addComponent(new Transform())
engine.addEntity(tinCanAlley)

const gun = new Rifle(new GLTFShape("models/rifle.glb"), new Transform())
gun.getComponent(Transform).position.set(0.075, -0.5, 0.2)
gun.getComponent(Transform).rotation = Quaternion.Euler(-5, 0, 0)
gun.setParent(Attachable.FIRST_PERSON_CAMERA)

// Setup our world
const world = new CANNON.World()
world.quatNormalizeSkip = 0
world.quatNormalizeFast = false
world.gravity.set(0, -9.82, 0) // m/s²

// Load colliders
loadColliders(world)

// Setup ground material
const physicsMaterial = new CANNON.Material("groundMaterial")
const ballContactMaterial = new CANNON.ContactMaterial(physicsMaterial, physicsMaterial, { friction: 1, restitution: 0.5 })
world.addContactMaterial(ballContactMaterial)

// Setup cans
// Bottom row
const can1 = new Can(new Transform({ position: new Vector3(7.4, 1.42, 9.535) }), physicsMaterial, world)
const can2 = new Can(new Transform({ position: new Vector3(7.7, 1.42, 9.535) }), physicsMaterial, world)
const can3 = new Can(new Transform({ position: new Vector3(8, 1.42, 9.535) }), physicsMaterial, world)
const can4 = new Can(new Transform({ position: new Vector3(8.3, 1.42, 9.535) }), physicsMaterial, world)
const can5 = new Can(new Transform({ position: new Vector3(8.6, 1.42, 9.535) }), physicsMaterial, world)

// 2nd row
const can6 = new Can(new Transform({ position: new Vector3(7.55, 1.706, 9.535) }), physicsMaterial, world)
const can7 = new Can(new Transform({ position: new Vector3(7.85, 1.706, 9.535) }), physicsMaterial, world)
const can8 = new Can(new Transform({ position: new Vector3(8.15, 1.706, 9.535) }), physicsMaterial, world)
const can9 = new Can(new Transform({ position: new Vector3(8.45, 1.706, 9.535) }), physicsMaterial, world)

// 3rd row
const can10 = new Can(new Transform({ position: new Vector3(7.7, 1.992, 9.535) }), physicsMaterial, world)
const can11 = new Can(new Transform({ position: new Vector3(8, 1.992, 9.535) }), physicsMaterial, world)
const can12 = new Can(new Transform({ position: new Vector3(8.3, 1.992, 9.535) }), physicsMaterial, world)

// 4th row
const can13 = new Can(new Transform({ position: new Vector3(7.85, 2.278, 9.535) }), physicsMaterial, world)
const can14 = new Can(new Transform({ position: new Vector3(8.15, 2.278, 9.535) }), physicsMaterial, world)

// Top can
const can15 = new Can(new Transform({ position: new Vector3(8, 2.564, 9.535) }), physicsMaterial, world)

const cans: Can[] = [can1, can2, can3, can4, can5, can6, can7, can8, can9, can10, can11, can12, can13, can14, can15]

// Create a ground plane and apply physics material
const groundShape: CANNON.Plane = new CANNON.Plane()
const groundBody: CANNON.Body = new CANNON.Body({ mass: 0 })
groundBody.addShape(groundShape)
groundBody.material = physicsMaterial
groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2) // Reorient ground plane to be in the y-axis
groundBody.position.set(0, 0.05, 0)
world.addBody(groundBody) // Add ground body to world

// Set high to prevent tunnelling
const FIXED_TIME_STEPS = 1.0 / 60.0
const MAX_TIME_STEPS = 30

class PhysicsSystem implements ISystem {
  update(dt: number): void {
    world.step(FIXED_TIME_STEPS, dt, MAX_TIME_STEPS)
    for (let i = 0; i < cans.length; i++) {
      cans[i].getComponent(Transform).position.copyFrom(cans[i].body.position)
      cans[i].getComponent(Transform).rotation.copyFrom(cans[i].body.quaternion)
    }
  }
}
engine.addSystem(new PhysicsSystem())

// Controls
const input = Input.instance
input.subscribe("BUTTON_DOWN", ActionButton.POINTER, true, (event) => {
  if(gun.hasComponent(Cooldown)) return

  gun.playFireAnim()
  if (event.hit?.meshName == "hit_collider") {
    let forwardVector: Vector3 = Vector3.Forward().rotate(Camera.instance.rotation)
    let entity = engine.entities[event.hit?.entityId] as Can
    entity.hasComponent(CanFlag)? entity.hit(forwardVector, event.hit?.hitPoint) : shotWoodSound.getComponent(AudioSource).playOnce()
  }
})