from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, sys
K=2; W,H=1200*K,630*K
PINE=(24,56,42); PINE2=(18,44,33); CREAM=(241,236,222); OCHRE=(196,118,40); LEAF=(52,110,78); SKY=(214,226,214)
F="/usr/share/fonts/opentype/inter/"
def font(n,s): return ImageFont.truetype(F+n,s*K)
im=Image.new("RGB",(W,H),PINE); d=ImageDraw.Draw(im)
# fondo: curvas de nivel suaves
for i in range(14):
    r=(260+i*70)*K
    d.ellipse([W-260*K-r, H+60*K-r, W-260*K+r, H+60*K+r], outline=(30,66,50), width=2*K)
d.rectangle([0,H-14*K,W,H],fill=OCHRE)

def emblem(cx,cy,R):
    e=Image.new("RGBA",(W,H),(0,0,0,0)); g=ImageDraw.Draw(e)
    g.ellipse([cx-R,cy-R,cx+R,cy+R],fill=CREAM)
    g.ellipse([cx-R+10*K,cy-R+10*K,cx+R-10*K,cy+R-10*K],fill=PINE2)
    ri=R-62*K
    g.ellipse([cx-ri-6*K,cy-ri-6*K,cx+ri+6*K,cy+ri+6*K],fill=OCHRE)
    # escena interior
    sc=Image.new("RGBA",(2*ri,2*ri),SKY+(255,)); s=ImageDraw.Draw(sc)
    s.ellipse([ri*1.18,ri*.32,ri*1.5,ri*.64],fill=(236,204,140))
    s.polygon([(0,ri*1.35),(ri*.55,ri*.62),(ri*.95,ri*1.1),(ri*1.3,ri*.78),(2*ri,ri*1.4),(2*ri,2*ri),(0,2*ri)],fill=(118,140,128))
    s.polygon([(ri*.42,ri*.83),(ri*.55,ri*.62),(ri*.68,ri*.83),(ri*.6,ri*.8),(ri*.55,ri*.86),(ri*.5,ri*.8)],fill=(250,250,246))
    s.rectangle([0,ri*1.42,2*ri,2*ri],fill=LEAF)
    # pino
    tx=ri*.98
    for k,(w,y0,y1) in enumerate([(.62,1.55,1.18),(.5,1.28,.92),(.38,1.02,.66),(.24,.78,.44)]):
        s.polygon([(tx-ri*w/2,ri*y0),(tx,ri*y1-ri*.12),(tx+ri*w/2,ri*y0)],fill=PINE)
    s.rectangle([tx-ri*.05,ri*1.55,tx+ri*.05,ri*1.75],fill=(92,62,38))
    m=Image.new("L",(2*ri,2*ri),0); ImageDraw.Draw(m).ellipse([0,0,2*ri,2*ri],fill=255)
    e.paste(sc,(cx-ri,cy-ri),m)
    # texto en arco
    def arc(text,ang0,ang1,rad,fnt,col,top=True):
        n=len(text); 
        for i,ch in enumerate(text):
            a=ang0+(ang1-ang0)*(i+.5)/n
            tw=g.textbbox((0,0),ch,font=fnt); cw,chh=tw[2]-tw[0],tw[3]-tw[1]
            t=Image.new("RGBA",(cw*3+4,chh*3+4),(0,0,0,0)); ImageDraw.Draw(t).text((cw,chh),ch,font=fnt,fill=col,anchor="lt")
            rot=(a-90) if top else (a+90)
            t=t.rotate(rot,resample=Image.BICUBIC,expand=True)
            x=cx+rad*math.cos(math.radians(a)); y=cy-rad*math.sin(math.radians(a))
            e.alpha_composite(t,(int(x-t.width/2),int(y-t.height/2)))
    fa=font("Inter-ExtraBold.otf",27)
    arc("GUARDAPARQUES",150,30,R-34*K,fa,CREAM)
    arc("· ARGENTINA ·",-140,-40,R-36*K,font("Inter-Bold.otf",24),(214,196,160),top=False)
    return e
em=emblem(300*K,315*K,232*K)
sh=em.split()[3].filter(ImageFilter.GaussianBlur(14*K)).point(lambda v:v*.5)
shadow=Image.new("RGBA",(W,H),(0,0,0,0)); shadow.putalpha(sh)
im=im.convert("RGBA"); im.alpha_composite(shadow,(0,10*K)); im.alpha_composite(em)
d=ImageDraw.Draw(im)
x=592*K
d.text((x,150*K),"PARQUES NACIONALES · ARGENTINA",font=font("Inter-SemiBold.otf",22),fill=(214,196,160),spacing=0)
d.text((x,190*K),"Actas",font=font("Inter-ExtraBold.otf",92),fill=CREAM)
d.text((x,290*K),"Guardaparques",font=font("Inter-ExtraBold.otf",64),fill=CREAM)
d.rectangle([x,392*K,x+72*K,398*K],fill=OCHRE)
d.text((x,420*K),"Infracción y constatación en el",font=font("Inter-Medium.otf",30),fill=(200,214,204))
d.text((x,460*K),"teléfono. Funciona sin señal.",font=font("Inter-Medium.otf",30),fill=(200,214,204))
out=im.convert("RGB").resize((1200,630),Image.LANCZOS)
out.save(sys.argv[1],optimize=True)
