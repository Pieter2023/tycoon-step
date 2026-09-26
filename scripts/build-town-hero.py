"""Build the hero Alex for Freedom Square from the AI-modelled source mesh.

Source: assets/town/alex-meshy-source.glb, made on 2026-09-25 with Meshy 7 image-to-3D through
Higgsfield (38 credits; textured, A-pose, 10k triangles) from concept 2 of
docs/verification/characters-2026-09-25/concept-alex-options.jpg. It is one textured mesh with no rig.

This script rigs it onto the town skeleton so it plays the same clips as the townspeople:
  1. weld the UV-seam splits, stand the feet on z = 0, scale the hair crown to HEIGHT and put the legs on y = 0;
  2. build the armature with the town joint names (Hips, Torso, Head, Shoulder/Elbow/Grip/Thigh/Knee/Ankle -1/1)
     at Alex's own joints (landmarks below), bind with automatic weights while the arms are still in the A-pose;
  3. swing the arms down to the town rest pose (12 degrees from the body) and apply that pose as the rest pose;
  4. point every bone up with no roll (the identity-rest contract; see scripts/town_rig.py) and key the six
     clips scaled to Alex's legs, so walking and running cover the same ground as everyone else.
Alex keeps his own proportions (longer legs, smaller head than the townspeople); only the joints move.

Run from the project directory:
  '/Applications/Blender.app/Contents/MacOS/Blender' --background --factory-startup --python scripts/build-town-hero.py
Writes public/models/town/town-hero-alex.glb; bump HERO_VERSION in components/town/createTownScene.ts afterwards.
No .blend is saved: this script and the source GLB rebuild it in seconds. In a live Blender session it builds into a
separate 'TownHero' scene. Set TYCOON_PREVIEW=<dir> (headless) to also render QA stills into that folder.
"""
import bpy, bmesh, math, os, sys
import numpy as np
from mathutils import Vector, Matrix
sys.dont_write_bytecode = True; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import town_rig

ROOT = os.environ.get('TYCOON_ROOT') or os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets/town/alex-meshy-source.glb')
OUT_GLB = os.path.join(ROOT, 'public/models/town/town-hero-alex.glb')
PREVIEW = os.environ.get('TYCOON_PREVIEW')
HEIGHT = 2.0              # hair crown; the townspeople's short hair tops out at about 2.0 at scale 1
ABDUCT = math.radians(12) # the town rest pose: arms 12 degrees from the body, in the frontal plane
TEXTURE = 1024            # the 2048 source atlas is fully dilated, so halving it does not bleed between charts

# ---------------------------------------------------------------- scene
if bpy.app.background:
    scene = bpy.context.scene
    for o in list(scene.objects): bpy.data.objects.remove(o)
    scene.name = 'TownHero'
else:
    if 'TownHero' in bpy.data.scenes: bpy.data.scenes.remove(bpy.data.scenes['TownHero'])
    scene = bpy.data.scenes.new('TownHero'); bpy.context.window.scene = scene
for o in [o for o in bpy.data.objects if not o.users_scene]: bpy.data.objects.remove(o)
town_rig.clear_clips()
col = scene.collection
def activate(o):
    for x in scene.objects: x.select_set(False)
    o.select_set(True); bpy.context.view_layer.objects.active = o

# ---------------------------------------------------------------- source mesh
bpy.ops.import_scene.gltf(filepath=SRC)
body = [o for o in scene.objects if o.type == 'MESH'][0]
for o in [o for o in scene.objects if o is not body]: bpy.data.objects.remove(o)
body.name = body.data.name = 'Alex'; body.parent = None
bm = bmesh.new(); bm.from_mesh(body.data)
bmesh.ops.transform(bm, matrix=body.matrix_world, verts=bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)        # glTF splits every UV seam; UVs stay per corner
z0 = min(v.co.z for v in bm.verts); SOURCE_HEIGHT = max(v.co.z for v in bm.verts) - z0
S = HEIGHT / SOURCE_HEIGHT
LEG_Y = .05               # the legs' centre line in the source runs 5 cm behind the origin
bmesh.ops.translate(bm, vec=Vector((0, -LEG_Y, -z0)), verts=bm.verts)
bmesh.ops.scale(bm, vec=Vector((S, S, S)), verts=bm.verts)
bm.to_mesh(body.data); bm.free(); body.matrix_world = Matrix.Identity(4)
activate(body)
try: bpy.ops.mesh.customdata_custom_splitnormals_clear()
except RuntimeError: pass
for p in body.data.polygons: p.use_smooth = True
mat = body.data.materials[0]; mat.name = 'alex'; mat.use_backface_culling = True
image = next(n.image for n in mat.node_tree.nodes if n.type == 'TEX_IMAGE' and n.image)
image.name = 'alex'
if image.size[0] > TEXTURE: image.scale(TEXTURE, TEXTURE)

