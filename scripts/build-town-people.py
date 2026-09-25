"""Build the skinned townspeople for Freedom Square.

One smooth body that bends at the joints replaces the old articulated mannequin (45 rigid parts
on 16 empties). The armature keeps the old joint names and positions (Hips, Torso, Head,
Shoulder/Elbow/Grip/Thigh/Knee/Ankle with suffix -1 or 1) and every bone points straight up with
no roll, so each joint has an identity rest rotation exactly like the old empties. The game's
seated, carrying and cycling poses (which set joint.rotation.x directly) and the six clips
(Idle, Walk, Run, Serve, Wave, Celebrate) therefore keep working unchanged.

The body is modelled from blended metaballs (clay-like joins, no visible seams), decimated, and
weighted with Blender's automatic weights while the bones still run along the limbs. Clothing is
painted by region with the material names the game recolours per resident (skin, shirt,
trousers, hair, cap, shoe). Optional parts are separate skinned meshes the game shows or hides:
Hair, Fem_HairLong, Fem_Ponytail, Fem_Lashes, Fem_Earrings, Masc_Beard, Masc_Cap. Shape keys on
the body: Fem (a softer female build) and Blink.

Run from the project directory:
  '/Applications/Blender.app/Contents/MacOS/Blender' --background --python scripts/build-town-people.py
Writes assets/town/town-people.blend and public/models/town/town-people.glb. No external assets.
In a live Blender session it builds into a separate 'TownPeople' scene and only writes the GLB.
"""
import bpy, bmesh, math, os
from mathutils import Vector, Euler, Matrix
from mathutils.bvhtree import BVHTree

