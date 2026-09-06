"""Original Freedom Square artwork. Run with Blender --background --python this-file.
Creates editable .blend sources and lightweight GLB assets; no external assets/accounts.
"""
import bpy, math, random, os
from mathutils import Vector
random.seed(42)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public/models/town')
SOURCE = os.path.join(ROOT, 'assets/town')
os.makedirs(OUT, exist_ok=True); os.makedirs(SOURCE, exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
M = {}
def material(name, color, rough=.75, metal=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
    M[name]=m; return m
for name,color in {'ivory':(.88,.82,.67),'cream':(.98,.92,.76),'stone':(.63,.64,.58),'paving':(.74,.70,.59),'mint':(.34,.61,.51),'mintDark':(.13,.31,.29),'blue':(.30,.48,.62),'clay':(.75,.36,.25),'peach':(.95,.64,.43),'pink':(.68,.45,.44),'slate':(.13,.22,.27),'roof':(.26,.32,.36),'glass':(.11,.28,.34),'wood':(.40,.23,.13),'leaf':(.22,.42,.21),'leafLight':(.38,.57,.24),'leafGold':(.63,.66,.27),'flower':(.88,.39,.46),'road':(.24,.29,.31),'grass':(.36,.49,.29),'gold':(.91,.68,.28),'white':(.96,.97,.91),'skin':(.59,.34,.20),'hair':(.12,.075,.05),'shirt':(.91,.65,.24),'trousers':(.10,.19,.26),'shoe':(.85,.86,.76)}.items(): material(name,color,.26 if name=='glass' else .75,.25 if name=='gold' else 0)
def finish(o,name,mat,bevel=0):
    o.name=name; o.data.materials.append(M[mat])
    if bevel:
        mod=o.modifiers.new('Soft crafted edges','BEVEL'); mod.width=bevel; mod.segments=2
        bpy.context.view_layer.objects.active=o; bpy.ops.object.modifier_apply(modifier=mod.name)
    return o
def box(name,p,s,mat,bevel=.04):
    bpy.ops.mesh.primitive_cube_add(size=1, location=p); o=bpy.context.object; o.scale=s; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True); return finish(o,name,mat,bevel)
def sphere(name,p,s,mat):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=12,ring_count=8,location=p); o=bpy.context.object; o.scale=s; bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    for f in o.data.polygons: f.use_smooth=True
    return finish(o,name,mat)
def cylinder(name,p,r,d,mat,r2=None):
    bpy.ops.mesh.primitive_cone_add(vertices=16,radius1=r,radius2=r if r2 is None else r2,depth=d,location=p); return finish(bpy.context.object,name,mat,.025)
def tube(name,a,b,r,mat):
    mid=(Vector(a)+Vector(b))*.5; o=cylinder(name,mid,r,(Vector(b)-Vector(a)).length,mat); o.rotation_euler=(Vector(b)-Vector(a)).to_track_quat('Z','Y').to_euler(); return o
def text(words,p,size,mat='cream'):
    curve=bpy.data.curves.new('Lettering','FONT'); curve.body=words; curve.align_x='CENTER'; curve.align_y='CENTER'; curve.size=size; curve.extrude=.012; curve.bevel_depth=.003
    o=bpy.data.objects.new(words,curve); bpy.context.collection.objects.link(o); o.location=p; o.rotation_euler=(math.pi/2,0,0); o.data.materials.append(M[mat]); bpy.context.view_layer.objects.active=o; o.select_set(True); bpy.ops.object.convert(target='MESH'); o.select_set(False); return o
def window(x,y,z,w=1.1,h=1.65):
    box('Window surround',(x,y,z),(w+.18,.18,h+.18),'cream',.07); box('Reflective glazing',(x,y-.12,z),(w,.04,h),'glass',.04)
    box('Window mullion',(x,y-.16,z),(.045,.025,h),'ivory',.006); box('Window transom',(x,y-.16,z+.08),(w,.025,.045),'ivory',.006)
    box('Stone sill',(x,y-.14,z-h/2-.13),(w+.35,.4,.14),'ivory',.04)
    box('Window reflection',(x-w*.23,y-.145,z+.2),(w*.13,.008,h*.66),'blue',.005)
def planter(x,y,flowers=True):
    box('Planter',(x,y,.45),(.95,.72,.75),'ivory',.12)
    sphere('Boxwood',(x,y,.92),(.48,.35,.4),'leaf')
    if flowers:
        for i in range(5): sphere('Flowers',(x+random.uniform(-.35,.35),y+random.uniform(-.2,.2),1.16),(.11,.10,.09),'flower')