# ---------------------------------------------------------------- joints (measured on the welded source, feet at 0)
# Cross-sections of the source (see docs/verification/hero-alex-2026-09-25/README.md): legs part at z .885,
# the armpits close at 1.325, the arm axis runs 31 degrees from vertical through (.238, 1.341) and (.458, 1.032).
def P(x, y, z): return Vector((x * S, (y - LEG_Y) * S, z * S))
JOINTS = {'Hips': (P(0, .03, .98), P(0, .03, 1.11), None), 'Torso': (P(0, .03, 1.11), P(0, .04, 1.55), 'Hips'),
          'Head': (P(0, .04, 1.575), P(0, .03, 1.90), 'Torso')}
for s in (-1, 1):
    k = str(s)
    JOINTS['Shoulder' + k] = (P(s * .17, .06, 1.46), P(s * .315, .04, 1.228), 'Torso')
    JOINTS['Elbow' + k] = (P(s * .315, .04, 1.228), P(s * .458, .012, 1.032), 'Shoulder' + k)
    JOINTS['Grip' + k] = (P(s * .478, -.005, .99), P(s * .535, -.01, .88), 'Elbow' + k)
    JOINTS['Thigh' + k] = (P(s * .10, LEG_Y, .95), P(s * .125, LEG_Y, .515), 'Hips')
    JOINTS['Knee' + k] = (P(s * .125, LEG_Y, .515), P(s * .14, LEG_Y, .095), 'Thigh' + k)
    JOINTS['Ankle' + k] = (P(s * .14, LEG_Y, .095), P(s * .15, -.12, .03), 'Knee' + k)
LEGS = {'hips': .98 * S, 'pelvis': .03 * S, 'thigh': (.95 - .515) * S, 'shin': (.515 - .095) * S, 'ankle': .095 * S}

arm_data = bpy.data.armatures.new('Character'); arm = bpy.data.objects.new('Character', arm_data); col.objects.link(arm)
activate(arm); bpy.ops.object.mode_set(mode='EDIT')
for name, (h, t, parent) in JOINTS.items():
    eb = arm_data.edit_bones.new(name); eb.head = h; eb.tail = t
for name, (h, t, parent) in JOINTS.items():
    if parent: arm_data.edit_bones[name].parent = arm_data.edit_bones[parent]
bpy.ops.object.mode_set(mode='OBJECT')

# automatic weights while the arms are still clear of the body
activate(body); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
unweighted = sum(1 for v in body.data.vertices if not any(g.weight > 1e-4 for g in v.groups))
print('HERO unweighted vertices', unweighted)

