"""Freedom Square extras: sex-specific character parts and street vehicles.
Run after build-town-assets.py and before refine-town-character.py:
  Blender --background --python scripts/build-town-extras.py
Safe to rerun: existing parts are replaced by name. No external assets or accounts.

Character parts are optional meshes named Fem_* / Masc_* attached to the existing
Head / Torso / Hips pivots. The game shows or hides them per resident at runtime,
so one animated model serves every neighbour, guest, teller and player.
"""
import bpy, math, os
from mathutils import Vector
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/models/town')
SOURCE = os.path.join(ROOT, 'assets/town')
CHARACTER = os.path.join(SOURCE, 'town-character.blend')

def material(name, color, rough=.75, metal=0):
    m = bpy.data.materials.get(name)
    if m is None:
        m = bpy.data.materials.new(name); m.use_nodes = True
    m.diffuse_color = (*color, 1)
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1); p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    return m
def finish(o, name, mat, bevel=0):
    o.name = name; o.data.materials.append(bpy.data.materials[mat])
    if bevel:
        mod = o.modifiers.new('Soft crafted edges', 'BEVEL'); mod.width = bevel; mod.segments = 2
        bpy.context.view_layer.objects.active = o; bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def box(name, p, s, mat, bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=p); o = bpy.context.object; o.scale = s
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True); return finish(o, name, mat, bevel)
def sphere(name, p, s, mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=8, location=p); o = bpy.context.object; o.scale = s
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    for f in o.data.polygons: f.use_smooth = True
    return finish(o, name, mat)
def cylinder(name, p, r, d, mat, r2=None, bevel=.025):
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=r, radius2=r if r2 is None else r2, depth=d, location=p)
    return finish(bpy.context.object, name, mat, bevel)
def attach(o, parent):
    loc = o.location.copy(); o.parent = parent; o.location = loc; return o

# ---------------------------------------------------------------- character parts
bpy.ops.wm.open_mainfile(filepath=CHARACTER)
material('skirt', (.55, .32, .48)); material('lips', (.78, .36, .42), .5); material('cap', (.20, .30, .45))
for name in ['gold', 'hair', 'skin', 'shirt']:
    assert bpy.data.materials.get(name), name + ' material missing from the character source'
for obj in list(bpy.data.objects):
    if obj.name.startswith('Fem_') or obj.name.startswith('Masc_'):
        bpy.data.objects.remove(obj, do_unlink=True)
head = bpy.data.objects['Head']; torso = bpy.data.objects['Torso']; hips = bpy.data.objects['Hips']
# Hair volumes sit behind the existing cap; the fringe softens the hairline over the brow.
attach(sphere('Fem_HairLong', (0, .10, .12), (.275, .21, .36), 'hair'), head)
for x in [-.22, .22]: attach(sphere('Fem_HairSide', (x, .05, .04), (.075, .13, .24), 'hair'), head)
attach(box('Fem_Fringe', (0, -.20, .31), (.31, .10, .085), 'hair', .03), head)
tail = attach(sphere('Fem_Ponytail', (0, .31, .10), (.09, .11, .27), 'hair'), head); tail.rotation_euler.x = -.35
for x in [-.265, .265]: attach(sphere('Fem_Earring', (x, -.005, .085), (.03, .03, .03), 'gold'), head)
attach(box('Fem_Lips', (0, -.219, .036), (.088, .024, .026), 'lips', .01), head)
for x in [-.10, .10]: attach(sphere('Fem_Bust', (x, -.165, .35), (.095, .07, .085), 'shirt'), torso)
attach(cylinder('Fem_Skirt', (0, 0, -.21), .40, .44, 'skirt', .32, .02), hips)   # A-line: top wider than the hips so trousers never show through
attach(sphere('Masc_Beard', (0, -.135, -.02), (.20, .155, .105), 'hair'), head)
attach(cylinder('Masc_Cap', (0, .01, .37), .27, .11, 'cap', .25, .02), head)
attach(box('Masc_CapBrim', (0, -.27, .335), (.25, .17, .03), 'cap', .01), head)
bpy.ops.wm.save_as_mainfile(filepath=CHARACTER)
print('CHARACTER PARTS ADDED: Fem_HairLong Fem_HairSide Fem_Fringe Fem_Ponytail Fem_Earring Fem_Lips Fem_Bust Fem_Skirt Masc_Beard Masc_Cap')