ROOT = os.environ.get('TYCOON_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_GLB = os.path.join(ROOT, 'public/models/town/town-people.glb')
OUT_BLEND = os.path.join(ROOT, 'assets/town/town-people.blend')
FALLOFF = .575            # metaball surface radius / nominal size at stiffness 2, threshold .6
ABDUCT = math.radians(12) # arms hang slightly away from the body in the rest pose
CLIPS = [('Idle', 90), ('Walk', 32), ('Run', 32), ('Serve', 120), ('Wave', 72), ('Celebrate', 90)]

# ---------------------------------------------------------------- scene
if bpy.app.background:                       # headless: build into the startup scene, emptied
    scene = bpy.context.scene
    for o in list(scene.objects): bpy.data.objects.remove(o)
    scene.name = 'TownPeople'
else:                                        # live session: a separate scene; the user's scene is untouched
    if 'TownPeople' in bpy.data.scenes: bpy.data.scenes.remove(bpy.data.scenes['TownPeople'])
    scene = bpy.data.scenes.new('TownPeople'); bpy.context.window.scene = scene
for o in [o for o in bpy.data.objects if not o.users_scene]: bpy.data.objects.remove(o)
for store in (bpy.data.meshes, bpy.data.armatures, bpy.data.metaballs):
    for block in [b for b in store if b.users == 0]: store.remove(block)
for a in [a for a in bpy.data.actions if a.name.split('.')[0] in dict(CLIPS)]: bpy.data.actions.remove(a)
col = scene.collection

def link(o): col.objects.link(o); return o
def activate(o):
    for x in scene.objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o

# ---------------------------------------------------------------- materials (names are the game's recolour keys)
MATS = {}
def material(name, rgb, rough=.8, metal=0.):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    m.use_nodes = True; bsdf = m.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (*rgb, 1); bsdf.inputs['Roughness'].default_value = rough; bsdf.inputs['Metallic'].default_value = metal
    MATS[name] = m; return m
for name, rgb, rough, metal in [
    ('skin', (.80, .55, .40), .55, 0), ('shirt', (.13, .36, .31), .85, 0), ('cream', (.86, .82, .72), .9, 0),
    ('trousers', (.12, .13, .14), .85, 0), ('shoe', (.88, .87, .83), .6, 0), ('hair', (.035, .03, .03), .55, 0),
    ('white', (.95, .95, .93), .25, 0), ('eye', (.05, .035, .03), .15, 0), ('mouth', (.45, .2, .18), .6, 0),
    ('cap', (.28, .25, .21), .8, 0), ('gold', (.85, .62, .26), .3, .7)]:
    material(name, rgb, rough, metal)

# ---------------------------------------------------------------- skeleton (bind pose, Blender Z-up, facing -Y)
def arm_points(s):
    d = Vector((s * math.sin(ABDUCT), 0, -math.cos(ABDUCT)))
    S = Vector((s * .215, 0, 1.49)); E = S + d * .29; W = E + d * .27; P = W + d * .075; T = W + d * .17
    return S, E, W, P, T, d
JOINTS = {'Hips': ((0, 0, .96), (0, 0, 1.09), None), 'Torso': ((0, 0, 1.09), (0, 0, 1.58), 'Hips'), 'Head': ((0, 0, 1.56), (0, 0, 1.97), 'Torso')}
for s in (-1, 1):
    S, E, W, P, T, d = arm_points(s); k = str(s)
    JOINTS['Shoulder' + k] = (S, E, 'Torso'); JOINTS['Elbow' + k] = (E, W, 'Shoulder' + k); JOINTS['Grip' + k] = (P, T, 'Elbow' + k)
    JOINTS['Thigh' + k] = ((s * .115, 0, .93), (s * .115, 0, .50), 'Hips'); JOINTS['Knee' + k] = ((s * .115, 0, .50), (s * .115, 0, .09), 'Thigh' + k)
    JOINTS['Ankle' + k] = ((s * .115, 0, .09), (s * .115, -.16, .03), 'Knee' + k)

arm_data = bpy.data.armatures.new('Character'); arm = link(bpy.data.objects.new('Character', arm_data))
activate(arm); bpy.ops.object.mode_set(mode='EDIT')
for name, (h, t, parent) in JOINTS.items():
    eb = arm_data.edit_bones.new(name); eb.head = Vector(h); eb.tail = Vector(t)
for name, (h, t, parent) in JOINTS.items():
    if parent: arm_data.edit_bones[name].parent = arm_data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------- metaball helpers
def meta_family(name, res=.011):
    mb = bpy.data.metaballs.new(name); mb.resolution = res; mb.render_resolution = res; mb.threshold = .6
    return mb, link(bpy.data.objects.new(name, mb))
def ell(mb, c, r, rot=None):
    # r is the surface radius per axis; the field reaches the surface at FALLOFF of its size
    e = mb.elements.new(type='ELLIPSOID'); e.co = c; e.radius = 1; e.stiffness = 2
    e.size_x, e.size_y, e.size_z = (r[0] / FALLOFF, r[1] / FALLOFF, r[2] / FALLOFF)
    if rot: e.rotation = rot
    return e
def capsule(mb, a, b, r):
    a, b = Vector(a), Vector(b); e = mb.elements.new(type='CAPSULE'); axis = b - a
    e.co = (a + b) / 2; e.radius = r / FALLOFF; e.size_x = axis.length / 2; e.stiffness = 2
    e.rotation = Vector((1, 0, 0)).rotation_difference(axis.normalized()); return e
def meta_to_mesh(obj, name):
    dg = bpy.context.evaluated_depsgraph_get(); me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    me.name = name; mb = obj.data; bpy.data.objects.remove(obj); bpy.data.metaballs.remove(mb)
    return link(bpy.data.objects.new(name, me))
def triangles(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)
def decimate(o, tris, protect_borders=False):
    # the modifier's ratio counts triangles, so metaball quads count twice
    if triangles(o) <= tris: return
    activate(o); m = o.modifiers.new('Decimate', 'DECIMATE'); m.ratio = tris / triangles(o)
    if protect_borders:   # weight 1 = collapse freely; material borders get 0 so clothing edges stay crisp
        me = o.data; faces_of = {}
        for poly in me.polygons:
            for vi in poly.vertices: faces_of.setdefault(vi, set()).add(poly.material_index)
        border = {vi for vi, mats in faces_of.items() if len(mats) > 1}
        near = {vi for e in me.edges if (e.vertices[0] in border) != (e.vertices[1] in border) for vi in e.vertices} - border
        vg = o.vertex_groups.new(name='Decimate')
        vg.add([v.index for v in me.vertices if v.index not in border and v.index not in near], 1., 'REPLACE'); vg.add(list(near), .35, 'REPLACE')
        m.vertex_group = 'Decimate'; m.vertex_group_factor = .75
    bpy.ops.object.modifier_apply(modifier=m.name)
    if 'Decimate' in o.vertex_groups: o.vertex_groups.remove(o.vertex_groups['Decimate'])
def smooth(o):
    for p in o.data.polygons: p.use_smooth = True

# ---------------------------------------------------------------- body
mb, body_meta = meta_family('BodyMeta')
ell(mb, (0, .01, .985), (.148, .112, .11))             # pelvis
for s in (-1, 1): ell(mb, (s * .068, .07, .95), (.075, .065, .08))   # seat
ell(mb, (0, -.004, 1.135), (.155, .108, .1))           # waist
ell(mb, (0, -.004, 1.3), (.186, .114, .14))            # chest
ell(mb, (0, .006, 1.46), (.19, .1, .085))              # shoulder girdle
for s in (-1, 1): ell(mb, (s * .09, .012, 1.505), (.085, .072, .05))   # trapezius slope
capsule(mb, (0, .012, 1.5), (0, .012, 1.67), .05)      # neck
for s in (-1, 1):
    S, E, W, P, T, d = arm_points(s)
    ell(mb, S + Vector((s * .004, 0, -.028)), (.064, .066, .07))   # deltoid
    capsule(mb, S + d * .04, E, .052); ell(mb, E + d * .02, (.047, .049, .06))
    capsule(mb, E, W, .041)
    q = Vector((0, 0, -1)).rotation_difference(d)
    ell(mb, P, (.022, .043, .058), q)                  # palm, thin across the hand
    ell(mb, T + d * -.03, (.02, .036, .045), q)        # fingers
    capsule(mb, W + Vector((0, -.028, -.02)), W + Vector((s * .004, -.05, -.075)), .016)   # thumb
    hip, knee, ankle = Vector((s * .115, 0, .93)), Vector((s * .115, 0, .50)), Vector((s * .115, 0, .09))
    ell(mb, (s * .112, .005, .83), (.092, .099, .13))  # upper thigh
    capsule(mb, hip + Vector((0, 0, -.12)), knee, .082)
    capsule(mb, knee, ankle + Vector((0, 0, .03)), .059)
    ell(mb, (s * .115, .022, .35), (.066, .069, .12))  # calf
    ell(mb, (s * .115, -.05, .055), (.062, .135, .06))    # shoe
    ell(mb, (s * .115, .035, .06), (.058, .06, .06))      # heel
body = meta_to_mesh(body_meta, 'Body')
dense = bmesh.new(); dense.from_mesh(body.data); dense.faces.ensure_lookup_table(); body_tree = BVHTree.FromBMesh(dense); dense.free()
for m in ['skin', 'shirt', 'cream', 'trousers', 'shoe']: body.data.materials.append(MATS[m])
MI = {m.name: i for i, m in enumerate(body.data.materials)}

def along_arm(p, s):
    S, E, W, P, T, d = arm_points(s); return (p - S).dot(d)
def region(c):
    s = 1 if c.x >= 0 else -1; S, E, W, P, T, d = arm_points(s)
    t = along_arm(c, s); off = (c - S - d * t)
    if abs(c.x) > .17 and c.z < 1.5 and t > 0 and off.length < .09:
        return 'skin' if t > (W - S).length - .012 else 'shirt'
    if c.z < .15: return 'shoe'
    if c.z < 1.07: return 'trousers'
    if c.z > 1.548 and abs(c.x) < .075 and abs(c.y - .012) < .075: return 'skin'
    return 'shirt'
for p in body.data.polygons: p.material_index = MI[region(p.center)]
decimate(body, 3300, protect_borders=True); smooth(body)

def ring_fit(obj, z, reach=.2, band=.012):
    xs = [v.co for v in obj.data.vertices if abs(v.co.z - z) < band and abs(v.co.x) < reach]
    return max(abs(v.x) for v in xs), max(v.y for v in xs), min(v.y for v in xs)

# automatic weights while the bones still run along the limbs
activate(arm); body.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')

# ---------------------------------------------------------------- generic mesh builders
def new_obj(name, bm, mat, group=None):
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); o = link(bpy.data.objects.new(name, me))
    o.data.materials.append(MATS[mat]); smooth(o)
    if group: o.vertex_groups.new(name=group).add(list(range(len(me.vertices))), 1., 'REPLACE')
    return o