# ---------------------------------------------------------------- texture repair
# Meshy textures the A-pose from the camera side, so surfaces the arms hid (torso sides, inner sleeves, inner
# legs) came out as white smudges that show once the arms swing. Near-white texels on faces owned by the jacket
# bones (except the open front with the tee and zipper) become jacket teal; on the trouser bones, trouser grey.
def repair_texture():
    W, H = image.size
    px = np.empty(W * H * 4, np.float32); image.pixels.foreach_get(px); px = px.reshape(H, W, 4)
    me = body.data; me.calc_loop_triangles(); uvs = me.uv_layers.active.data
    names = {g.index: g.name for g in body.vertex_groups}
    jacket_bones = {'Hips', 'Torso', 'Shoulder-1', 'Shoulder1', 'Elbow-1', 'Elbow1'}
    leg_bones = {'Thigh-1', 'Thigh1', 'Knee-1', 'Knee1'}
    def owner(tri):
        acc = {}
        for vi in tri.vertices:
            for g in me.vertices[vi].groups: acc[names[g.group]] = acc.get(names[g.group], 0) + g.weight
        return max(acc, key=acc.get) if acc else None
    def texels(tri, grow=.08):
        (u0, v0), (u1, v1), (u2, v2) = [(uvs[l].uv.x * W - .5, uvs[l].uv.y * H - .5) for l in tri.loops]
        x0, x1 = int(max(0, math.floor(min(u0, u1, u2) - 2))), int(min(W - 1, math.ceil(max(u0, u1, u2) + 2)))
        y0, y1 = int(max(0, math.floor(min(v0, v1, v2) - 2))), int(min(H - 1, math.ceil(max(v0, v1, v2) + 2)))
        det = (v1 - v2) * (u0 - u2) + (u2 - u1) * (v0 - v2)
        if abs(det) < 1e-9: return None
        X, Y = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        a = ((v1 - v2) * (X - u2) + (u2 - u1) * (Y - v2)) / det; b = ((v2 - v0) * (X - u2) + (u0 - u2) * (Y - v2)) / det
        inside = (a >= -grow) & (b >= -grow) & (1 - a - b >= -grow)   # a slight grow covers the chart edge texels
        return Y[inside], X[inside]
    sets = {'jacket': [], 'trousers': []}
    for tri in me.loop_triangles:
        c, n, o = tri.center, tri.normal, owner(tri)
        if c.z < .22 or c.z > 1.56 * S or o not in jacket_bones | leg_bones: continue          # shoes, head, hands
        if abs(c.x) < .075 * S and n.y < -.2: continue                                          # tee and zipper strip
        if abs(c.x) < .13 * S and n.x * math.copysign(1, c.x) < -.25: continue                  # inner sides of the open flaps
        t = texels(tri)
        if t is None or not len(t[0]): continue
        r, g, b = np.median(px[t[0], t[1], :3], axis=0); lum = (r + g + b) / 3; sat = max(r, g, b) - min(r, g, b)
        # the face's own colour decides (the jacket hem and the trouser waist share the Hips bone); a face that is
        # all smudge goes by its bone and height
        if g - r > .08 and sat > .08: part = 'jacket'
        elif lum < .3 and sat < .1: part = 'trousers'
        elif lum > .5 and sat < .18: part = 'trousers' if o in leg_bones or (o == 'Hips' and c.z < 1.0 * S) else 'jacket'
        else: continue
        sets[part].append(t)
    fixed = {}
    for part, cells in sets.items():
        ys = np.concatenate([c[0] for c in cells]); xs = np.concatenate([c[1] for c in cells])
        rgb = px[ys, xs, :3]; lum = rgb.mean(1); sat = rgb.max(1) - rgb.min(1)
        # white smudges everywhere; on the dark trousers also the faint grey specks; on the jacket pale ones
        light = ((lum > .5) & (sat < .18)) | ((lum > .3) & (sat < .18) if part == 'trousers' else (lum > .42) & (sat < .15))
        px[ys[light], xs[light], :3] = np.median(rgb[~light], axis=0)   # the part's own typical colour
        fixed[part] = int(light.sum())
    image.pixels.foreach_set(px.ravel()); image.update()
    return fixed
print('HERO repaired texels', repair_texture())

# ---------------------------------------------------------------- arms down to the town rest pose, applied as rest
activate(arm); bpy.ops.object.mode_set(mode='POSE')
for s in (-1, 1):
    pb = arm.pose.bones['Shoulder' + str(s)]; S0 = JOINTS['Shoulder' + str(s)][0]; W0 = JOINTS['Elbow' + str(s)][1]
    R = (W0 - S0).normalized().rotation_difference(Vector((s * math.sin(ABDUCT), 0, -math.cos(ABDUCT))))
    pb.matrix = Matrix.Translation(S0) @ R.to_matrix().to_4x4() @ Matrix.Translation(-S0) @ pb.bone.matrix_local
    bpy.context.view_layer.update()