def tree(x,y,s=1):
    cylinder('Tree planter',(x,y,.17),.95*s,.34,'stone'); cylinder('Tree trunk',(x,y,1.35*s),.14*s,2.6*s,'wood',.10*s)
    for i in range(6):
        a=i*2.4; px=x+math.sin(a)*.7*s; py=y+math.cos(a)*.7*s; z=(2.55+(i%3)*.38)*s
        tube('Branch',(x,y,1.6*s),(px,py,z),.065*s,'wood'); sphere('Canopy',(px,py,z),(1.1*s,.9*s,1.05*s),'leafLight' if i%2 else 'leaf')
def bench(x,y):
    for i in range(4): box('Bench slat',(x,y+i*.14,.63),(2.1,.1,.1),'wood',.04)
    for z in [.94,1.16]: box('Bench back',(x,y+.47,z),(2.1,.1,.13),'wood',.04)
    for dx in [-.78,.78]: box('Bench frame',(x+dx,y+.2,.35),(.09,.5,.6),'slate',.03)

# Coordinates use Blender Z up. The GLB exporter converts to the game's Y up.
box('Landscape',(0,0,-.32),(140,140,.6),'grass',.2)
box('Main Street',(0,-3,.015),(100,5,.07),'road',0)
box('North pavement',(0,0,.10),(38,1.5,.2),'paving',.05)
box('Park promenade',(0,-7,.10),(38,2.5,.2),'paving',.05)
box('Square',(0,-11,.12),(15,6,.22),'paving',.06)
for x in range(-19,20):
    box('Pavement seam',(x,0,.207),(.025,1.4,.008),'stone',0)
    for y in [-6,-7,-8]: box('Paving joint',(x,y,.213),(.02,.95,.008),'stone',0)
for x in range(-40,41,4): box('Road marking',(x,-3,.06),(1.5,.06,.018),'cream',0)
for y in [-1.2,-1.8,-2.4,-3,-3.6,-4.2,-4.8]: box('Crosswalk',(0,y,.065),(2.2,.27,.015),'cream',0)
for x in [-10.5,-3.5,3.5,10.5]:
    before=set(bpy.context.scene.objects)
    idx=[-10.5,-3.5,3.5,10.5].index(x); body=['mint','blue','peach','pink'][idx]; h=[7.3,9.5,6.6,7.8][idx]
    box('Building '+str(idx),(x,4,h/2+.2),(6.4,5.5,h),body,.14)
    box('Foundation',(x,4,.3),(6.65,5.8,.5),'ivory',.10)
    for z in [2.85,5.45,h+.15]: box('Facade cornice',(x,4,z),(6.7,5.8,.23),'cream',.06)
    box('Inset rooftop',(x,4,h+.30),(6.1,5.1,.25),'slate',.05)
    for xx in [-3.2,3.2]: box('Roof parapet',(x+xx,4,h+.65),(.20,5.8,.8),'ivory',.05)
    for yy in [1.2,6.8]: box('Roof parapet',(x,yy,h+.65),(6.6,.2,.8),'ivory',.05)
    for floor in [4.2,6.65] + ([8.25] if idx==1 else []):
        if floor>h-.4: continue
        for dx in [-2.05,0,2.05]: window(x+dx,1.20,floor,1.25,1.55)
    for dx in [-2.13,2.13]: window(x+dx,1.13,1.58,1.45,1.95)
    box('Entry frame',(x,1.08,1.4),(1.45,.25,2.45),'cream',.10); box('Entry glazing',(x,.91,1.4),(1.2,.05,2.2),'glass',.02)
    for dx in [-.52,.52]: tube('Door handle',(x+dx,.85,1.15),(x+dx,.85,1.62),.035,'gold')
    for dx in [-3,3]:
        box('Stone pilaster',(x+dx,1.10,1.6),(.26,.35,2.4),'ivory',.04)
        box('Pilaster cap',(x+dx,1.02,2.65),(.42,.5,.17),'cream',.03)
    box('Shop fascia',(x,.87,3.02),(5.7,.35,.62),'mintDark' if idx!=2 else 'clay',.08)
    text(['COMMUNITY BANK','THE EXCHANGE','MAIN STREET CO.','PROPERTY & CO.'][idx],(x,.66,3.02),.31)
    text(['SAVE  |  PLAN  |  GROW','INVEST IN YOUR FUTURE','GOOD BUSINESS. GOOD LIFE.','FIND YOUR NEXT CHAPTER'][idx],(x,1.05,5.77),.17,'slate')
    if idx==0:
        for dx in [-1.04,1.04]:
            cylinder('Bank column',(x+dx,.50,1.48),.13,2.5,'cream'); cylinder('Column foot',(x+dx,.50,.3),.23,.23,'ivory')
        cylinder('Roof crest',(x,4,h+1),.8,.65,'gold',.15)
    elif idx==2:
        for i in range(12):
            o=box('Striped awning',(x-2.75+i*.5,.54,2.38),(.51,1.25,.10),'cream' if i%2 else 'clay',.015); o.rotation_euler.x=-.14
            box('Awning scallop',(x-2.75+i*.5,-.08,2.24),(.49,.08,.24),'cream' if i%2 else 'clay',.05)
    else:
        box('Balcony base',(x,.82,5.05),(2.0,.85,.16),'ivory',.04)
        for dx in [-.90,-.6,-.3,0,.3,.6,.9]: tube('Balcony railing',(x+dx,.38,5.10),(x+dx,.38,5.82),.025,'slate')
        tube('Balcony handrail',(x-.95,.38,5.82),(x+.95,.38,5.82),.035,'gold')
    # Side facades and masonry details read well from a moving camera.
    for z in [1,1.45,3.5,3.95,5.9,6.35]:
        for side in [-1,1]: box('Corner masonry',(x+side*3.12,1.18,z),(.3,.20,.16),'ivory',.015)
    for dx in [-2.75,2.75]: planter(x+dx,-.16)
    for obj in set(bpy.context.scene.objects)-before: obj.location.y += 1.4