def sphere(name, c, r, mat, group='Head', seg=12, rings=7, rot=None):
    bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=seg, v_segments=rings, radius=1)
    M = Matrix.Translation(c) @ ((rot.to_matrix().to_4x4()) if rot else Matrix.Identity(4)) @ Matrix.Diagonal((*r, 1))
    bmesh.ops.transform(bm, matrix=M, verts=bm.verts); return new_obj(name, bm, mat, group)
def tube(name, pts, r, mat, group='Head', closed=False, seg=6):
    bm = bmesh.new(); rings = []; n = len(pts)
    for i, p in enumerate(pts):
        t = (pts[(i + 1) % n] - pts[i - 1]) if closed else (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]); t.normalize()
        up = Vector((0, 0, 1)) if abs(t.z) < .9 else Vector((0, 1, 0)); u = t.cross(up).normalized(); v = t.cross(u).normalized()
        rr = r(i / max(1, n - 1)) if callable(r) else r
        rings.append([bm.verts.new(p + (u * math.cos(a) + v * math.sin(a)) * rr) for a in [k / seg * math.tau for k in range(seg)]])
    for i in range(n if closed else n - 1):
        A, B = rings[i], rings[(i + 1) % n]
        for k in range(seg): bm.faces.new((A[k], A[(k + 1) % seg], B[(k + 1) % seg], B[k]))
    if not closed:
        bm.faces.new(list(reversed(rings[0]))); bm.faces.new(rings[-1])
    return new_obj(name, bm, mat, group)