bpy.ops.object.mode_set(mode='OBJECT')
activate(body); bpy.ops.object.modifier_apply(modifier=body.modifiers[0].name)
activate(arm); bpy.ops.object.mode_set(mode='POSE'); bpy.ops.pose.armature_apply(selected=False); bpy.ops.object.mode_set(mode='OBJECT')
m = body.modifiers.new('Armature', 'ARMATURE'); m.object = arm

# ---------------------------------------------------------------- identity rest, clips
town_rig.bones_up(arm, activate)
town_rig.add_clips(arm, list(JOINTS), LEGS)
scene.render.fps = 30; scene.frame_set(1)

# ---------------------------------------------------------------- eyelids (the blink)
# The eyes are painted into the texture, and Draco drops morph targets, so the blink is geometry: a thin
# skin-coloured lid over each eye, shaped to the face by raycasting and parented to the Head joint. Closed
# (scale 1) it covers the painted eye and ends in a dark lash line along the eye's lower outline; the file
# stores it open, squashed flat to the crease above the eye (LID_OPEN). createBlink in
# components/town/townCharacterExpression.ts scales node 'Eyelids' down over the eyes and hides it between blinks.
# Outlines measured on the built hero (feet at 0, crown at 2.0) from an unlit orthographic front render.
EYE_X = [(-.0646, -.0278), (.0266, .0610)]          # inner and outer corners of the painted eyes
EYE_TOP, EYE_LOW_CORNER, EYE_LOW_MID = 1.841, 1.830, 1.823
LID_SKIN, LID_LASH = (.985, .749, .639), (.16, .11, .10)   # sRGB: the skin just above the eyes, the painted lash line
LID_OPEN = .02
def build_eyelids():
    from mathutils.bvhtree import BVHTree
    arm.data.pose_position = 'REST'; bpy.context.view_layer.update()
    deps = bpy.context.evaluated_depsgraph_get(); tree = BVHTree.FromObject(body, deps)
    crease = EYE_TOP + .005
    verts, faces, shade = [], [], []
    ROWS, COLS = [0, .3, .55, .75, .9, 1], 12
    for x0, x1 in EYE_X:
        xa, xb = x0 - .002, x1 + .002
        base = len(verts)
        for v in ROWS:
            for i in range(COLS):
                t = i / (COLS - 1); x = xa + (xb - xa) * t
                low = (EYE_LOW_CORNER - .001) - (EYE_LOW_CORNER - EYE_LOW_MID + .0002) * (1 - (2 * t - 1) ** 2)
                z = crease + (low - crease) * v
                hit, normal, _, _ = tree.ray_cast(Vector((x, -1, z)), Vector((0, 1, 0)))
                verts.append(hit + normal * .0015)
                edge = min(1, t / .12, (1 - t) / .12)            # the lash line fades out past the eye corners
                shade.append(edge * max(0, (v - .8) / .2))
        for r in range(len(ROWS) - 1):
            for i in range(COLS - 1):
                a = base + r * COLS + i
                faces.append((a, a + COLS, a + COLS + 1, a + 1))
    origin = Vector((0, sum(verts[i].y for i in range(COLS)) / COLS, crease))
    me = bpy.data.meshes.new('Eyelids'); me.from_pydata([p - origin for p in verts], [], faces); me.update()
    for p in me.polygons: p.use_smooth = True
    colours = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for i, s in enumerate(shade):
        colours.data[i].color_srgb = tuple(LID_SKIN[k] + (LID_LASH[k] - LID_SKIN[k]) * s for k in range(3)) + (1,)
    lid_mat = bpy.data.materials.new('alex-lid'); lid_mat.use_nodes = True; lid_mat.use_backface_culling = True
    nodes = lid_mat.node_tree.nodes; bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Roughness'].default_value = .55; bsdf.inputs['Metallic'].default_value = 0
    attr = nodes.new('ShaderNodeVertexColor'); attr.layer_name = 'Col'
    lid_mat.node_tree.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    me.materials.append(lid_mat)
    lids = bpy.data.objects.new('Eyelids', me); col.objects.link(lids)
    lids.parent = arm; lids.parent_type = 'BONE'; lids.parent_bone = 'Head'
    bpy.context.view_layer.update(); lids.matrix_world = Matrix.Translation(origin); bpy.context.view_layer.update()
    lids.scale.z = LID_OPEN
    arm.data.pose_position = 'POSE'; bpy.context.view_layer.update()
    return lids