for x,y,s in [(-16,1,1.35),(16,1,1.4),(-12,-8,1.5),(12,-8,1.5),(-9,-13,1.25),(9,-13,1.3),(-18,-12,1.4),(18,-12,1.5)]: tree(x,y,s)
for x in [-6,6]: bench(x,-7.4)
for x in [-14,-7,7,14]:
    cylinder('Lamp base',(x,-5.9,.3),.22,.5,'slate'); cylinder('Lamp post',(x,-5.9,1.85),.065,3.3,'slate')
    box('Lantern',(x,-5.9,3.65),(.45,.45,.55),'cream',.07); box('Lantern cap',(x,-5.9,3.98),(.58,.58,.12),'slate',.04)
# A garden fountain and round cafe tables.
cylinder('Fountain basin',(0,-12,.42),1.85,.65,'ivory'); cylinder('Fountain water',(0,-12,.77),1.64,.045,'blue'); cylinder('Fountain pedestal',(0,-12,1.1),.36,.7,'stone'); cylinder('Fountain bowl',(0,-12,1.5),.85,.2,'ivory')
for x in [4.7,7.2]:
    cylinder('Cafe table',(x,-.55,.82),.47,.1,'wood'); cylinder('Table stem',(x,-.55,.46),.05,.72,'slate')
    for dx in [-.7,.7]: box('Cafe stool',(x+dx,-.55,.5),(.34,.34,.1),'wood',.08); cylinder('Stool stem',(x+dx,-.55,.27),.04,.4,'slate')
for x in [-22,22]:
    for y in [7,17,-20]:
        h=random.uniform(7,13); box('Neighbourhood backdrop',(x,y,h/2),(8,7,h),'peach' if x>0 else 'mint',.18)
        for z in range(2,int(h),3):
            for dx in [-2,0,2]: window(x+dx,y-3.52,z,1.1,1.5)
# Merge the static architecture by material to keep draw calls small.
bpy.ops.object.select_all(action='DESELECT')
for m in list(M.values()):
    objects=[o for o in bpy.context.scene.objects if o.type=='MESH' and o.data.materials and o.data.materials[0]==m]
    if not objects: continue
    for o in objects:o.select_set(True)
    bpy.context.view_layer.objects.active=objects[0]; bpy.ops.object.join(); bpy.context.object.name='Town_'+m.name; bpy.ops.object.select_all(action='DESELECT')
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,'freedom-square.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'freedom-square.glb'),export_format='GLB',export_animations=False,export_yup=True,export_draco_mesh_compression_enable=True,export_draco_mesh_compression_level=6)

# Character: shaped face, shoes and clothing; articulated limbs with named clips.
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
def pivot(name,p,parent=None):
    o=bpy.data.objects.new(name,None); bpy.context.collection.objects.link(o); o.location=p
    if parent:o.parent=parent
    return o
