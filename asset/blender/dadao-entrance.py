"""Festival portal and parked scooter for zone 1.
Portal proportions reviewed against issue-18-archway:nianhuo_archway.py.
Use the existing palette and omit its undated zodiac sculpture and violet wrap.
"""
import os, sys, math
sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import stylized as S
from stylized import bm_box, bm_bar, bm_solid, bm_lathe, solid
from mathutils import Matrix

def boxes(name,col,items,group):
    solid(name,col,lambda bm:[bm_box(bm,size,pos) for size,pos in items],bevel=.025,group=group)

def build():
    # A temporary festival structure, not a temple gate: square wrapped piers and steel bracing.
    boxes('portal','verm',[((1.35,1.15,6.4),(x,0,3.2)) for x in (-6.35,6.35)]+[((14.05,1.15,1.8),(0,0,7.3))], 'portal')
    boxes('cornices','lamp',[((14.3,1.3,.13),(0,0,z)) for z in (6.42,8.22)]+[((1.52,1.3,.2),(x,0,.1)) for x in (-6.35,6.35)],'portal')
    boxes('panel_frames','bone',[((1.16,.12,.065),(x,-.62,z)) for x in (-6.35,6.35) for z in (.6,5.7)],'portal')
    solid('diamonds','lamp',lambda bm:[bm_solid(bm,[(x,z-.32),(x+.32,z),(x,z+.32),(x-.32,z)],-.69,-.6) for x in (-6.35,6.35) for z in (1.1,2.1,3.1,4.1,5.1)],bevel=.025,group='portal')
    solid('bracing','ink',lambda bm:[bm_bar(bm,(x,.65,.1),(x,.5,6.5),.09) for x in (-6.8,-5.9,5.9,6.8)]+[bm_bar(bm,(x,1.6,.1),(x,.6,6.5),.09) for x in (-6.35,6.35)],bevel=0,group='portal')
    # Scooter front toward -Y, two wheels on the centreline. Kept parked before the festival.
    solid('tyres','ink',lambda bm:[bm_lathe(bm,[(.17,-.055),(.25,-.055),(.27,0),(.25,.055),(.17,.055)],12,Matrix.Translation((0,y,.28))@Matrix.Rotation(math.pi/2,4,'Y')) for y in (-.61,.61)],bevel=0,group='scooter')
    boxes('body','haze',[((.44,.65,.42),(0,.38,.57)),((.45,.7,.1),(0,-.03,.3)),((.4,.15,.7),(0,-.52,.73))],'scooter')
    boxes('saddle','ink',[((.45,.78,.12),(0,.27,.85))],'scooter')
    boxes('lights','bone',[((.25,.1,.15),(0,-.64,1.13)),((.17,.04,.12),(0,.76,.44))],'scooter')
    solid('handlebars','ink',lambda bm:[bm_bar(bm,(-.32,-.53,1.16),(.32,-.53,1.16),.06)]+[bm_bar(bm,(x,-.53,1.16),(x*1.2,-.49,1.4),.025) for x in (-.24,.24)],bevel=0,group='scooter')
    boxes('mirrors','bone',[((.15,.06,.09),(x,-.49,1.43)) for x in (-.29,.29)],'scooter')
    solid('forks','haze',lambda bm:[bm_bar(bm,(x,-.6,.27),(x,-.5,.96),.04) for x in (-.075,.075)],bevel=0,group='scooter')

if __name__=='__main__':
    S.run(build,camera=((10,-20,6),(0,0,4),50))