lids = build_eyelids()

# ---------------------------------------------------------------- face skin evenness
# Meshy's face atlas has thin dark-grey lines in it (forehead, nose, cheeks, around the mouth, chin), mostly along its
# chart borders but some inside charts; they show at café and bench distances. Every skin texel of the head is placed
# back in 3D (barycentric over its triangle) and skin tone is averaged over 3D neighbourhoods (3 mm cells, ±2 cells),
# which crosses the chart seams. A texel takes that tone when it is off it by more than .03, its 3D neighbourhood is
# mostly skin (a brow, a nostril or the eyes' boxes are not) and it is either within two texels of a chart border or
# a thin dark line (darker, not redder, with skin around it in a 5×5 texel median). Lips and blush (redder than the
# skin) are left as painted. The charts are then re-dilated three texels into their padding, which texture
# filtering and mipmaps sample. (Smoothing the face's normals for the side-lit terminator on one cheek was tried and
# looked worse: a hard band where the Head weights end. That terminator is the decimated face's geometry.)
def repair_face():
    W, H = image.size
    px = np.empty(W * H * 4, np.float32); image.pixels.foreach_get(px); px = px.reshape(H, W, 4)
    me = body.data; me.calc_loop_triangles(); uvs = me.uv_layers.active.data
    head = body.vertex_groups['Head'].index
    def w_head(vi): return next((g.weight for g in me.vertices[vi].groups if g.group == head), 0)
    cover = np.zeros((H, W), bool)                     # texel centres inside any triangle of the model
    xs, ys, pos = [], [], []
    for tri in me.loop_triangles:
        (u0, v0), (u1, v1), (u2, v2) = [(uvs[l].uv.x * W - .5, uvs[l].uv.y * H - .5) for l in tri.loops]
        det = (v1 - v2) * (u0 - u2) + (u2 - u1) * (v0 - v2)
        if abs(det) < 1e-9: continue
        x0, x1 = int(max(0, math.floor(min(u0, u1, u2)))), int(min(W - 1, math.ceil(max(u0, u1, u2))))
        y0, y1 = int(max(0, math.floor(min(v0, v1, v2)))), int(min(H - 1, math.ceil(max(v0, v1, v2))))
        X, Y = np.meshgrid(np.arange(x0, x1 + 1), np.arange(y0, y1 + 1))
        a = ((v1 - v2) * (X - u2) + (u2 - u1) * (Y - v2)) / det; b = ((v2 - v0) * (X - u2) + (u0 - u2) * (Y - v2)) / det; c = 1 - a - b
        cover[Y[(a >= 0) & (b >= 0) & (c >= 0)], X[(a >= 0) & (b >= 0) & (c >= 0)]] = True
        if min(w_head(v) for v in tri.vertices) < .3: continue   # the face, and the jaw it shares with the Torso
        inside = (a >= -.08) & (b >= -.08) & (c >= -.08)
        if not inside.any(): continue
        A, B, C = (np.array(me.vertices[v].co) for v in tri.vertices)
        xs.append(X[inside]); ys.append(Y[inside]); pos.append(a[inside, None] * A + b[inside, None] * B + c[inside, None] * C)
    xs, ys, pos = np.concatenate(xs), np.concatenate(ys), np.concatenate(pos)
    rgb = px[ys, xs, :3]; lum = rgb.mean(1); sat = rgb.max(1) - rgb.min(1)
    in_eye = np.zeros(len(xs), bool)
    for x0, x1 in EYE_X:
        in_eye |= (pos[:, 0] > x0 - .006) & (pos[:, 0] < x1 + .006) & (pos[:, 2] > EYE_LOW_MID - .006) & (pos[:, 2] < EYE_TOP + .006)
    skin = (lum > .55) & (lum < .97) & (rgb[:, 0] > rgb[:, 1]) & (rgb[:, 1] > rgb[:, 2]) & (rgb[:, 0] - rgb[:, 2] > .1) & ~in_eye
    # the tone the skin should have at each texel: a blurred 3D grid of the skin texels (two passes, the second
    # without the outliers the first one found)
    cell = np.floor((pos - pos.min(0)) / .003).astype(int); dims = cell.max(0) + 5
    def smooth(mask):
        acc = np.zeros(tuple(dims) + (4,), np.float64)
        np.add.at(acc, (cell[mask, 0] + 2, cell[mask, 1] + 2, cell[mask, 2] + 2), np.c_[rgb[mask], np.ones(mask.sum())])
        for axis in range(3):
            acc = sum(np.roll(acc, k, axis) for k in range(-2, 3))
        field = acc[cell[:, 0] + 2, cell[:, 1] + 2, cell[:, 2] + 2]
        return field[:, :3] / np.maximum(field[:, 3:], 1e-9), field[:, 3]
    tone, _ = smooth(skin)
    typical = skin & (np.abs(lum - tone.mean(1)) < .03)
    tone, support = smooth(typical)
    # how much of each texel's 3D neighbourhood is skin: high around a thin seam line, low in a brow or nostril
    everything = np.ones(len(xs), bool)
    _, n_all = smooth(everything); _, n_skin = smooth(skin)
    skin_share = n_skin / np.maximum(n_all, 1)
    # the chart border: texels next to an uncovered texel, or next to one that lies more than 3 mm away in 3D (two
    # charts packed edge to edge), and the texels within two texels of those
    where = np.full((H, W, 3), np.nan); where[ys, xs] = pos
    inner = cover.copy()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nb = np.roll(np.roll(where, dy, 0), dx, 1); jump = np.linalg.norm(nb - where, axis=2)
        inner &= np.roll(np.roll(cover, dy, 0), dx, 1) & ~(jump > .003)
    for _ in range(2):
        inner = inner & np.roll(inner, 1, 0) & np.roll(inner, -1, 0) & np.roll(inner, 1, 1) & np.roll(inner, -1, 1)
    ring = ~inner[ys, xs]
    lip = (rgb[:, 0] - rgb[:, 1] > .27) & (lum < .8)
    off = np.abs(rgb - tone).max(1)
    # lines inside a chart: darker than the skin, not redder, and thin (the 5×5 texel median around them is skin)
    padded = np.pad(px[..., :3], ((2, 2), (2, 2), (0, 0)), mode='edge')
    around = np.median(np.stack([padded[ys + 2 + dy, xs + 2 + dx] for dy in range(-2, 3) for dx in range(-2, 3)], 1), 1)
    t_lum, t_sat = tone.mean(1), tone.max(1) - tone.min(1)
    thin = (t_lum - lum > .03) & (sat <= t_sat + .02) & (np.abs(around - tone).max(1) < .04)
    fix = ~in_eye & ~lip & (skin_share > .75) & (support > 20) & (off > .03) & (ring | thin)
    px[ys[fix], xs[fix], :3] = tone[fix]
    # re-dilate the head's skin charts into their padding, where no other chart borders it
    filled = np.zeros((H, W), bool); filled[ys[skin | fix], xs[skin | fix]] = True
    grown = 0
    for _ in range(3):
        n = np.zeros((H, W, 3)); k = np.zeros((H, W)); other = np.zeros((H, W), bool)
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            f = np.roll(np.roll(filled, dy, 0), dx, 1); n += np.roll(np.roll(px[..., :3], dy, 0), dx, 1) * f[..., None]; k += f
            other |= np.roll(np.roll(cover & ~filled, dy, 0), dx, 1)
        grow = ~cover & ~filled & (k > 0) & ~other
        px[grow, :3] = n[grow] / k[grow, None]; filled |= grow; grown += int(grow.sum())
    image.pixels.foreach_set(px.ravel()); image.update()
    return {'skin texels': int(skin.sum()), 'border texels fixed': int(fix.sum()), 'padding': grown}
