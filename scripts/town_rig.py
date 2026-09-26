"""Shared clip generator for the skinned town rig (townspeople and hero models).

Both scripts/build-town-people.py and scripts/build-town-hero.py build an armature with the same
joint names (Hips, Torso, Head, Shoulder/Elbow/Grip/Thigh/Knee/Ankle with suffix -1 or 1), every
bone pointing straight up with no roll, so each joint has an identity rest rotation. add_clips()
keys the seven clips on such an armature as NLA tracks.

Leg geometry comes from the rig (LEGS below is the townspeople's). A hero with longer legs gets the
same motion scaled to its legs: the stride (travel) and timing never change, so the ground speed
(CLIP_GROUND_SPEED in components/town/townLocomotion.ts) is identical for every model.
"""
import bpy, math
from mathutils import Vector, Euler

CLIPS = [('Idle', 90), ('Walk', 32), ('Run', 32), ('Serve', 120), ('Wave', 72), ('Celebrate', 90), ('Sit', 120)]
# hips: rest height of the Hips bone head; pelvis: Hips head above the thigh joints;
# thigh/shin: vertical joint spans hip-knee and knee-ankle; ankle: ankle joint height.
LEGS = {'hips': .96, 'pelvis': .03, 'thigh': .43, 'shin': .41, 'ankle': .09}
ABDUCT_REST = math.radians(12)   # both rigs hang the arms 12 degrees from the body in the rest pose

def clear_clips():
    for a in [a for a in bpy.data.actions if a.name.split('.')[0] in dict(CLIPS)]: bpy.data.actions.remove(a)