def arc(c, radius, a0, a1, n=10, squash=1.):
    c = Vector(c); out = []
    for i in range(n):
        a = math.radians(a0 + (a1 - a0) * i / (n - 1)); out.append(c + Vector((math.cos(a) * radius, 0, math.sin(a) * radius * squash)))
    return out
def ellipse_ring(z, a, b, y0=0., n=18):
    return [Vector((math.cos(k / n * math.tau) * a, y0 + math.sin(k / n * math.tau) * b, z)) for k in range(n)]
def join(objs, name):
    activate(objs[0])
    for o in objs[1:]: o.select_set(True)
    bpy.ops.object.join(); o = bpy.context.view_layer.objects.active; o.name = name; o.data.name = name; return o

# ---------------------------------------------------------------- clothing trims (joined into the body)
trims = []
ax, ymax, ymin = ring_fit(body, 1.075)
trims.append(tube('Hem', ellipse_ring(1.075, ax + .008, (ymax - ymin) / 2 + .008, (ymax + ymin) / 2), .018, 'shirt', 'Torso', closed=True, seg=6))
ax, ymax, ymin = ring_fit(body, 1.555, reach=.1)
trims.append(tube('Collar', ellipse_ring(1.56, ax + .012, (ymax - ymin) / 2 + .012, (ymax + ymin) / 2), .02, 'shirt', 'Torso', closed=True, seg=6))
for s in (-1, 1):
    S, E, W, P, T, d = arm_points(s); c = W - d * .02; u = Vector((1, 0, 0)); v = d.cross(u).normalized(); u = v.cross(d).normalized()
    trims.append(tube('Cuff', [c + (u * math.cos(k / 14 * math.tau) + v * math.sin(k / 14 * math.tau)) * .041 for k in range(14)], .012, 'shirt', 'Elbow' + str(s), closed=True, seg=5))
    ring = [Vector((s * .115 + math.cos(k / 14 * math.tau) * .062, .004 + math.sin(k / 14 * math.tau) * .066, .15)) for k in range(14)]
    trims.append(tube('TrouserHem', ring, .011, 'trousers', 'Knee' + str(s), closed=True, seg=5))