def attach(o,parent):
    loc=o.location.copy(); o.parent=parent; o.location=loc; return o
root=pivot('Character',(0,0,0)); hips=pivot('Hips',(0,0,.96),root)
attach(sphere('Tailored trousers',(0,0,0),(.29,.17,.23),'trousers'),hips)
body=pivot('Torso',(0,0,.13),hips)
attach(sphere('Jacket',(0,0,.26),(.31,.19,.38),'shirt'),body)
attach(box('Shirt front',(0,-.172,.27),(.20,.04,.48),'cream',.03),body)
attach(box('Jacket zip',(0,-.207,.27),(.018,.015,.50),'gold',.005),body)
head=pivot('Head',(0,0,.66),body)
attach(cylinder('Neck',(0,0,-.03),.10,.23,'skin'),head)
attach(sphere('Face',(0,-.018,.16),(.24,.21,.29),'skin'),head)
attach(sphere('Hair',(0,.025,.33),(.25,.22,.15),'hair'),head)
for x in [-.25,.25]:attach(sphere('Ear',(x,-.01,.16),(.055,.06,.09),'skin'),head)
for x in [-.087,.087]:
    attach(sphere('Eye white',(x,-.207,.20),(.044,.022,.045),'white'),head); attach(sphere('Pupil',(x,-.228,.20),(.022,.012,.028),'hair'),head)
    attach(box('Brow',(x,-.213,.275),(.085,.027,.023),'hair',.01),head)
attach(sphere('Nose',(0,-.239,.135),(.045,.047,.058),'skin'),head)
attach(box('Smile',(0,-.214,.035),(.09,.023,.018),'hair',.009),head)
legs=[];knees=[];arms=[];elbows=[]
for side in [-1,1]:
    thigh=pivot('Thigh'+str(side),(side*.16,0,-.03),hips); legs.append(thigh)
    attach(sphere('Trouser leg',(0,0,-.22),(.125,.14,.27),'trousers'),thigh)
    knee=pivot('Knee'+str(side),(0,0,-.43),thigh);knees.append(knee)
    attach(sphere('Lower leg',(0,0,-.20),(.105,.12,.24),'trousers'),knee)
    attach(box('Trainer',(0,-.095,-.41),(.25,.42,.17),'shoe',.07),knee)
    attach(box('Trainer stripe',(side*.129,-.09,-.38),(.02,.24,.055),'mint',.015),knee)
    arm=pivot('Shoulder'+str(side),(side*.32,0,.48),body);arms.append(arm)
    attach(sphere('Sleeve',(side*.02,0,-.14),(.115,.13,.22),'shirt'),arm)
    elbow=pivot('Elbow'+str(side),(side*.025,0,-.31),arm);elbows.append(elbow)
    attach(sphere('Forearm',(0,0,-.13),(.078,.09,.17),'skin'),elbow)
    attach(sphere('Hand',(0,-.015,-.30),(.083,.067,.1),'skin'),elbow)
animated=[hips,body,head]+legs+knees+arms+elbows
base_positions={o:o.location.copy() for o in animated}
for clip,length,stride in [('Idle',80,.025),('Walk',32,.58),('Run',22,.92)]:
    for o in animated:
        o.animation_data_create(); o.animation_data.action=None
    for frame in range(1,length+2):
        phase=(frame-1)/length*math.tau
        for o in animated:o.rotation_euler=(0,0,0);o.location=base_positions[o]
        hips.location.z += (.025*math.sin(phase) if clip=='Idle' else .055*abs(math.sin(phase)))
        body.rotation_euler.y = math.sin(phase)*(.02 if clip=='Idle' else .045)
        body.rotation_euler.x = -.10 if clip=='Run' else 0
        for i in range(2):
            swing=math.sin(phase+i*math.pi)
            legs[i].rotation_euler.x=swing*stride
            knees[i].rotation_euler.x=max(0,-swing)*stride*.9
            arms[i].rotation_euler.x=-swing*stride*.75
            elbows[i].rotation_euler.x=-.2-(.7 if clip=='Run' else .2)
        for o in animated:o.keyframe_insert('location',frame=frame);o.keyframe_insert('rotation_euler',frame=frame)
    for o in animated:
        action=o.animation_data.action;action.name=clip+'_'+o.name
        track=o.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action);o.animation_data.action=None
bpy.context.scene.render.fps=30
bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(SOURCE,'town-character.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'town-character.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_yup=True)
print('FREEDOM SQUARE ASSETS EXPORTED')
