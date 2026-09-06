"""Refine the original character with grounded footsteps and interaction clips.
Run after build-town-assets.py, using Blender --background --python this-file.
Safe to rerun; no external assets are used.
"""
import bpy, math, os
from mathutils import Vector
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE=os.path.join(ROOT,'assets/town/town-character.blend')
bpy.ops.wm.open_mainfile(filepath=SOURCE)
for obj in bpy.data.objects: obj.animation_data_clear()
for action in list(bpy.data.actions): bpy.data.actions.remove(action)
hips=bpy.data.objects['Hips']; body=bpy.data.objects['Torso']; head=bpy.data.objects['Head']
legs=[bpy.data.objects['Thigh'+str(s)] for s in [-1,1]]
knees=[bpy.data.objects['Knee'+str(s)] for s in [-1,1]]
arms=[bpy.data.objects['Shoulder'+str(s)] for s in [-1,1]]
elbows=[bpy.data.objects['Elbow'+str(s)] for s in [-1,1]]
ankles=[]
for i,side in enumerate([-1,1]):
    name='Ankle'+str(side)
    ankle=bpy.data.objects.get(name)
    if ankle is None:
        ankle=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(ankle);ankle.parent=knees[i];ankle.location=(0,0,-.41)
        for child in list(knees[i].children):
            if child.type=='MESH' and child.name.startswith('Trainer'):
                loc=child.location.copy();child.parent=ankle;child.location=loc-Vector((0,0,-.41))
    ankles.append(ankle)
    name='Grip'+str(side)
    if bpy.data.objects.get(name) is None:
        grip=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(grip);grip.parent=elbows[i];grip.location=(0,-.015,-.30)
animated=[hips,body,head]+legs+knees+arms+elbows+ankles
base={o:o.location.copy() for o in animated};base[hips]=Vector((0,0,.88))
# Foot travel / stance time gives the ground speed used by the Three.js mixer.
# Walk: 0.84m / 0.64s = 1.3125m/s. Run: 0.90m / 0.533s = 1.6875m/s.
for clip,length in [('Idle',90),('Walk',32),('Run',32),('Serve',120),('Wave',72),('Celebrate',90)]:
    for o in animated:o.animation_data_create();o.animation_data.action=None
    for frame in range(1,length+2):
        t=(frame-1)/length;phase=t*math.tau
        for o in animated:o.rotation_euler=(0,0,0);o.location=base[o]
        moving=clip in ['Walk','Run']
        hips.location.z=.82+( .017*math.cos(phase*2) if moving else .006*math.sin(phase))
        body.rotation_euler.x=-.07 if clip=='Run' else -.015
        body.rotation_euler.z=.025*math.sin(phase) if moving else .008*math.sin(phase)
        for i in range(2):
            cycle=(t+i*.5)%1
            stance=.6 if clip=='Walk' else .5
            travel=.84 if clip=='Walk' else .90
            y=-.095;lift=0
            if moving:
                if cycle<stance:y=-travel/2+travel*cycle/stance
                else:
                    swing=(cycle-stance)/(1-stance)
                    y=travel/2-travel*(.5-.5*math.cos(math.pi*swing))
                    lift=(.10 if clip=='Walk' else .20)*math.sin(math.pi*swing)
            # Two-bone sagittal IK; ankle cancels leg pitch to keep trainers level.
            target_z=.09+lift-(hips.location.z-.03)
            d=min(.839,math.hypot(y+.095,target_z));a=.43;b=.41
            bend=math.acos(max(-1,min(1,(d*d-a*a-b*b)/(2*a*b))))
            thigh=math.atan2(y+.095,-target_z)-math.atan2(b*math.sin(bend),a+b*math.cos(bend))
            legs[i].rotation_euler.x=thigh;knees[i].rotation_euler.x=bend;ankles[i].rotation_euler.x=-thigh-bend
            arms[i].rotation_euler.x=(-.36*math.sin(phase+i*math.pi) if moving else -.06)
            elbows[i].rotation_euler.x=-.9 if clip=='Run' else -.22
        if clip=='Serve':
            reach=math.sin(math.pi*min(1,max(0,(t-.05)/.85)))**.7
            arms[1].rotation_euler.x=-.1-reach*1.0;elbows[1].rotation_euler.x=-.22-reach*.45
            body.rotation_euler.x=-.035*reach;head.rotation_euler.x=.08*reach
        elif clip=='Wave':
            envelope=math.sin(math.pi*t)**.6
            arms[1].rotation_euler.y=-1.1*envelope;arms[1].rotation_euler.x=-.45*envelope
            elbows[1].rotation_euler.x=-.25-1.45*envelope;elbows[1].rotation_euler.y=.22*math.sin(phase*3)*envelope
        elif clip=='Celebrate':
            envelope=math.sin(math.pi*t)**.6
            for i,side in enumerate([-1,1]):
                arms[i].rotation_euler.y=-side*2.15*envelope;elbows[i].rotation_euler.x=-.3-.4*envelope
            head.rotation_euler.x=-.12*envelope
        for o in animated:o.keyframe_insert('location',frame=frame);o.keyframe_insert('rotation_euler',frame=frame)
    for o in animated:
        action=o.animation_data.action;action.name=clip+'_'+o.name
        track=o.animation_data.nla_tracks.new();track.name=clip;track.strips.new(clip,1,action);o.animation_data.action=None
bpy.context.scene.render.fps=30;bpy.context.scene.frame_set(1)
bpy.ops.wm.save_as_mainfile(filepath=SOURCE)
bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT,'public/models/town/town-character.glb'),export_format='GLB',export_animations=True,export_animation_mode='NLA_TRACKS',export_force_sampling=True,export_yup=True)
print('REFINED CHARACTER EXPORTED: Idle Walk Run Serve Wave Celebrate')