# the open jacket shows a cream tee: a separate panel with clean edges, finished by lapel rolls
def body_front(x, z):
    hit = body_tree.ray_cast(Vector((x, -1, z)), Vector((0, 1, 0)))
    return hit[0] if hit[0] else Vector((x, -.1, z))
TEE_ROWS, TEE_COLS = 14, 6
tee_w = lambda z: .052 + .02 * (z - 1.085) / .465
bm = bmesh.new(); grid = []
for r in range(TEE_ROWS + 1):
    z = 1.085 + (1.55 - 1.085) * r / TEE_ROWS
    grid.append([bm.verts.new(body_front((c / TEE_COLS * 2 - 1) * tee_w(z), z) + Vector((0, -.006, 0))) for c in range(TEE_COLS + 1)])
for r in range(TEE_ROWS):
    for c in range(TEE_COLS): bm.faces.new((grid[r][c], grid[r][c + 1], grid[r + 1][c + 1], grid[r + 1][c]))
trims.append(new_obj('Tee', bm, 'cream', 'Torso'))
for side in (-1, 1):
    edge = [body_front(side * tee_w(z), z) + Vector((0, -.009, 0)) for z in [1.085 + (1.55 - 1.085) * r / 12 for r in range(13)]]
    trims.append(tube('Lapel', edge, .011, 'shirt', 'Torso', seg=5))

# ---------------------------------------------------------------- head and face (joined into the body, rigid to Head)
HC_OLD = Vector((0, .004, 1.885)); HC = Vector((0, .004, 1.80)); K = 1.035
def H(p): return HC + (Vector(p) - HC_OLD) * K          # head-relative layout, authored around HC_OLD
HR = Vector((.134, .148, .166)) * K
bm = bmesh.new(); bmesh.ops.create_uvsphere(bm, u_segments=26, v_segments=16, radius=1)
for v in bm.verts:
    x, y, z = v.co; low = max(0., -z) ** 1.6
    x *= 1 - .2 * low; y *= 1 - .1 * low; y -= .045 * low * (1 if y < 0 else 0)   # softly narrower jaw, chin a touch forward
    if z > .2 and y < 0: y *= 1 - .06 * (z - .2)                                   # flatter forehead
    if z < 0: z *= .9                                                              # shorter chin, rounder face
    if 0 > z > -.6 and y < 0: x *= 1 + .05 * math.sin(math.pi * -z / .6)           # fuller cheeks
    v.co = Vector((x * HR.x, y * HR.y, z * HR.z)) + HC
bm.faces.ensure_lookup_table(); tree = BVHTree.FromBMesh(bm)
def front_y(x, z):
    hit = tree.ray_cast(Vector((x, -1, z)), Vector((0, 1, 0)))
    return hit[0].y if hit[0] else HC.y - HR.y
face = [new_obj('HeadBase', bm, 'skin', 'Head')]
EYE_Z, EYE_X = HC.z + .01, .055
for s in (-1, 1):
    ex = s * EYE_X; wy = front_y(ex, EYE_Z) + .014          # eye white sits 1.4 cm behind the skin, so a big eye shows
    face.append(sphere('EyeWhite', (ex, wy, EYE_Z), (.034, .029, .031), 'white'))
    face.append(sphere('Iris', (ex, wy - .024, EYE_Z - .003), (.022, .011, .024), 'eye'))
    face.append(sphere('Glint', (ex + .006, wy - .037, EYE_Z + .01), (.006, .004, .006), 'white', seg=8, rings=5))
    lash = arc((ex, 0, EYE_Z), .034, 15, 165, 9, squash=.95); lash = [Vector((p.x, front_y(p.x, p.z) - .003, p.z)) for p in lash]
    face.append(tube('Lash', lash, .0055, 'eye'))
    brow = arc((ex, 0, EYE_Z + .016), .056, 58 if s > 0 else 72, 108 if s > 0 else 122, 7, squash=.9); brow = [Vector((p.x, front_y(p.x, p.z) - .004, p.z)) for p in brow]
    face.append(tube('Brow', brow, lambda t: .006 + .003 * math.sin(math.pi * t), 'hair'))
    face.append(sphere('Ear', (s * .136, .014, HC.z - .01), (.02, .034, .046), 'skin', seg=10, rings=7))