# ---------------------------------------------------------------- vehicles
bpy.ops.wm.read_homefile(use_empty=True)
for name, color, rough, metal in [('carPaint', (.78, .30, .24), .35, .25), ('glass', (.14, .30, .38), .15, .1), ('tyre', (.10, .11, .12), .9, 0),
                                  ('hub', (.75, .76, .72), .3, .6), ('lamp', (.98, .95, .80), .3, 0), ('tail', (.85, .16, .14), .35, 0), ('bumper', (.22, .25, .27), .6, .1)]:
    material(name, color, rough, metal)
def wheels(parent, xs, y, r=.34, w=.26):
    for x in xs:
        for side in [-1, 1]:
            tyre = cylinder('Wheel', (x, side * y, r), r, w, 'tyre', bevel=.03); tyre.rotation_euler.x = math.pi / 2; attach(tyre, parent)
            hub = cylinder('Hub', (x, side * (y + .02), r), r * .55, w * .3, 'hub', bevel=.01); hub.rotation_euler.x = math.pi / 2; attach(hub, parent)
def lights(parent, x, z, forward=True):
    for side in [-1, 1]:
        attach(box('Headlamp' if forward else 'Taillamp', (x, side * .62, z), (.10, .32, .18), 'lamp' if forward else 'tail', .02), parent)
# Compact hatchback. Long axis is X, the direction of travel on Main Street.
car = bpy.data.objects.new('Car', None); bpy.context.collection.objects.link(car)
attach(box('Car body', (0, 0, .64), (4.0, 1.85, .62), 'carPaint', .14), car)
attach(box('Car cabin', (-.25, 0, 1.15), (2.25, 1.62, .46), 'glass', .12), car)
attach(box('Car roof', (-.25, 0, 1.41), (2.05, 1.55, .09), 'carPaint', .04), car)
for side in [-1, 1]:
    attach(box('Car pillar', (.82, side * .78, 1.15), (.07, .05, .42), 'carPaint', .01), car)
    attach(box('Car pillar', (-1.32, side * .78, 1.15), (.07, .05, .42), 'carPaint', .01), car)
attach(box('Car bumper', (2.02, 0, .42), (.12, 1.7, .24), 'bumper', .04), car)
attach(box('Car bumper', (-2.02, 0, .42), (.12, 1.7, .24), 'bumper', .04), car)
lights(car, 2.0, .68); lights(car, -2.0, .68, False)
wheels(car, [1.3, -1.3], .86)
# Delivery van: taller box with a glass front.
van = bpy.data.objects.new('Van', None); bpy.context.collection.objects.link(van)
attach(box('Van body', (-.3, 0, 1.05), (3.6, 1.95, 1.5), 'carPaint', .14), van)
attach(box('Van nose', (1.85, 0, .72), (.9, 1.9, .8), 'carPaint', .14), van)
attach(box('Van windscreen', (1.72, 0, 1.38), (.5, 1.7, .55), 'glass', .08), van)
attach(box('Van bumper', (2.32, 0, .42), (.12, 1.8, .24), 'bumper', .04), van)
attach(box('Van bumper', (-2.12, 0, .42), (.12, 1.8, .24), 'bumper', .04), van)
lights(van, 2.3, .78); lights(van, -2.1, .9, False)
wheels(van, [1.35, -1.25], .92, .36, .28)
# Bicycle: rider is a runtime character clone seated on the saddle, pedalling.
material('frame', (.16, .36, .48), .45, .3); material('fur', (.62, .43, .26), .9); material('furLight', (.86, .74, .58), .9); material('collar', (.80, .22, .20), .5)
def tube(name, a, b, r, mat, parent):
    mid = (Vector(a) + Vector(b)) * .5; o = cylinder(name, mid, r, (Vector(b) - Vector(a)).length, mat, bevel=0)
    o.rotation_euler = (Vector(b) - Vector(a)).to_track_quat('Z', 'Y').to_euler(); return attach(o, parent)
