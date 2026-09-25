"""Live-Blender preview helpers for scripts/build-town-people.py (Blender MCP session only).

Run build-town-people.py in the live session first (it builds into a 'TownPeople' scene), then
exec this file in the same globals. It adds a camera, two sun lights and a grey world to that
scene (never exported) and defines:
  place(angle_deg, dist=5.2, z=1.05, lens=70, target_z=1.0)  camera orbit around the figure
  style(fem=False, hair='Hair')                               Fem shape key and which hair part renders
  only(clip)                                                  play one NLA clip (mute the rest; solo does
                                                              not isolate), or None for the rest pose
Then: scene.frame_set(n); scene.render.filepath = '/tmp/x.png'; bpy.ops.render.render(write_still=True)
Switch the window back to the user's scene afterwards: bpy.context.window.scene = bpy.data.scenes['Scene'].
"""
import bpy, math, mathutils
scene = bpy.data.scenes['TownPeople']
for n in ['PreviewCam', 'PreviewKey', 'PreviewFill']:
    if n in bpy.data.objects: bpy.data.objects.remove(bpy.data.objects[n])
cam = bpy.data.objects.new('PreviewCam', bpy.data.cameras.new('PreviewCam')); scene.collection.objects.link(cam); scene.camera = cam
key = bpy.data.objects.new('PreviewKey', bpy.data.lights.new('PreviewKey', 'SUN')); key.data.energy = 3.0; key.rotation_euler = (math.radians(50), 0, math.radians(30)); scene.collection.objects.link(key)
fill = bpy.data.objects.new('PreviewFill', bpy.data.lights.new('PreviewFill', 'SUN')); fill.data.energy = 1.0; fill.rotation_euler = (math.radians(70), 0, math.radians(-150)); scene.collection.objects.link(fill)
if scene.world is None: scene.world = bpy.data.worlds.new('PreviewWorld')
scene.world.use_nodes = True; bg = scene.world.node_tree.nodes.get('Background'); bg.inputs[0].default_value = (.62, .68, .72, 1); bg.inputs[1].default_value = .8
scene.render.engine = 'BLENDER_EEVEE'; scene.render.resolution_x, scene.render.resolution_y = 1200, 900
scene.view_settings.view_transform = 'Standard'
def place(angle_deg, dist=5.2, z=1.05, lens=70, target_z=1.0):
    a = math.radians(angle_deg); cam.data.lens = lens
    cam.location = (math.sin(a) * dist, -math.cos(a) * dist, z + .15)
    cam.rotation_euler = (mathutils.Vector((0, 0, target_z)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
def style(fem=False, hair='Hair'):
    for o in scene.objects:
        if o.type != 'MESH': continue
        if o.name == 'Body':
            if o.data.shape_keys: o.data.shape_keys.key_blocks['Fem'].value = 1. if fem else 0.
            continue
        o.hide_render = not (o.name == hair or (fem and o.name in ('Fem_Lashes', 'Fem_Earrings')))
def only(clip):
    arm = scene.objects['Character']; arm.animation_data.use_nla = clip is not None
    for t in arm.animation_data.nla_tracks: t.is_solo = False; t.mute = (t.name != clip)