nz = HC.z - .028; face.append(sphere('Nose', (0, front_y(0, nz) + .007, nz), (.016, .017, .022), 'skin', seg=10, rings=7))
mouth = arc((0, 0, HC.z - .044), .03, 215, 325, 9, squash=.8); mouth = [Vector((p.x, front_y(p.x, p.z) - .003, p.z)) for p in mouth]
face.append(tube('Mouth', mouth, .005, 'mouth'))

activate(body)
for o in trims + face: o.select_set(True)
bpy.ops.object.join()
body = bpy.context.view_layer.objects.active; body.name = 'Body'; body.data.name = 'Body'

# ---------------------------------------------------------------- optional parts (separate skinned meshes)
def hair_mesh(name, build, faces, mat='hair'):
    mb, o = meta_family(name + 'Meta', .009); build(mb); o = meta_to_mesh(o, name); decimate(o, faces); smooth(o)
    o.data.materials.append(MATS[mat]); o.vertex_groups.new(name='Head').add(list(range(len(o.data.vertices))), 1., 'REPLACE'); return o
def hell(mb, c, r, rot=None): return ell(mb, H(c), [x * K for x in r], rot)
def hcap(mb, a, b, r): return capsule(mb, H(a), H(b), r * K)
def cap_of_hair(mb, back=.0):
    hell(mb, (0, .03, 1.965), (.142, .15, .1))
    hell(mb, (0, .05 + back, 1.905), (.135, .112, .105))
    for s in (-1, 1): hell(mb, (s * .118, .03, 1.915), (.04, .085, .07))
def short(mb):
    cap_of_hair(mb)
    for x, y, z, rx in [(-.06, -.118, 2.0, -.3), (.0, -.126, 2.008, 0), (.06, -.113, 2.003, .35), (.1, -.07, 2.006, .6)]:
        hell(mb, (x, y, z), (.055, .04, .03), Euler((.35, rx, 0)).to_quaternion())
    hell(mb, (.02, -.02, 2.04), (.07, .06, .035))
def long_hair(mb):
    cap_of_hair(mb, .01)
    hell(mb, (0, .085, 1.74), (.14, .075, .19))
    for s in (-1, 1): hell(mb, (s * .125, -.02, 1.8), (.035, .075, .13))
    hell(mb, (-.04, -.114, 1.998), (.085, .04, .03), Euler((.3, -.25, 0)).to_quaternion())
def ponytail(mb):
    cap_of_hair(mb)
    hell(mb, (0, .165, 1.93), (.045, .05, .05)); hcap(mb, (0, .19, 1.9), (0, .205, 1.73), .04)
    hell(mb, (-.03, -.116, 1.998), (.075, .04, .028), Euler((.35, -.2, 0)).to_quaternion())
def beard_shape(mb):
    hell(mb, (0, -.07, 1.775), (.108, .09, .06))
    for s in (-1, 1): hell(mb, (s * .1, -.02, 1.83), (.035, .06, .06))
def cap_shape(mb):
    hell(mb, (0, .01, 1.985), (.15, .165, .085)); hell(mb, (0, -.155, 1.972), (.11, .085, .013))