def add_clips(arm, names, legs=LEGS):
    pose = arm.pose.bones
    def set_joint(name, rx=0., ry=0., rz=0.):
        pb = pose[name]; B = pb.bone.matrix_local.to_3x3(); R = Euler((rx, ry, rz), 'XYZ').to_matrix()
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (B.inverted() @ R @ B).to_quaternion()
    def aim(name, R):
        # an armature-space rotation matrix R for a joint (see set_joint)
        pb = pose[name]; B = pb.bone.matrix_local.to_3x3()
        pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (B.inverted() @ R @ B).to_quaternion()
    def set_offset(name, v):
        pb = pose[name]; pb.location = pb.bone.matrix_local.to_3x3().inverted() @ Vector(v)
    a, b = legs['thigh'], legs['shin']; k = (a + b) / (LEGS['thigh'] + LEGS['shin'])   # 1 for the townspeople
    rest = legs['hips']
    arm.animation_data_create()
    for clip, length in CLIPS:
        action = bpy.data.actions.new(clip); arm.animation_data.action = action
        for frame in range(1, length + 2):
            t = (frame - 1) / length; phase = t * math.tau; moving = clip in ('Walk', 'Run')
            rot = {n: [0., 0., 0.] for n in names}
            # Standing hips 1.5 cm below rest keep the knees nearly straight. Walking vaults over the stance leg: the hips peak at
            # mid-stance (t = .3 and .8, knee about 30 degrees) and dip in double support; the stretched leg at heel strike and
            # toe-off stays just inside its reach (.834 of .838). Running is lowest at mid-stance, as running is.
            # Ground speed = travel / stance time: Walk .66 m / .64 s = 1.03125 m/s, Run .80 m / .5333 s = 1.5 m/s
            # (CLIP_GROUND_SPEED in townLocomotion.ts).
            hips_z = (rest - .054 * k + .025 * k * math.cos(phase * 2 - 1.2 * math.pi)) if clip == 'Walk' else (rest - .10 * k + .02 * k * math.cos(phase * 2)) if clip == 'Run' else rest - .015 * k + .006 * k * math.sin(phase)
            rot['Torso'][0] = -.07 if clip == 'Run' else -.015
            rot['Torso'][2] = .025 * math.sin(phase) if moving else .008 * math.sin(phase)
            for i, side in enumerate((-1, 1)):
                s = str(side); cycle = (t + i * .5) % 1; stance = .6 if clip == 'Walk' else .5; travel = .66 if clip == 'Walk' else .80
                y = 0.; lift = 0.
                if moving:
                    if cycle < stance: y = -travel / 2 + travel * cycle / stance
                    else:
                        swing = (cycle - stance) / (1 - stance); y = travel / 2 - travel * (.5 - .5 * math.cos(math.pi * swing))
                        lift = (.08 if clip == 'Walk' else .16) * math.sin(math.pi * swing)
                target_z = legs['ankle'] + lift - (hips_z - legs['pelvis']); dist = min(a + b - .002, math.hypot(y, target_z))
                bend = math.acos(max(-1, min(1, (dist * dist - a * a - b * b) / (2 * a * b))))
                thigh = math.atan2(y, -target_z) - math.atan2(b * math.sin(bend), a + b * math.cos(bend))
                rot['Thigh' + s][0] = thigh; rot['Knee' + s][0] = bend; rot['Ankle' + s][0] = -thigh - bend
                rot['Shoulder' + s][0] = (-.36 if clip == 'Walk' else -.5) * math.sin(phase + i * math.pi) if moving else -.04
                rot['Elbow' + s][0] = -.9 if clip == 'Run' else -.22
            if clip == 'Serve':
                reach = math.sin(math.pi * min(1, max(0, (t - .05) / .85))) ** .7
                rot['Shoulder1'][0] = -.1 - reach * 1.0; rot['Elbow1'][0] = -.22 - reach * .45; rot['Torso'][0] = -.035 * reach; rot['Head'][0] = .08 * reach
            elif clip == 'Wave':
                env = math.sin(math.pi * t) ** .6
                rot['Torso'][2] += -.03 * env; rot['Head'][2] = .06 * env
            elif clip == 'Celebrate':
                env = math.sin(math.pi * t) ** .6
                for side in (-1, 1): rot['Shoulder' + str(side)][1] = -side * 2.15 * env; rot['Elbow' + str(side)][0] = -.3 - .4 * env
                rot['Head'][0] = -.12 * env
            if clip == 'Sit':
                # Seated at rest: hands on the thighs, a slight lean back, slow breathing. The game sets the legs for each
                # seat (seatActor, the café chairs) and lowers the hips (sitHips); these legs are the bench default.
                hips_z = rest - .015 * k
                rot['Torso'][0] = .05 + .012 * math.sin(phase); rot['Torso'][2] = 0; rot['Head'][0] = .05 - .008 * math.sin(phase)
                for side in (-1, 1):
                    s = str(side)
                    rot['Thigh' + s][0] = -1.05; rot['Knee' + s][0] = .35; rot['Ankle' + s][0] = .7
                    rot['Shoulder' + s][0] = -.45; rot['Shoulder' + s][1] = side * .28; rot['Elbow' + s][0] = -.5
            for n in names:
                set_joint(n, *rot[n])
            if clip == 'Wave':
                # Aimed, not angled: the upper arm points out, forward and a little down (about 60 degrees from hanging, so
                # the armpit opens far less than a sideways raise, which stretched the jacket into a web from the ribs to the
                # elbow), the forearm stands up beside the head with the hand clear of the face, and it sweeps side to side.
                down = Vector((math.sin(ABDUCT_REST), 0, -math.cos(ABDUCT_REST)))
                upper = down.lerp(Vector((.66, -.52, -.42)).normalized(), env).normalized()
                sweep = .28 * math.sin(phase * 3) * env
                fore = down.lerp(Vector((.16 + sweep, -.12, 1)).normalized(), env).normalized()
                R_sh = down.rotation_difference(upper).to_matrix()
                aim('Shoulder1', R_sh); aim('Elbow1', down.rotation_difference(R_sh.inverted() @ fore).to_matrix())
            for n in names:
                pose[n].keyframe_insert('rotation_quaternion', frame=frame)
            set_offset('Hips', (0, 0, hips_z - rest)); pose['Hips'].keyframe_insert('location', frame=frame)
        track = arm.animation_data.nla_tracks.new(); track.name = clip; track.strips.new(clip, 1, action); arm.animation_data.action = None
    for pb in pose: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)

def bones_up(arm, activate):
    """Point every bone straight up with no roll: the identity-rest contract with the game's direct poses."""
    activate(arm); bpy.ops.object.mode_set(mode='EDIT')
    for eb in arm.data.edit_bones:
        length = max(.06, (eb.tail - eb.head).length); eb.tail = eb.head + Vector((0, 0, length)); eb.roll = 0
    bpy.ops.object.mode_set(mode='OBJECT')