print('HERO face', repair_face())

# ---------------------------------------------------------------- export
for o in scene.objects: o.select_set(o in (arm, body, lids))
os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=OUT_GLB, export_format='GLB', use_selection=True, export_animations=True, export_animation_mode='NLA_TRACKS',
                          export_force_sampling=True, export_yup=True, export_skins=True, export_morph=True, export_morph_normal=False, export_apply=False,
                          use_active_scene=True, export_image_format='JPEG', export_jpeg_quality=88,
                          # Draco like the city file: Meshy's fragmented UVs split the mesh into ~14.5k vertices (800 KB raw)
                          export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_draco_position_quantization=14,
                          export_draco_normal_quantization=10, export_draco_texcoord_quantization=12, export_draco_generic_quantization=12)
tris = sum(len(p.vertices) - 2 for p in body.data.polygons)
print('HERO EXPORTED', OUT_GLB, 'triangles', tris, 'scale', round(S, 4), 'legs', {k: round(v, 4) for k, v in LEGS.items()})

# ---------------------------------------------------------------- optional QA stills (headless)
if PREVIEW:
    os.makedirs(PREVIEW, exist_ok=True)
    cam = bpy.data.objects.new('PreviewCam', bpy.data.cameras.new('PreviewCam')); col.objects.link(cam); scene.camera = cam
    for name, energy, rot in [('Key', 3.0, (50, 0, 30)), ('Fill', 1.2, (70, 0, -150))]:
        light = bpy.data.objects.new(name, bpy.data.lights.new(name, 'SUN')); light.data.energy = energy
        light.rotation_euler = tuple(math.radians(a) for a in rot); col.objects.link(light)
    if scene.world is None: scene.world = bpy.data.worlds.new('PreviewWorld')
    scene.world.use_nodes = True; bg = scene.world.node_tree.nodes.get('Background'); bg.inputs[0].default_value = (.62, .68, .72, 1); bg.inputs[1].default_value = .8
    scene.render.engine = 'BLENDER_EEVEE'; scene.render.resolution_x, scene.render.resolution_y = 600, 900
    scene.view_settings.view_transform = 'Standard'
    def place(angle, dist=5.6, z=1.05, lens=60, target_z=1.0):
        a = math.radians(angle); cam.data.lens = lens; cam.location = (math.sin(a) * dist, -math.cos(a) * dist, z + .15)
        cam.rotation_euler = (Vector((0, 0, target_z)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    def only(clip):
        arm.animation_data.use_nla = clip is not None
        for t in arm.animation_data.nla_tracks: t.is_solo = False; t.mute = (t.name != clip)
    shots = [('rest-front', None, 1, 0), ('rest-side', None, 1, 90), ('rest-70', None, 1, 70), ('idle', 'Idle', 30, 25), ('walk', 'Walk', 9, 70),
             ('run', 'Run', 9, 70), ('wave', 'Wave', 36, 20), ('serve', 'Serve', 60, 40), ('celebrate', 'Celebrate', 45, 0)]
    for name, clip, frame, angle in shots:
        only(clip); scene.frame_set(frame); place(angle)
        scene.render.filepath = os.path.join(PREVIEW, name + '.png'); bpy.ops.render.render(write_still=True)
    only(None); scene.frame_set(1)
    scene.render.resolution_x, scene.render.resolution_y = 700, 700; place(0, dist=1.6, z=1.66, lens=70, target_z=1.8)
    scene.render.filepath = os.path.join(PREVIEW, 'face.png'); bpy.ops.render.render(write_still=True)
    # the blink: rest pose, lids open, half and closed, straight on and from three quarters
    arm.data.pose_position = 'REST'
    for angle in (0, 35):
        for name, amount in (('open', LID_OPEN), ('half', .5), ('closed', 1)):
            lids.scale.z = amount; place(angle, dist=1.1, z=1.72, lens=85, target_z=1.83)
            scene.render.filepath = os.path.join(PREVIEW, f'blink-{angle}-{name}.png'); bpy.ops.render.render(write_still=True)
    lids.scale.z = LID_OPEN; arm.data.pose_position = 'POSE'