parts = [hair_mesh('Hair', short, 1000), hair_mesh('Fem_HairLong', long_hair, 1300), hair_mesh('Fem_Ponytail', ponytail, 1100)]
beard = hair_mesh('Masc_Beard', beard_shape, 700)
bm = bmesh.new(); bm.from_mesh(beard.data)   # keep the beard off the mouth and cheeks
bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z > HC.z - .055 or (v.co.z > HC.z - .085 and abs(v.co.x) < .045 and v.co.y < -.1)], context='VERTS')
bm.to_mesh(beard.data); bm.free(); parts.append(beard)
parts.append(hair_mesh('Masc_Cap', cap_shape, 800, 'cap'))
parts.append(join([tube('LashWing', [Vector((p.x, front_y(p.x, p.z) - .004, p.z)) for p in arc((s * EYE_X, 0, EYE_Z), .04, 2 if s > 0 else 148, 32 if s > 0 else 178, 4)], .006, 'eye') for s in (-1, 1)], 'Fem_Lashes'))
parts.append(join([sphere('Earring', (s * .138, .012, HC.z - .058), (.011, .011, .011), 'gold', seg=8, rings=5) for s in (-1, 1)], 'Fem_Earrings'))
for o in parts:
    o.parent = arm; m = o.modifiers.new('Armature', 'ARMATURE'); m.object = arm

# ---------------------------------------------------------------- shape keys on the body: Fem, Blink
body.shape_key_add(name='Basis'); fem = body.shape_key_add(name='Fem', from_mix=False); blink = body.shape_key_add(name='Blink', from_mix=False)
fem.value = 0; blink.value = 0
bump = lambda z, c, w: max(0., 1 - ((z - c) / w) ** 2)
for i, v in enumerate(body.data.vertices):
    p = v.co.copy(); q = p.copy(); side = 1 if p.x >= 0 else -1
    if abs(p.x) > .17 and 1.5 > p.z > .75 and along_arm(p, side) > 0:          # slimmer arms, a little further in
        S, E, W, P, T, d = arm_points(side); axis = S + d * along_arm(p, side)
        q = axis + (p - axis) * .88; q.x -= side * .014
    elif p.z < 1.56:
        q.x *= 1 - .09 * bump(p.z, 1.16, .12) + .05 * bump(p.z, .93, .1) - .07 * bump(p.z, 1.46, .1)   # waist in, hips out, shoulders in
        if p.y < -.05: q.y -= .022 * bump(p.z, 1.33, .07) * max(0., 1 - abs(abs(p.x) - .08) / .08)     # bust
        if p.z < .88 and abs(p.x) > .03: q.x = side * .115 + (p.x - side * .115) * .92                    # slimmer legs
    elif p.z < HC.z - .02: q.x *= .95                                                                     # softer jaw
    fem.data[i].co = q
    for s in (-1, 1):   # eyes close towards the lash line
        c = Vector((s * EYE_X, front_y(s * EYE_X, EYE_Z), EYE_Z))
        if (p - c).length < .05 and p.y < -.09: blink.data[i].co = Vector((p.x, p.y, EYE_Z + .012 + (p.z - EYE_Z - .012) * .12))

# ---------------------------------------------------------------- bones up, no roll: identity rest rotation per joint
activate(arm); bpy.ops.object.mode_set(mode='EDIT')
for eb in arm_data.edit_bones:
    length = max(.06, (eb.tail - eb.head).length); eb.tail = eb.head + Vector((0, 0, length)); eb.roll = 0
bpy.ops.object.mode_set(mode='OBJECT')

# ---------------------------------------------------------------- clips (same motion as scripts/refine-town-character.py)
pose = arm.pose.bones
def set_joint(name, rx=0., ry=0., rz=0.):
    pb = pose[name]; B = pb.bone.matrix_local.to_3x3(); R = Euler((rx, ry, rz), 'XYZ').to_matrix()
    pb.rotation_mode = 'QUATERNION'; pb.rotation_quaternion = (B.inverted() @ R @ B).to_quaternion()
def set_offset(name, v):
    pb = pose[name]; pb.location = pb.bone.matrix_local.to_3x3().inverted() @ Vector(v)