bike = bpy.data.objects.new('Bike', None); bpy.context.collection.objects.link(bike)
for x in [.55, -.55]:
    wheel = cylinder('BikeWheel', (x, 0, .36), .36, .05, 'tyre', bevel=0); wheel.rotation_euler.x = math.pi / 2; attach(wheel, bike)
    hub = cylinder('BikeHub', (x, 0, .36), .05, .09, 'hub', bevel=0); hub.rotation_euler.x = math.pi / 2; attach(hub, bike)
tube('Bike frame', (-.55, 0, .36), (-.05, 0, .95), .028, 'frame', bike); tube('Bike frame', (-.05, 0, .95), (.5, 0, .82), .028, 'frame', bike)
tube('Bike frame', (.5, 0, .82), (.55, 0, .36), .028, 'frame', bike); tube('Bike frame', (-.55, 0, .36), (.1, 0, .40), .028, 'frame', bike)
tube('Bike frame', (.1, 0, .40), (-.05, 0, .95), .028, 'frame', bike); tube('Bike frame', (.1, 0, .40), (.5, 0, .82), .028, 'frame', bike)
attach(box('Bike saddle', (-.08, 0, 1.0), (.26, .14, .06), 'tyre', .02), bike)
tube('Bike bars', (.5, -.24, .98), (.5, .24, .98), .02, 'hub', bike); tube('Bike stem', (.5, 0, .82), (.5, 0, .98), .022, 'frame', bike)
for side in [-1, 1]: attach(box('BikePedal', (.1, side * .14, .40), (.1, .06, .03), 'tyre', .005), bike)
# Dog: named legs and tail are swung at runtime; the leash is drawn in the game.
dog = bpy.data.objects.new('Dog', None); bpy.context.collection.objects.link(dog)
attach(box('Dog body', (0, 0, .33), (.46, .2, .2), 'fur', .06), dog)
attach(box('Dog chest', (.14, 0, .30), (.18, .22, .17), 'furLight', .05), dog)
attach(sphere('Dog head', (.31, 0, .45), (.13, .12, .12), 'fur'), dog)
attach(box('Dog snout', (.41, 0, .41), (.12, .09, .07), 'furLight', .02), dog)
attach(sphere('Dog nose', (.47, 0, .43), (.025, .025, .02), 'tyre'), dog)
for side in [-1, 1]:
    ear = attach(box('Dog ear', (.27, side * .10, .50), (.07, .03, .11), 'fur', .015), dog); ear.rotation_euler.x = side * .5
    attach(sphere('Dog eye', (.38, side * .05, .48), (.02, .02, .02), 'tyre'), dog)
attach(cylinder('Dog collar', (.25, 0, .40), .075, .04, 'collar', bevel=0), dog).rotation_euler.y = math.pi / 2
for i, (x, side) in enumerate([(.17, -1), (.17, 1), (-.17, -1), (-.17, 1)]):
    leg = cylinder('DogLeg', (x, side * .07, .12), .035, .24, 'fur', bevel=0); attach(leg, dog)
tail = attach(box('DogTail', (-.28, 0, .42), (.16, .04, .04), 'fur', .01), dog); tail.rotation_euler.y = -.5
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE, 'town-vehicles.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, 'town-vehicles.glb'), export_format='GLB', export_animations=False, export_yup=True, export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6)
print('VEHICLES EXPORTED: Car Van Bike Dog')