arm.animation_data_create()
for clip, length in CLIPS:
    action = bpy.data.actions.new(clip); arm.animation_data.action = action
    for frame in range(1, length + 2):
        t = (frame - 1) / length; phase = t * math.tau; moving = clip in ('Walk', 'Run')
        rot = {n: [0., 0., 0.] for n in JOINTS}
        # Standing hips at .945 keep the knees nearly straight; walking and running drop the hips just enough for the
        # stride to stay within the leg's reach (thigh .43 + shin .41). Ground speed = travel / stance time:
        # Walk .66 m / .64 s = 1.03125 m/s, Run .80 m / .5333 s = 1.5 m/s (CLIP_GROUND_SPEED in townLocomotion.ts).
        hips_z = (.89 + .015 * math.cos(phase * 2)) if clip == 'Walk' else (.86 + .02 * math.cos(phase * 2)) if clip == 'Run' else .945 + .006 * math.sin(phase)
        rot['Torso'][0] = -.07 if clip == 'Run' else -.015
        rot['Torso'][2] = .025 * math.sin(phase) if moving else .008 * math.sin(phase)
        for i, side in enumerate((-1, 1)):
            k = str(side); cycle = (t + i * .5) % 1; stance = .6 if clip == 'Walk' else .5; travel = .66 if clip == 'Walk' else .80
            y = 0.; lift = 0.
            if moving:
                if cycle < stance: y = -travel / 2 + travel * cycle / stance
                else:
                    swing = (cycle - stance) / (1 - stance); y = travel / 2 - travel * (.5 - .5 * math.cos(math.pi * swing))
                    lift = (.08 if clip == 'Walk' else .16) * math.sin(math.pi * swing)
            target_z = .09 + lift - (hips_z - .03); dist = min(.838, math.hypot(y, target_z)); a, b = .43, .41
            bend = math.acos(max(-1, min(1, (dist * dist - a * a - b * b) / (2 * a * b))))
            thigh = math.atan2(y, -target_z) - math.atan2(b * math.sin(bend), a + b * math.cos(bend))
            rot['Thigh' + k][0] = thigh; rot['Knee' + k][0] = bend; rot['Ankle' + k][0] = -thigh - bend
            rot['Shoulder' + k][0] = (-.36 if clip == 'Walk' else -.5) * math.sin(phase + i * math.pi) if moving else -.04
            rot['Elbow' + k][0] = -.9 if clip == 'Run' else -.22
        if clip == 'Serve':
            reach = math.sin(math.pi * min(1, max(0, (t - .05) / .85))) ** .7
            rot['Shoulder1'][0] = -.1 - reach * 1.0; rot['Elbow1'][0] = -.22 - reach * .45; rot['Torso'][0] = -.035 * reach; rot['Head'][0] = .08 * reach
        elif clip == 'Wave':
            env = math.sin(math.pi * t) ** .6
            rot['Shoulder1'][1] = -1.1 * env; rot['Shoulder1'][0] = -.45 * env; rot['Elbow1'][0] = -.25 - 1.45 * env; rot['Elbow1'][1] = .22 * math.sin(phase * 3) * env
        elif clip == 'Celebrate':
            env = math.sin(math.pi * t) ** .6
            for side in (-1, 1): rot['Shoulder' + str(side)][1] = -side * 2.15 * env; rot['Elbow' + str(side)][0] = -.3 - .4 * env
            rot['Head'][0] = -.12 * env
        for n in JOINTS:
            set_joint(n, *rot[n]); pose[n].keyframe_insert('rotation_quaternion', frame=frame)
        set_offset('Hips', (0, 0, hips_z - .96)); pose['Hips'].keyframe_insert('location', frame=frame)
    track = arm.animation_data.nla_tracks.new(); track.name = clip; track.strips.new(clip, 1, action); arm.animation_data.action = None
for pb in pose: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
scene.render.fps = 30; scene.frame_set(1)

# ---------------------------------------------------------------- export
for o in scene.objects: o.select_set(o in [arm, body] + parts)
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_force_sampling=True, export_yup=True, export_skins=True, export_morph=True, export_morph_normal=False, export_apply=False, use_active_scene=True)
if bpy.app.background:
    for sc in list(bpy.data.scenes):
        if sc != scene: bpy.data.scenes.remove(sc)
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND)
tris = {o.name: triangles(o) for o in [body] + parts}
print('TOWN PEOPLE EXPORTED', OUT_GLB, 'triangles', tris, 'parts', sorted(o.name for o in parts))
