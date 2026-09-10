pico-8 cartridge // http://www.pico-8.com
version 43
__lua__
-- void rescue
-- procedural arcade shooter
-- prototype v0.1
function _init()
gamemode,colval=0,0
end

function game_init()
mapsize,wave,dif,live,sbomb,
invis,bombdelay,score,extra,
capmessage,baitertime,bonusc,
wavedelay,humcount,spenemynum,
podnum,landernum,warpdelay,wavemode,
waveshow,space,planetdest,respawn,gamovr,landerkill,capmessagetype=
unpack(
split '1024,1,0,2,3,20,0,0,0,0,0,0,-170,0,0,0,0,0,-1,0,0,0,0,0,0,0'
)

sfx(0)

reset_player()

stargate,humanoid,enemy,bullet,particle,mountain,star=
{sp=32,x=nil,y=48,dx=0,dy=0},{},{},{},{},{},{}


for s=1,18 do
    local st = {
x=0,
y=0,
dx=0,
dy=0,
tim=0,
col=0
}
add(star,st)
end

generate_planet()

end

function reset_player()
player={
dead=0,
sp=1,
hp=1,
team=0,
see=1,
x=384,
y=63,
dx=0,
dy=0,
inv=nil,
thrust=0,
capnum=0,
hyper=0,
btn1check=1,
btn2check=1
}

camcom,podinceptime=40-64,0

camerax=player.x+camcom

end

function generate_planet()

local my,mdir,mdelay,volcano=unpack(split '105,-1,5,-1')

for i=1,mapsize do

if mdelay==0 then
mdir,mdelay=rnd({-1,0,1}),2+flr(rnd(5))

if volcano~=0 then
mdir=rnd({0,volcano,volcano})
else

if my<102 then
mdir=1
end

if my>118 then
mdir=-1
end

if i>994 then

if my>105 then 
mdir=-1
end
if my<105 then
mdir=1
end

mdelay=1

end

end

end

my+=mdir
mdelay-=1

if my<78 then
volcano=1
end

if my>110 then
volcano=0
end

local nois = 2
if mdir~=0 or mdelay==0 then
nois=0
end

if i==mapsize and my==106 then
my=105
end

add(mountain,my-flr(rnd(nois)))
end

humanoid={}

for h=1,10 do
    local hu = {
spawn=0,
hp=1,
sp=2,
x=0,
y=0,
dx=0,
dy=0,
walk=0,
wadelay=0,
see=rnd({1,-1}),
capt=0,
owner=nil,
team=1
}
add(humanoid,hu)
end

end

function start_wave()

landerkill=-1
local bomber,dynamo,pod,swarmer,firebomber,spaceguppy=unpack(split '0,0,0,0,0,0')

if wave%5==0 then

if wave%10==0 then
pod,firebomber=6,13
else
dynamo,spaceguppy,swarmer=6,22,8
end

else

if wave==1 then
landernum,dynamo,firebomber=11,2,3
end

if wave==2 then
landernum,dynamo,firebomber,spaceguppy=unpack(split '10,2,3,7')
end

if wave==3 then
landernum,dynamo,firebomber,spaceguppy,pod=unpack(split '10,2,6,4,3')
end

if wave==4 then
landernum,dynamo,firebomber,spaceguppy,pod=unpack(split '17,3,3,5,4')
end

if wave==6 then
landernum,dynamo,firebomber,spaceguppy,pod,bomber=unpack(split '17,3,3,5,4,2')
end

if wave==7 or wave==8 or wave==9 then
landernum,dynamo,firebomber,spaceguppy,pod,bomber=unpack(split '17,3,3,5,4,3')
end

if wave>=10 then
landernum,dynamo,firebomber,spaceguppy,pod,bomber=unpack(split '18,4,4,3,4,2')
end

end

spawn_enemy(bomber,1)

spawn_enemy(dynamo,4)

spawn_enemy(pod,2)

spawn_enemy(swarmer,3)

spawn_enemy(firebomber,6)

spawn_enemy(spaceguppy,7)

podincepx=rnd(mapsize)
podinceptime=3+flr(abs(player.x-podincepx)/90)

if landernum>0 then
landerkill=0
end

end

function _update60()

colval+=0.2
if colval>24 then
colval=0
end

if gamemode==0 then
if btnp(5) or btnp(4) then
gamemode=1
game_init()
end
else


if wavemode==0 and respawn==-1 then
gamovr+=1
if gamovr==180 then
gamemode=0
end
end

if wavedelay<0 then
baitertime=0
end

if score>=10000 then
music(2)
score-=10000
extra+=1
live+=1
sbomb+=1
invis+=10
if respawn==-1 then
respawn=0
end
end

if bombdelay>0 then
bombdelay-=1
end

if capmessage>0 then
capmessage-=1
end

if wavemode==2 then
if warpdelay>0 then
warpdelay-=1
if warpdelay==0 then
wavemode,camcom=0,player.see*40-64
end
end

if warpdelay<0 then
warpdelay+=1
if warpdelay==0 then
wavemode,wavedelay,bonusc=1,0,2000
end
end
end

if wavemode==1 then





if wavedelay==0 then
if humcount<#humanoid and waveshow<2 then
humcount+=1
score+=bonusc
wavedelay=5
else
wavedelay=-120
end
else
if wavedelay>0 then
wavedelay-=1
else
wavedelay+=1
if wavedelay==0 then

if respawn>-1 and waveshow<=0 and (wave+1)%5==0 then
wavedelay,waveshow=-180,1
if (wave+1)%10==5 then
space=1
end
else

wave+=1

local wavecom=wave-3

if (wave)%5==1 or (waveshow==-1 and wave>wavecom+(5-wavecom%5)) then
space=0
generate_planet()
end

dif=wave-1
if dif>15 then
dif=15
end

if respawn~=-1 then
reset_player()
end
capmessage,waveshow,humcount,wavemode,
wavedelay,enemy,bullet,particle,landernum,spenemynum,stargate.x
=0
,0
,0
,-1
,-60
,{}
,{}
,{}
,0
,0
,nil

foreach(humanoid,function(e)
e.spawn=0
end)

end

end
end
end

end

if wavemode<=0 then

if #humanoid==0 and space==0 then
bullet,particle,stargate.x,space,wavedelay,planetdest,spenemynum,player.bulnum
={}
,{}
,nil
,1
,-360
,240
,0
,0
foreach(enemy,function(e)
e.spawn,e.spawndelay=0
,-1
if e.etype==0 then
e.mutant,e.radarc=1
,-2
end
if e.spenemy~=nil then
del(enemy,e)
end
end)
create_particle(mountain,0,1.5)

end

if planetdest>0 then
planetdest-=1

if planetdest>180 or planetdest%10==0 then
sfx(16)
end

if planetdest<=180 and planetdest%10==0 then
local f={sp=15,x=camerax+rnd(127),y=18+rnd(109)}
create_particle(f,0,1.5)
end
end

if wavemode==0 and space==0 and landernum==0 and landerkill==0 then 
landerkill,capmessage,capmessagetype=-1,180,2
end

if player.hp>0 or player.hp==-66 then
local camloc,psp=player.see*40-64,player.dx*4

if camcom>camloc then
camcom-=2
end
if camcom<camloc then
camcom+=2
end

if player.dx<0 then
psp+=1
end

camerax=player.x-psp+camcom
end

if player.hp~=-100 then

foreach(star,function(s)
update_unit(s,-2)
end)

foreach(bullet,function(b)
update_unit(b,2)

if player.team~=b.team then
col_sprite(b,player)
end

foreach(bullet,function(e)
if e.team~=b.team and e.candest==1 then
col_sprite(b,e)
end
end)

foreach(enemy,function(e)
if e.team~=b.team and screencheck(e.x)==true and e.spawn~=0 then
col_sprite(b,e)
end
end)
foreach(humanoid,function(h)
if h.team~=b.team and screencheck(h.x)==true then
col_sprite(b,h)
end
end)

end)

foreach(humanoid,function(h)
update_unit(h,-1)
end)

foreach(enemy,function(e)
update_unit(e,1)
if e.spawn==1 then
col_sprite(e,player)
end
end)

end

if respawn>0 and planetdest==0 then
respawn-=1

if respawn==100 or respawn==94 or respawn==88 then
player.hp=-100
local e={sp=15,x=player.x,y=player.y,pde=1}
create_particle(e,0,0.5)
end

if respawn==0 then
if live>0 then
live-=1
reset_player()
bullet,stargate.x,particle={},nil,{}
if wavemode~=-2 then
wavedelay=-60
end
spenemynum=0
foreach(humanoid,function(e)
e.spawn=0
end)
foreach(enemy,function(e)
e.spawn,e.spawndelay=0,-1
if e.etype==0 and e.mutant==0 then
landernum+=1
landerkill-=1
del(enemy,e)
end
if e.spenemy~=nil then
del(enemy,e)
end
end)
else
respawn=-1
end

end

end

foreach(particle,function(p)
update_unit(p,3)
end)

update_unit(player,0)

if wavedelay<0 then
wavedelay+=1
if wavedelay==0 then
stargate.x=rnd({512,853,171})
if wavemode==-1 then
wavemode=0
start_wave()
end
end

else

if podinceptime>0 then
podinceptime-=1/60
end

if landernum>0 then
if wavedelay==0 then
for i=1,4 do
if landernum>0 then
landernum-=1
landerkill+=1
spawn_enemy(1,0)
end
end
if landernum>0 then
local wd=540-wave*60
if space==1 then
wd=20
elseif wd<240 then
wd=240
end
wavedelay=wd
end
else
wavedelay-=1
end
else
local enum=#enemy-spenemynum

if wavedelay==0 then
if baitertime==0 then
wavedelay=120+enum*(120-dif*5)
else
wavedelay=480-dif*8-baitertime*30
end
else
wavedelay-=1
if wavedelay==0 then
if baitertime<6 then
baitertime+=1
end
spawn_enemy(1,rnd({8,9}))
end
end

if enum==0 then
wavemode=-2
local cl=0

for h=1,#humanoid do
if humanoid[h].capt==1 or humanoid[h].capt==2 then
cl=1
end
end

if respawn<1 and cl==0 then
bonusc=wave*100
if bonusc>500 then
bonusc=500
end
wavemode,wavedelay=1,0
if wave%10==5 then
waveshow=2
score+=2500
end
end

end
end

end

end


end

end

function update_unit(u,t)

u.x+=u.dx
u.y+=u.dy

if u.x<0 then
u.x+=mapsize
if u==player then
camerax+=mapsize
end
elseif u.x>=mapsize then
u.x-=mapsize
if u==player then
camerax-=mapsize
end
end

if t==-2 then
if u.tim==0 then
u.col,u.tim,u.x,u.y
=8+flr(rnd(7))
,30+flr(rnd(30))
,camerax-40+rnd(168)
,18+rnd(109)
else
u.tim-=1
end
end

if t==0 then

if player.hp>0 then
if btn(0) or btn(1) then
player.thrust=1
if btn(1) then
player.dx+=0.065
player.see=1
else
player.dx-=0.065
player.see=-1
end
else
player.thrust=0
end

if player.thrust==1 then
sfx(5)
end

if btn(2) then
player.dy-=0.2
if player.dy<-1 then player.dy=-1 end
else
if player.dy<0 then
player.dy=0
end
end
if btn(3) then
player.dy+=0.2
if player.dy>1 then player.dy=1 end
else
if player.dy>0 then
player.dy=0
end
end

player.dx-=player.dx/45

if player.y<21 then 
player.y,player.dy=21,0
end
if player.y>126 then 
player.y,player.dy=126,0
end

if btn(5) then
if player.btn2check==0 then
player.btn2check=1
fire_bullet(player,player.x+player.see*10,player.y,90-(player.see*90),4,0)
sfx(1)
end
else
player.btn2check=0
end

if btn(4) then
if player.btn1check==0 then
player.btn1check=1
if player.btn2check==1 then
if sbomb>0 then
sbomb-=1
bombdelay=18
sfx(2,3)
foreach(enemy,function(e)
if e.spawn==1 and screencheck(e.x)==true then
e.hp=-2
end
end)
end
else

if invis>0 then
if player.inv==nil then
player.inv=1
create_particle(player,0)
else
player.inv=nil
end
else
if wavemode==0 then
player.x,player.y,player.see,player.hp,
player.hyper,player.thrust,warpdelay,wavemode
=rnd(mapsize)
,31+rnd(64)
,rnd({-1,1})
,-66
,39
,0
,30
,2
end
end

end

end
else
player.btn1check=0
end

if player.inv==1 then
if invis>0 then
invis-=0.1
else
player.inv=nil
end
end

if stargate.x~=nil then
if player.x>=stargate.x-4 and player.x<=stargate.x+5 and
player.y>=stargate.y-3 and player.y<=stargate.y+4 then
if player.capnum>=4 and wave<=10 then
wave+=2
waveshow,warpdelay,wavemode=-1,-180,2
sfx(23)
else
if player.capnum>0 and wave<=10 then
capmessage,capmessagetype=210,1
end

local gox=player.x+512

if #humanoid>0 then
for h=1,#humanoid do
if humanoid[h].capt==1 then
gox=humanoid[h].x-player.see*(40+rnd(20))
if player.y>humanoid[h].y-10 then
player.y=humanoid[h].y-10
end
end
end
end

player.x,player.dx,bullet,particle,warpdelay,wavemode=gox
,0
,{}
,{}
,30
,2
end

end
end

else
player.dx,player.dy=0,0
if player.hyper==0 then
if player.dead==0 then
player.dead,respawn=1,120
music(1)
end
else
if player.hyper==39 then
sfx(6)
create_particle(player,-1)
end
player.hyper-=1
if player.hyper==0 then
player.hp=rnd({1,1,1,0})
end
end
end

player.sp=(player.see+1)/2+player.dead*16

end

if t==-1 then
local mox=flr(u.x)

if u.spawn==0 then
if space==0 then
local hx=flr(rnd(mapsize))
u.x,u.y,u.spawn,u.capt,u.owner,u.dy=hx
,124
,1
,0
,nil
,0

else
del(humanoid,u)
end
else

if u.owner~=nil and u.owner.hp<=0 then
u.owner=nil
if u.capt==1 then
u.capt=2
sfx(19)
else
u.capt=0
end
end

if u.capt<=0.5 then
u.wadelay+=0.025
if u.wadelay>=1 then
u.walk+=1
if u.walk>1 then
u.walk=0
end

local ygo=rnd({-1,0,1})
if u.y<mountain[mox+1] then
ygo=1
end
if u.y>124 then
ygo=-1
end

u.y+=ygo
u.x+=u.see

u.wadelay=0
end
end

if u.capt==2 then
if col_sprite(player,u,1)==1 then
u.capt,u.dy=3,0
player.capnum+=1
local bn=500*player.capnum
if bn>2000 then bn=2000 end
create_particle(u,2,0,0,bn)
sfx(21)
end

u.dy+=0.0075
if u.y>=mountain[mox+1] then
if u.dy>=0.6 then
u.hp=0
else
u.capt,u.dy=0,0
create_particle(u,2,0,0,250)
sfx(20)
end
end

end

if u.capt==3 then
u.see,u.x,u.y=player.see
,player.x-(player.see+1)/2
,player.y+6
if u.y>=mountain[mox+1] then
u.capt=0
player.capnum-=1
create_particle(u,2,0,0,500)
sfx(20)
end
end

u.sp=3-u.see+u.walk

end

if u.hp<=0 then
create_particle(u,0)
del(humanoid,u)
sfx(16)
if #humanoid<4 and #humanoid>0 then
capmessage,capmessagetype=180,0
end
end

end

if t==1 then

if u.spawn==0 and u.spawndelay==-1 then

if u.etype==0 and u.mutant==0 then
u.x,u.y=0+rnd(mapsize),26
else
u.x,u.y=player.x+512-240+rnd(480)
,player.y-18-rnd(83)
end

if u.etype==2 then
u.movspd=0.6+rnd(0.3)
if podinceptime>0 then
u.x=podincepx-(u.movspd*((podinceptime-1)*60)*u.godir)
else
u.godir=rnd({1,-1})
end
end

if u.etype==3 or u.etype==7 then
local ds=u.etype*15
u.x=player.x+512-ds+rnd(ds*2)
end

if u.etype==4 then
u.x-=128
u.maxshoot=1+dif\2
end

if u.etype>=8 then
u.x=camerax+rnd(127)
if u.etype==9 then
u.maxshoot=3
end
end

u.spawndelay=0

end

if u.y<17 then
u.y+=111
elseif u.y>=128 then
u.y-=111
end

local mex,mey,tax,tay=u.x,u.y,player.x,player.y

if abs(mex-tax)>512 then
if mex>tax then
mex-=mapsize
else
mex+=mapsize
end
end

local shdir = di(mex,mey,tax,tay)

if u.spawn==0 then
u.dx,u.dy=0,0

if wavedelay>=0 then

if u.spawndelay==0 then
sfx(6)
u.spawndelay=39
if abs(mex-tax)<=205 then
create_particle(u,-1)
end
else
u.spawndelay-=1
if u.spawndelay==0 then
u.spawn,u.spawndelay=1
,-1
end
end

end

else

local movspd,setdelay,vermov,screenck= u.movspd,u.setmaxshtdelay,u.movspd/1.5,screencheck(u.x)

if u.etype==0 then

shdir+=-20+rnd(40)

if u.mutant==0 then

if u.humtgt==nil and u.ctch==0 and #humanoid>0 then

local tg=0

for h=1,#humanoid do
if humanoid[h].owner==nil and humanoid[h].capt==0 and tg==0 then
u.humtgt,humanoid[h].owner,tg
=humanoid[h]
,u
,1
end
end

if tg==0 then
local ht=1+flr(rnd(#humanoid))
if humanoid[ht].capt==0 then
u.humtgt=humanoid[ht]
end
end

end

if (u.humtgt~=nil and abs(u.humtgt.x-u.x)<=1) or u.ctch==1 then
if u.ctch==0 then
u.x,u.humtgt.owner,u.humtgt.capt
=u.humtgt.x
,u
,0.5
u.y+=vermov
if u.y>=u.humtgt.y-8 then
u.ctch,u.humtgt.capt=1
,1
music(0)
end
else
if u.y>26 then
u.y-=vermov
if u.humtgt~=nil then
u.humtgt.y=u.y+8
end
else
if u.humtgt==nil then
u.ctch,u.spawn=0,0
else
if u.humtgt.y>u.y then
u.humtgt.y-=vermov
else
u.humtgt.hp,u.mutant,u.shtdelay,u.ctch=0
,1
,0
,0

landerkill-=1
end

end
end

end
else

local dey=mountain[flr(u.x)+1]-20

if abs(u.y-dey) > 2 then
if u.y<dey then
u.y+=vermov
end
if u.y>dey then
u.y-=vermov
end
end

u.x+=u.godir*movspd

u.ani+=0.2
if u.ani>3 then
u.ani=0
end
end

if u.humtgt~=nil and (u.humtgt.hp<=0 or (u.ctch==0 and u.humtgt.capt>=0 and u.humtgt.owner~=u)) then
u.humtgt=nil
end

else

if mex>tax then
u.x-=movspd*1.5
end
if mex<tax then
u.x+=movspd*1.5
end

if abs(mex-tax)<=16 then
if mey>tay then
u.y-=movspd
end
if mey<tay then
u.y+=movspd
end
else

if abs(mey-tay)<=3 then
if mey>tay then
u.y+=movspd
end
if mey<tay then
u.y-=movspd
end
end

end

u.x+=movspd*rnd({-1,0,1})
u.y+=movspd*rnd({-1,0,1})

u.radarc,u.ani,u.deadsound=-2,3,15

end

u.maxshtdelay=setdelay+flr(rnd(setdelay*5))*(1-u.mutant)

u.sp=64+u.ani
end

if u.etype==1 then
u.maxshtdelay=flr(rnd(setdelay))

u.dx=u.godir*movspd

local m=flr(rnd(2))
local mm=(movspd/15)*m

if abs(mey-tay)<=12 then
if mey<tay then
u.dy-=mm
else
u.dy+=mm
end
else
if u.dy<0 then
u.dy-=mm
else
u.dy+=mm
end
end

u.ani+=0.1
if u.ani>4 then
u.ani=0
end
u.sp=(68+flr(colval%3)*4)+u.ani
end

if u.etype==2 then
if u.dx==0 then
u.dx,u.dy=movspd*u.godir
,(0.1+rnd(0.1))*rnd({1,-1})
end

u.ani+=0.1
if u.ani>3 then
u.ani=0
end

u.sp=80+u.ani
end

if u.etype==3 then

shdir+=-6+rnd(12)
shdir=shdir%360

if (u.dx<0 and shdir>=135 and shdir<=225) or
(u.dx>0 and (shdir<=45 or shdir>=315)) then
u.wep=4
else
u.wep=0
end

if screenck==false or abs(mex-tax)>=70 then
if u.changedelay==0 then
u.changedelay=4+flr(rnd(19))
end
end

if u.changedelay>0 then
u.changedelay-=1
if u.changedelay==0 then
local gox=0.6
if mex>tax then
gox=-0.6
end
u.dx=gox*movspd
end
end

local mm=movspd/12*flr(rnd(2))

if abs(mey-tay)>=18 then
if mey>tay then
u.dy-=mm
else
u.dy+=mm
end
end

end

if u.etype==4 then

if u.movdelay==0 then
u.movdelay=20+flr(rnd(20))
local xgo,ygo=movspd*rnd(3),-movspd+rnd(movspd*2)
if mex<tax then
xgo=xgo*-1
end

u.dx,u.dy=xgo,ygo

else
u.movdelay-=1
end

if u.maxshoot>0 then
u.wep=6
else
u.wep=0
end

local ango=0.25
if u.dx<0 then
ango=-0.25
end
u.ani+=ango
if u.ani>3 then
u.ani=0
end
if u.ani<0 then
u.ani=3
end

u.sp=114+u.ani
end

if u.etype==5 then


if u.xran==0 then
if mex>tax then
u.x-=movspd
else
u.x+=movspd
end
end

if abs(mex-tax)<=4 then
if u.xran==0 then
u.xran=flr(rnd(1.5))
end
else
u.xran=0
end


if u.yran==0 then
if mey>tay then
u.y-=movspd/2
else
u.y+=movspd/2
end
end

if abs(mey-tay)<=2 then
if u.yran==0 then
u.yran=flr(rnd(2))
end
else
u.yran=0
end

u.ani+=0.5
if u.ani>2 then
u.ani=0
end

u.sp=118+u.ani

end

if u.etype==6 then

shdir+=-10+rnd(20)
shdir=shdir%360

if shdir<=150 and shdir>=90 then
shdir=150
end
if shdir>=210 and shdir<=270 then
shdir=210
end
if shdir>=30 and shdir<90 then
shdir=30
end
if shdir<=330 and shdir>270 then
shdir=330
end

if u.movdelay==0 then
u.movdelay=40+flr(rnd(20))
local xgo,ygo=movspd*rnd({1,-1}),-movspd+rnd(movspd*2)

u.dx,u.dy=xgo,ygo

else
u.movdelay-=1
end

if abs(mey-tay)<=5 and screenck==true and wave>1 then
u.movdelay,u.wep=50,5
local ygo=-movspd
if mey>tay then
ygo=movspd
end
u.dy=ygo
else
if u.shtdelay==0 then
u.wep=0
end
end

local ango=1
if u.dx<0 then
ango=-1
end
u.ani+=ango
if u.ani>4 then
u.ani=0
end
if u.ani<0 then
u.ani=4
end

u.sp=96+u.ani
end

if u.etype==7 then

shdir+=-6+rnd(12)
shdir=shdir%360

if (u.dx<0 and shdir>=153 and shdir<=207) or
(u.dx>0 and (shdir<=27 or shdir>=333)) then
u.wep=2
else
u.wep=0
end

if abs(mex-tax)>=10 then

if u.movdelay==0 then
u.movdelay=30+flr(rnd(30))

local xgo=movspd*(1+rnd(1.5))
if mex>tax then
xgo=xgo*-1
end

u.dx=xgo
u.see=xgo/abs(xgo)

else
u.movdelay-=1
end

end

local mm=(movspd/10)*(rnd(1.1))

if abs(mey-tay)>=3 then
if mey>tay then
u.dy-=mm
else
u.dy+=mm
end
end

u.ani=2
if u.dy>=movspd*0.3 and u.dy<movspd*0.6 then
u.ani=1
end
if u.dy>=movspd*0.6 then
u.ani=0
end
if u.dy<=movspd*-0.3 and u.dy>movspd*-0.6 then
u.ani=3
end
if u.dy<=movspd*-0.6 then
u.ani=4
end

u.sp=86.5+u.ani+u.see*2.5

end

if u.etype>=8 then

shdir+=-10+rnd(20)

if u.maxshoot~=nil then
if u.maxshoot>0 then
u.wep=7
else
u.wep=0
end
end

if u.movdelay==0 then
local mdel=(53-u.etype)-dif
u.movdelay=mdel+flr(rnd(mdel))
local xgo,ygo,boost=movspd,movspd*rnd(1),player.dx

if mex>tax then
xgo=-movspd
end
if mey>tay then
ygo=ygo*-1
end

if u.etype==8 and abs(mey-tay)<=8 then
ygo=ygo*-1
end

if screenck==false and
((mex>tax and player.dx>=0) or (mex<tax and player.dx<=0)) then
boost=0
xgo=xgo*3
end

u.dx,u.dy=xgo+boost,ygo

else
u.movdelay-=1
end

if u.etype==8 then

u.ani+=0.5
if u.ani>2 then
u.ani=0
end

u.sp=101+u.ani

else
u.ani+=0.1
if u.ani>3 then
u.ani=0
end

local spn=u.ani

u.see=1
if u.dx<0 then
u.see,spn=-1,u.ani-1
if spn<0 then
spn=0
end
end

u.sp=u.setsp+(spn)*u.see
end

end

if u.dy>movspd then u.dy=movspd end
if u.dy<-movspd then u.dy=-movspd end

if screenck==true and u.wep~=0 then
local maxdelay,shspd=flr(u.maxshtdelay),u.shtspd

if u.shtdelay==0 then
u.shtdelay=maxdelay+flr(rnd(maxdelay))
else
u.shtdelay-=1
if u.shtdelay==0 then
local shs,ewep,snd=7,u.wep,{7,11,-1,9,8,10,22}

shs=u.mutant==1 and 8 or u.etype==8 and 7 or snd[ewep]

if shs>1 then
sfx(shs)
end

if ewep>=6 then
local sty=5
if ewep==7 then
sty=11
end
spawn_enemy(1,sty,1,u.x,u.y,1,u)
u.maxshoot-=1
else
fire_bullet(u,u.x,u.y,shdir,shspd+rnd(shspd),ewep)
end

end
end
end

end

if u.hp<=0 then
create_particle(u,0)

if u.etype==0 and u.mutant==0 then
landerkill-=1
end

if u.spenemy~=nil then
spenemynum-=1
end

if u.etype==2 then
podnum-=1

spawn_enemy(4+flr(rnd(4)),3,1,u.x,u.y,u.hp+1)

end

if u.owner~=nil then
u.owner.maxshoot+=1
end

score+=u.point
sfx(u.deadsound)
del(enemy, u)
end

end

if t==2 then

if u.projty==0 then
u.gx+=u.dx
u.x=camerax+flr(u.gx)
local p=flr(rnd(3))
if p>0 then
create_particle(u,1)
end
end

if u.projty==5 then
if bombdelay==17 then
u.hp=0
end
u.dy+=0.01
if u.sp==112 then
u.sp=113
else
u.sp=112
end
end

if u.lifetime>0 then
u.lifetime-=1
end

if u.lifetime==0 or u.hp<1 or screencheck(u.x)==false or u.y>127 or u.y<18 then
if u.hp==1 or u.projty==0 then
u.hp=0
else
create_particle(u,0)
score+=u.point
if u.projty==5 then
sfx(16)
end
end
del(bullet, u)
end

end

if t==3 then

if u.party==-1 then
u.dx+=u.dx*0.02
u.dy+=u.dy*0.02
end

if u.party==1 then
u.x=camerax+flr(u.gx)
if u.owner.hp==0 then
del(particle, u)
end
end

if u.lifetime>0 and (screencheck(u.x)==true or u.party~=0) then
u.lifetime-=1
else
del(particle, u)
end

end

end

function spawn_enemy(n,t,s,x,y,shp,owner)
if n~=0 then
for i=1,n do
local spwn,esp,sx,sy=s,64,x,y
if s==nil then
spwn,sx,sy,shp=0,0,0,1
end
    local e = {
hp=shp,
team=1,
spawn=spwn,
spawndelay=-1,
sp=esp,
x=sx,
y=sy,
dx=0,
dy=0,
shtdelay=0,
maxshtdelay=0,
etype=t,
wep=0,
point=150,
radarc=11,
deadsound=12
}
if t==0 then
e.movspd,e.shtspd,e.setmaxshtdelay,e.wep,e.ani,e.godir,e.humtgt,e.ctch,e.mutant
=0.25+dif*0.04
,0.45+dif/50
,30-dif
,1
,0
,rnd({1,-1})
,nil
,0
,space
e.radarc-=space*13
end
if t==1 then
e.movspd=0.6+dif/50

e.setmaxshtdelay,e.sp,e.wep,e.dy,
e.shtspd,e.ani,e.godir,e.radarc,e.point,e.deadsound
=30-dif
,68
,3
,-e.movspd+rnd(e.movspd*2)
,0
,0
,rnd({1,-1})
,14
,250
,14
end
if t==2 then
e.sp,e.wep,e.ani,e.radarc,e.godir,e.point,e.deadsound
=80
,0
,0
,-1
,(podnum%2)*2-1
,1000
,17
podnum+=1
end
if t==3 then
e.movspd=0.6+dif/25
e.shtspd,e.maxshtdelay,e.sp,e.wep,e.godir,e.changedelay,e.dx,e.dy,e.radarc,e.deadsound
=1+dif/50
,35-dif/2
,83
,4
,0
,4+flr(rnd(19))
,-e.movspd+rnd(e.movspd*2)
,-e.movspd+rnd(e.movspd*2)
,9
,13
end
if t==4 then
e.maxshtdelay,e.movspd,e.sp,e.wep,e.ani,e.movdelay,e.radarc,e.point,e.deadsound
=63-dif*3
,0.1+dif*0.006
,114
,6
,0
,0
,-3
,200
,14
end
if t==5 then
e.movspd,e.sp,e.wep,e.ani,e.radarc,e.owner,e.xran,e.yran,e.spenemy,e.point,e.deadsound
=0.1+dif*0.04
,118
,0
,0
,15
,owner
,0
,0
,1
,100
,14
end
if t==6 then
e.maxshtdelay,e.movspd,e.shtspd,e.sp,e.wep,e.ani,e.movdelay,e.radarc,e.point,e.deadsound
=13-dif/3
,0.45+dif/75
,1+dif/50
,100
,5
,0
,0
,-4
,250
,16
end
if t==7 then
e.maxshtdelay,e.movspd,e.shtspd,e.sp,e.wep,e.ani,e.see,e.movdelay,e.radarc,e.point,e.deadsound
=16-dif/5
,0.3+dif/50
,1.2+dif/50
,86
,2
,0
,1
,0
,8
,200
,13
end
if t>=8 and t<=11 then
e.maxshtdelay,e.point,e.deadsound=75-dif,200,14
if t==8 then
e.maxshtdelay,e.setsp,e.wep,e.deadsound
=30-dif*0.75
,101
,1.5
,13
end
if t==9 then
e.setsp,e.wep=rnd({107,123}),7
end
if t==11 then
e.setsp,e.owner,e.point,e.deadsound=rnd({21,26,37}),owner,50,24
end
e.movspd,e.shtspd,e.sp,e.ani,e.see,e.movdelay,e.radarc,e.spenemy
=0.6+dif/50
,0.5+dif/100
,e.setsp
,0
,1
,0
,3
,1
end

if e.spenemy==1 then
spenemynum+=1
end
add(enemy,e)

end
end
end

function fire_bullet(t,x,y,dir,spd,ty)
local ddx,ddy=cos(dir/360)*spd,sin(dir/360)*spd

    local bul = {
    hp=1,
    projty=ty,
    dx=ddx,
    dy=ddy,
    x=x,
    y=y,
    team=t.team,
    point=0
    }
    if ty==0 then
    bul.x-=ddx
    bul.y-=ddy
    bul.sp,bul.gx,bul.lifetime
    =62,
    x-camerax-ddx,
    60
    else
    bul.point,bul.lifetime=25,240
    end
    if flr(ty)==1 or ty==4 then
    bul.sp=47

    local sup=flr(rnd(3))
    if ty==1.5 then
    sup=0
    end
    if sup==0 and ty~=4 then
    bul.dx+=player.dx
    end
    end
    if ty==2 then
    bul.sp=62
    end
    if ty==3 then
    bul.sp=46
    end
    if ty==5 then
    bul.sp,bul.candest,bul.ani,bul.lifetime,bul.point
    =112
    ,1
    ,0
    ,-1
    ,100
    end
    add(bullet,bul)
end

function create_particle(t,ty,spd,dir,sc)
if ty<=0 then

if t==mountain then

for i=0,1023 do
if screencheck(i)==true then
local pdir=90-30+rnd(60)
    local p = {
party=ty,
dx=cos(pdir/360)*spd,
dy=sin(pdir/360)*spd,
x=i,
y=mountain[i+1],
col=7,
lifetime=120
}
add(particle,p)
end
end

else

local sh = shtcoord(t.sp)
local spmidx,spmidy=sh.x+4,sh.y+4

for ix=1,7 do
for iy=1,7 do
local spx,spy=sh.x+ix,sh.y+iy
local pdir,co,spd=di(spmidx,spmidy,spx,spy),sget(spx,spy),0.6

if abs(spmidx-spx)==2 or abs(spmidy-spy)==2 then
spd=1.2
end
if abs(spmidx-spx)==3 or abs(spmidy-spy)==3 then
spd=1.8
end

if co~=0 and (ix~=4 or iy~=4) then

if t.capt==nil then
if co==15 then
co=maincol
end
if co==5 then
co=maincol2
end
if co==3 then
co=maincol3
end
end

if t.pde~=nil then
co=-1
end

    local p = {
party=ty,
dx=cos(pdir/360)*spd,
dy=sin(pdir/360)*spd,
x=t.x-4+ix,
y=t.y-4+iy,
col=co,
lifetime=60
}

if ty==-1 then
p.x+=p.dx*60
p.y+=p.dy*60
p.lifetime,p.dx,p.dy=39,cos(pdir/360)*-spd,sin(pdir/360)*-spd
end
add(particle,p)
end

end
end

end

end

if ty==1 then
    local p = {
party=ty,
dx=0,
dy=0,
x=t.x,
y=t.y,
sp=t.sp,
lifetime=4*(60-t.lifetime),
gx=t.x-camerax,
owner=t
}
add(particle,p)
end

if ty==2 then
score+=sc
    local p = {
scr=sc,
party=ty,
dx=player.dx,
dy=-rnd(0.65),
x=t.x,
y=t.y-16,
lifetime=120
}
add(particle,p)
end

end

function screencheck(x)

local px,camloc=x,camerax+64

if abs(px-camloc)>512 then
if px>camloc then
px-=mapsize
else
px+=mapsize
end
end

if px+4>=camerax and px-4<=camerax+127 then
return true
else
return false
end

end



function col_sprite(sp1,sp2,tk)
local cx=sp1.x
if abs(cx-sp2.x)>512 then
if cx>sp2.x then
cx-=mapsize
else
cx+=mapsize
end
end

if abs(cx-sp2.x)<=8 and abs(sp1.y-sp2.y)<=8 then
  
 local xoff,yoff,sh1,sh2,a,b,hit,xend,yend,x1off,x2off,y1off,y2off
 = flr(sp2.x) - flr(cx),flr(sp2.y) - flr(sp1.y),shtcoord(sp1.sp),shtcoord(sp2.sp),
 nil,nil,nil,7,7,0,0,0,0
 
 if(xoff > 0) then
  xend,x1off = 7-xoff,xoff
 elseif(xoff < 0) then
  xend,x2off = 7+xoff,-xoff
 end
 if(yoff > 0) then
  yend,y1off = 7-yoff,yoff
 elseif(yoff < 0) then
  yend,y2off = 7+yoff,-yoff
 end

 for x=0,xend do
  for y=0,yend do
  if sp1.hp>0 and sp2.hp>0 then
   a = sget(sh1.x+x+x1off,
    sh1.y+y+y1off)
   b = sget(sh2.x+x+x2off,
    sh2.y+y+y2off)
   if(a!=0 and b!=0) then
hit=1
   end
   end
  end
 end
 
 if hit==1 then
 if tk==nil then
 sp1.hp=0
 if sp2.inv==nil then
 sp2.hp=0
 end
 else
 return hit
 end
 end
 
 end
 
end


function shtcoord(sp)
 local sh = {}
 sh.x,sh.y = (sp&15)<<3,(sp\16)<<3
 return sh
end

function di(o1,o2,o3,o4)
 return atan2(o3-o1,o4-o2)*360
end
-->8
function centerx(m)
return 64-#m*2
end

function _draw()
cls()

local colc=flr(colval)
backcol,maincol,maincol2,maincol3
=0
,7+colval%8
,14-colval%8
,8

if colc%3==0 then
maincol3=10
end

if gamemode==0 then
print("void rescue",42,28,7)
print("protect colony",38,70,10)
print("recover pilots",38,80,10)
print("press 🅾️ or ❎",40,100,8)
else

mountcol=8
local cck=camerax+64
if cck>=171 and cck<512 then
mountcol=9
end
if cck>=512 and cck<853 then
mountcol=14
end

if #humanoid==1 and humanoid[1].capt==1 and colc%2==0 then
mountcol=7
end

if player.inv==1 and invis<=6 and colc%2==0 then
backcol=8
end

if bombdelay>0 and bombdelay%6==0 then
backcol=7
end

if planetdest>0 and (planetdest>180 or planetdest%10>5) then
backcol=maincol
end

if warpdelay<0 and warpdelay%20>17 then
backcol=maincol
end

rectfill(0,0,127,127,backcol)

if warpdelay<0 then
circ(63,63,warpdelay%20*5,maincol2)
end

if wavemode<=0 then

if space==0 then
for i=flr(camerax),camerax+128 do
local mx=i
if mx<0 then mx+=mapsize end
if mx>mapsize-1 then mx-=mapsize end
pset(i-camerax,mountain[mx+1],mountcol)
end
end

if space==0 then
for i=0,mapsize-1 do
if i%(mapsize/64)==0 then
radar_draw(nil,4,i,mountain[i+1])
end
end

end

foreach(star,function(s)
draw_unit(s,-2)
end)

if stargate.x~=nil then
stargate.sp=32+(colval%6)/2
draw_unit(stargate,0)
radar_draw(stargate,maincol3,nil,nil,1)
end

foreach(particle,function(p)
draw_unit(p,2)
end)

foreach(bullet,function(b)
if b.hp>0 then
draw_unit(b,0)
end
end)

foreach(humanoid,function(h)
draw_unit(h,-1)
radar_draw(h,6+colc%2)
end)

foreach(enemy,function(e)
if e.spawn==1 then
draw_unit(e,0)
end
if e.spawndelay~=0 then
local rac=e.radarc
if e.radarc==-1 then
rac=maincol
end
if e.radarc==-2 then
if colc%2==0 then
rac=maincol
else
rac=11
end
end
if e.radarc==-3 then
rac=7+(maincol%4)/2
end
if e.radarc==-4 then
if colc%3==2 then
rac=8
else
rac=12
end
end
radar_draw(e,rac)
end
end)

radar_draw(player,7)

if colc%3==0 then
pal(13, 10)
pal(14, 1)
end
if colc%3==1 then
pal(13, 1)
pal(14, 10)
end
if colc%3==2 then
pal(13, 1)
pal(14, 1)
end
pal(8, maincol3)

local plx = player.x-4-camerax

if player.hp>-2 and player.inv==nil then
spr(player.sp,plx,player.y-4)
end

if player.hp>0 then
local c=colc*3
pal(8, c)
pal(7, c+12)
pal(9, c+11)
pal(10, c+10)
pal(11, c+9)
pal(12, c+8)
pal(13, c+7)
spr(51+player.sp*2+player.thrust,plx-player.see*9,player.y-4)
pal()
end

if respawn<0 then
local m1="game over"
print(m1,centerx(m1),63,maincol)
end

end

if warpdelay>=0 then

pal(7, wave+8)
pal(8,backcol)
spr(128,0,0,16,3)
pal()

local livenum,bomnum,invistoen=live,sbomb,invis

if live>0 then
if livenum>6 then
livenum=6
end
for l=1,livenum do
spr(55+colc%3,-5+l*5,1)
end
end

pal(15,maincol)
if sbomb>0 then
if bomnum>17 then
bomnum=17
end
local tenbomb=flr(bomnum/10)
if tenbomb>=1 then
for s=1,tenbomb do
spr(50,-3+s*3,2)
end
end
for s=1,bomnum-tenbomb*10 do
spr(49,-3+tenbomb*8+s*3,2)
end
end
pal()

if invis>0 then
if invistoen>58 then
invistoen=58
end
line(0,9,0+invistoen/2,9,maincol3)
end

local score_string = "000"..score
print(extra..sub(score_string, #score_string - 3,#score_string),1,11,maincol)

if capmessage>0 then
if capmessagetype==0 then
print(#humanoid.." men",103,1,maincol3)
print("left",105,9,maincol3)
end
if capmessagetype==1 then
print(4-player.capnum.." men",103,1,mountcol)
print("to warp",99,9,mountcol)
end
if capmessagetype==2 then
if capmessage%8<4 then
print("landers",99,1,7)
print("cleaned",99,9,7)
end
end
end

if podnum>1 and wavedelay>=0 and podinceptime>0 then
print("pod atk",99,1,14)
print("0:0"..flr(podinceptime),105,9,14)
end

end

if wavemode==1 then

if waveshow<=0 then

local m1,m2,m3="attack wave "..wave,"completed","bonus x "..bonusc
if waveshow==-1 then
m1,m2="...warp to wave "..wave+1,""
end

print(m1,centerx(m1),43,maincol)
print(m2,centerx(m2),53,maincol)
print(m3,centerx(m3),73,maincol3)
if humcount>0 then
for h=1,humcount do
spr(2,26+h*6,80)
end
end

else

local m1,m2="wave "..wave+1,"yllabian dogfight"
if (wave+1)%10==0 then
m2="firebomber showdown"
end
if waveshow==2 then
m1,m2="yllabian starfleet terminated","2500 bonus"
end
print(m1,centerx(m1),53,maincol)
print(m2,centerx(m2),73,maincol3)

end

end


end

end

function draw_unit(u,t)

local px,py,camloc=u.x,u.y,camerax+64

if abs(px-camloc)>mapsize/2 then
if px>camloc then
px-=mapsize
else
px+=mapsize
end
end

px-=camerax

if t==-2 and (space==1 or py<=70) and planetdest==0 then
pset(px,py,u.col)
end

if t==-1 then
pal(8, mountcol)
spr(u.sp,px-4,py-4)
pal()
end

if t==0 then
pal(15,maincol)
pal(5,maincol2)
pal(3,maincol3)
spr(u.sp,px-4,py-4)
pal()
end

if t==2 and py>17 then
if u.party<=0 then
local c=u.col
if u.col==-1 then
c=maincol
end
pset(px,py,c)
end
if u.party==1 then
pal(7,maincol)
spr(u.sp,px-4,py-4)
pal()
end
if u.party==2 then
print(u.scr,px-5,py,maincol)
end
end

end

function radar_draw(u,c,m,m2,st)

local px,py,camloc=m,m2,camerax+64

if m==nil then
px,py=u.x,u.y
end

if abs(px-camloc)>mapsize/2 then
if px>camloc then
px-=mapsize
else
px+=mapsize
end
end

if py>0 then
local rx,ry=(px-camloc)/(mapsize/64)+63,py/(112/12)-1
if st==nil then
pset(rx,ry,c)
else
rect(rx-1,ry-1,rx+1,ry+1,c)
end

end

end
__gfx__
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
0000000ff00000000000990000009900000990000009900000000000000000000000000000000000000000000000000000000000000000000000000005555555
0000007ff700000000004f0000004f00000f4000000f400000000000000000000000000000000000000000000000000000000000000000000000000005555555
00cc77777777cc0000004f00000c4f00000f4000000f4c0000000000000000000000000000000000000000000000000000000000000000000000000005555555
9966666666666699000cdc00000cdc00000cdc00000cdc0000000000000000000000000000000000000000000000000000000000000000000000000005550555
0000655555600000000cdc00000cdc00000cdc00000cdc0000000000000000000000000000000000000000000000000000000000000000000000000005555555
00000000000000000000100000010100000010000001010000000000000000000000000000000000000000000000000000000000000000000000000005555555
00000000000000000000100000010100000010000001010000000000000000000000000000000000000000000000000000000000000000000000000005555555
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000088880000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000880088000000000000000999990009999900099999000999990009999900088888000888880008888800088888000888880000000000000000000000000
00888888888888000000000000000990009999900099999000999990009900000000088000888880008888800088888000880000000000000000000000000000
88888888888888880000000000000990000009900099999000990000009900000000088000000880008888800088000000880000000000000000000000000000
00008880088800000000000000000990009999900099999000999990009900000000088000888880008888800088888000880000000000000000000000000000
00000000000000000000000000999990009999900099999000999990009999900088888000888880008888800088888000888880000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
088888880fffffff0888888800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
080000080f00000f0800000800bbbbb000bbbbb000bbbbb000bbbbb000bbbbb00000000000000000000000000000000000000000000000000000000000000000
080888080f08880f080fff0800000bb000bbbbb000bbbbb000bbbbb000bb0000000000000000000000000000000000000000000000000000000f0f0000007000
080808080f08080f080f0f0800000bb000000bb000bbbbb000bb000000bb00000000000000000000000000000000000000000000000000000000f00000077700
080888080f08880f080fff0800000bb000bbbbb000bbbbb000bbbbb000bb0000000000000000000000000000000000000000000000000000000f0f0000007000
080000080f00000f0800000800bbbbb000bbbbb000bbbbb000bbbbb000bbbbb00000000000000000000000000000000000000000000000000000000000000000
088888880fffffff0888888800000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000900000009000000090000000000000000000000000000000000000000000000000000000
00000000000000000090000000000000000000000000000000000000991a000099a1000099110000000000000000000000000000000000000000000000000000
000000000000000070090000000000000000000000000000000000009666a0009666800096668000000000000000000000000000000000000000000000000000
00000000b00000007bbbb0008000000089ab0000000000080000bb98000000000000000000000000000000000000000000000000000000000000000000000000
000000009a7000000aaacc67700000009ac000000000000700000ca7000000000000000000000000000000000000000000000000000000000077770000000000
00000000b00000007bbbb00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000007009000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000090000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00bb8bb0008bb8b000b8bb8000bff0b00000eee00000000000000000000000000000eee00000000000000000000000000000eee0000000000000000000000000
08aaaaa80baaaaab0bbbbbbb03bff0b30000eee00000eee000000000000000000000eee00000eee000000000000000000000eee00000eee00000000000000000
0b00b00b0b0b00b808b00b0b030ffe03000ddde0000ddde0000ddde0000ddd00000aaae0000aaae0000aaae0000aaa00000ddde0000ddde0000ddde0000ddd00
0b00b00b080b00bb0bb00b08030efe03000dad00000dade0000dade0000dade0000a8a00000a8ae0000a8ae0000a8ae0000d8d00000d8de0000d8de0000d8de0
08bb8bb80bb8bb8b0b8bb8bb03befeb3000ddd00000ddd00000ddde0000ddde0000aaa00000aaa00000aaae0000aaae0000ddd00000ddd00000ddde0000ddde0
00b0b0b000b0b0b000b0b0b00050f0500000000000000000000000000000eee00000000000000000000000000000eee00000000000000000000000000000eee0
0b00b00b0b00b00b0b00b00b0500f005000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00008000000080000000a000000000000000ff0000000000000000000000000000003300000ff000000000000000000000000000000330000000000000000000
00a0e0a00010e0100010e01000000000000f4ff00000ff0000000000000033000003ee3000ff4f00000ff0000000000000033000003ee3000000000000000000
000efe00000efe00000efe000000900000006660000f6660000033600003ee30000033600066600000666f0000633000003ee300006330000000000000000000
01efefe10aefefea01efefe1000b9b0005564666055633660553ee3605563366055646660666465506633655063ee35506633655066646550000000000000000
000efe00000efe00000efe0000099900000033000003ee3000003300000f4ff000004f0000033000003ee3000003300000ff4f00000f40000000000000000000
00a0e0a00010e0100010e010000000000003ee3000003300000000000000ff00000ffff0003ee3000003300000000000000ff00000ffff000000000000000000
00008000000080000000a00000000000000033000000000000000000000000000000ff0000033000000000000000000000000000000ff0000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
0000ff0000000000000ff000000fff00000fff000000000000000000000000000000000007777777077777770777777707777777077777770000000000000000
00007ff000ff00f000ff700000ff7ff000ff7ff0000bbb00000bbb00000bbb0000000000000007e707eeeee707eeeee707eeeee707e700000000000000000000
000057ff0ff707ff0ff75000000757f00ff757ff00b00fb000bf00b000b0f0b000000000000007e7077777e707eeeee707e7777707e700000000000000000000
0f75557f0f75557f0f75557f000050000f75557f0bf00ffb0bff00fb0bf0f0fb00000000000007e7000007e707eeeee707e7000007e700000000000000000000
0ff750000ff707ff000057ff00f757000ff757ff00bbbbb000bbbbb000bbbbb000000000000007e7077777e707eeeee707e7777707e700000000000000000000
00ff700000f00ff000007ff000ff7ff000ff7ff000000000000000000000000000000000000007e707eeeee707eeeee707eeeee707e700000000000000000000
000ff000000000000000ff00000fff00000fff000000000000000000000000000000000007777777077777770777777707777777077777770000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000003333333033333330333333303333333033333330000000000000000
00000000000000000000700000000700000000000007000000000000000000000000000000000393039999930399999303999993039300000000000000000000
00009900000880000008080000008080000707000080800000008000000787000007770000000393033333930399999303933333039300000000000000000000
00098900000898000000700000070700008080800007070000087800000878000007070000000393000003930399999303930000039300000000000000000000
00099000000088000008080000808000000707000000808000008000000787000007770000000393033333930399999303933333039300000000000000000000
00000000000000000000700000070000000000000000070000000000000000000000000000000393039999930399999303999993039300000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000003333333033333330333333303333333033333330000000000000000
00000000000000000000000000000877770000000000000000000000000666666660000000000000000000000000777780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000600000060000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000000000000000000000000000000000000000780000000000000000000000000000000
00000000000000000000000000000870000000000000000000000000000600000060000000000000000000000000000780000000000000000000000000000000
88888888888888888888888888888877778888888888888888888888888666666668888888888888888888888888777788888888888888888888888888888888
88888888888888888888888888888878888888888888788887778777877787778777877787778888878888888888888788888888888888888888888888888888
88888888888888888888888888888878888888888887778887888788878787878787877887878888777888888888888788888888888888888888888888888888
88888888888888888888888888888878888888888888788888878788877787878787878887788888878888888888888788888888888888888888888888888888
77777777777777777777777777777778888888888888788887778777878787878787877787878888878888888888888777777777777777777777777777777777
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00008888888888800888888888888880000088888888000008888800088800000000888888888880000088888888000008888888888888800888888888888880
0088ffffffffff8008ffffffffffff800008ffffffff800008fff80008ff80000008ffffffffff800008ffffffff800008ffffffffffff8008ffffffffffff80
08ffffffffffff8008ffffffffffff80008ffffffffff80008fff80008fff800008fffffffffff80008ffffffffff80008ffffffffffff8008ffffffffffff80
08ffffffffffff8008ffffffffffff80008ffff88ffff80008fff80008ffff80008fffffffffff80008ffff88ffff80008ffffffffffff8008ffffffffffff80
08ffffffffffff80088888888888888008ffff8008ffff8008fff80008ffff8008fffff88888888008ffff8008ffff8008888888888888800888888888888880
0088ffffffffff80000000000000000008ffff8008ffff8008fff80008ffff8008ffff800000000008ffff8008ffff8000000000000000000000000000000000
00008888888888800000000000000000088888800888888008fff80008fff8008ffff80000000000088888800888888000000000000000000000000000000000
00000000000000000000088888800000000000000000000008fff800088880008fff800000888880000000000000000000000888888000000888888888888880
0000000000000000000008ffff800000000000000000000008fff800000000008fff8000008fff800000000000000000000008ffff80000008ffffffffffff80
0888888888880000000008ffff800000088888888888888008fff800000000008ffff800008fff800888888888888880000008ffff80000008ffffffffffff80
08ffffffffff8800000008ffff80000008ffffffffffff8008fff8000888000008ffff80008fff8008ffffffffffff80000008ffff80000008ffff8888888880
08ffffffffffff80000008ffff80000008ffffffffffff8008fff80008ff800008fffff8888fff8008ffffffffffff80000008ffff80000008ffff8000000000
08ffffffffffff80000008ffff80000008fffff88fffff8008fff80008fff800008fffffffffff8008fffff88fffff80000008ffff80000008ffff8888888880
08ffffffffffff80000008ffff80000008ffff8008ffff8008fff80008ffff80008fffffffffff8008ffff8008ffff80000008ffff80000008ffffffffffff80
08ffffffffff8800000008ffff80000008ffff8008ffff8008fff80008ffff800008ffffffffff8008ffff8008ffff80000008ffff80000008ffffffffffff80
08888888888800000000088888800000088888800888888008888800088888800000888888888880088888800888888000000888888000000888888888888880
00000000000000000000000000000000000000000000000000000000088888000888000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff80008ff800000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff80008fff80000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff80008ffff8000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff80008ffff8000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff80008ffff8000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff80008fff80000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff8000888800000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff8000000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff8000000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff8000000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff8000000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff8000000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff8000000000000000000000000000000000000000000000000000000000000000000
0000000000000000000000000000000000000000000000000000000008fff8000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000088888000000000000000000000000000000000000000000000000000000000000000000
__label__
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00777070700770777077007770000077707770777070707770077007000000700077700770777077007700777077707070000077707770777070007770000000
00700070707000700070707000000007007070707070700700700070000000700070007000700070707070707070707070000007000700070070007000070000
00770070707000770070707700000007007770770070700700777000000000700077007000770070707070777077007770000007000700070070007700000000
00700070707070700070707000000007007070707077700700007000000000700070007070700070707070707070700070000007000700070070007000070000
00777007707770777070707770000077007070707007007770770000000000777077707770777070707770707070707770000007007770070077707770000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00008888888888800888888888888880000088888888000008888800088800000000888888888880000088888888000008888888888888800888888888888880
0088aaaaaaaaaa8008aaaaaaaaaaaa800008aaaaaaaa800008aaa80008aa80000008aaaaaaaaaa800008aaaaaaaa800008aaaaaaaaaaaa8008aaaaaaaaaaaa80
08aaaaaaaaaaaa8008aaaaaaaaaaaa80008aaaaaaaaaa80008aaa80008aaa800008aaaaaaaaaaa80008aaaaaaaaaa80008aaaaaaaaaaaa8008aaaaaaaaaaaa80
08aaaaaaaaaaaa8008aaaaaaaaaaaa80008aaaa88aaaa80008aaa80008aaaa80008aaaaaaaaaaa80008aaaa88aaaa80008aaaaaaaaaaaa8008aaaaaaaaaaaa80
08aaaaaaaaaaaa80088888888888888008aaaa8008aaaa8008aaa80008aaaa8008aaaaa88888888008aaaa8008aaaa8008888888888888800888888888888880
0088aaaaaaaaaa80000000000000000008aaaa8008aaaa8008aaa80008aaaa8008aaaa800000000008aaaa8008aaaa8000000000000000000000000000000000
00008888888888800000000000000000088888800888888008aaa80008aaa8008aaaa80000000000088888800888888000000000000000000000000000000000
00000000000000000000088888800000000000000000000008aaa800088880008aaa800000888880000000000000000000000888888000000888888888888880
0000000000000000000008aaaa800000000000000000000008aaa800000000008aaa8000008aaa800000000000000000000008aaaa80000008aaaaaaaaaaaa80
0888888888880000000008aaaa800000088888888888888008aaa800000000008aaaa800008aaa800888888888888880000008aaaa80000008aaaaaaaaaaaa80
08aaaaaaaaaa8800000008aaaa80000008aaaaaaaaaaaa8008aaa8000888000008aaaa80008aaa8008aaaaaaaaaaaa80000008aaaa80000008aaaa8888888880
08aaaaaaaaaaaa80000008aaaa80000008aaaaaaaaaaaa8008aaa80008aa800008aaaaa8888aaa8008aaaaaaaaaaaa80000008aaaa80000008aaaa8000000000
08aaaaaaaaaaaa80000008aaaa80000008aaaaa88aaaaa8008aaa80008aaa800008aaaaaaaaaaa8008aaaaa88aaaaa80000008aaaa80000008aaaa8888888880
08aaaaaaaaaaaa80000008aaaa80000008aaaa8008aaaa8008aaa80008aaaa80008aaaaaaaaaaa8008aaaa8008aaaa80000008aaaa80000008aaaaaaaaaaaa80
08aaaaaaaaaa8800000008aaaa80000008aaaa8008aaaa8008aaa80008aaaa800008aaaaaaaaaa8008aaaa8008aaaa80000008aaaa80000008aaaaaaaaaaaa80
08888888888800000000088888800000088888800888888008888800088888800000888888888880088888800888888000000888888000000888888888888880
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
000000000000000000aa000aa0a0a00000aaa0a0a0aaa0aaa0a000aaa0aaa0a000aaa00000aaa00aa0aaa00000aaa0aaa00aa00aa0aaa0000000000000000000
000000000000000000a0a0a0a0a0a00000a0a0a0a0a0a00a00a000a0a0a0a0a000a0000000a000a0a0a0a00000a0a00a00a000a0a0a0a0000000000000000000
000000000000000000a0a0a0a0a0a00000aaa0a0a0aaa00a00a000aaa0aa00a000aa000000aa00a0a0aa000000aaa00a00a000a0a0aaa0000000000000000000
000000000000000000a0a0a0a0aaa00000a0a0aaa0a0a00a00a000a0a0a0a0a000a0000000a000a0a0a0a00000a0000a00a000a0a0a0a0000000000000000000
000000000000000000a0a0aa00aaa00000a0a00a00a0a0aaa0aaa0a0a0aaa0aaa0aaa00000a000aa00a0a00000a000aaa00aa0aa00aaa0000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
0000000000aaa00aa0aaa0aaa00000aaa0a0a00000a0a0aaa0aaa00aa0aa000aa00000aaa0aaa0aaa0a0a00000aaa0aa000000aaa0aaa0aaa0aa000000000000
0000000000a0a0a0a0a0a00a000000a0a0a0a00000a0a00a000a00a0a0a0a0a0000000a0a0a0a0a0a0a0a000000a00a0a0000000a0a0a000a00a000000000000
0000000000aaa0a0a0aa000a000000aa00aaa00000aaa00a000a00a0a0a0a0a0000000aaa0aaa0aa00aa0000000a00a0a00000aaa0a0a0aaa00a000000000000
0000000000a000a0a0a0a00a000000a0a000a00000a0a00a000a00a0a0a0a0a0a00000a000a0a0a0a0a0a000000a00a0a00000a000a0a0a0000a000000000000
0000000000a000aa00a0a00a000000aaa0aaa00000a0a0aaa0aa00aa00a0a0aaa00000a000a0a0a0a0a0a00000aaa0a0a00000aaa0aaa0aaa0aaa00000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000008880888088800880088000000888880000000880888000000888880000008880088000000880888088808880888000000000000000
00000000000000000000008080808080008000800000008808088000008080808000008800088000000800808000008000080080808080080000000000000000
00000000000000000000008880880088008880888000008880888000008080880000008808088000000800808000008880080088808800080000000000000000
00000000000000000000008000808080000080008000008808088000008080808000008800088000000800808000000080080080808080080000000000000000
00000000000000000000008000808088808800880000000888880000008800808000000888880000000800880000008800080080808080080000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000

__sfx__
180d0000106730b473116730b473136730b473116730b473116730b473116730b473116730b473116730b473136730b473116730b473116730b473116730b473106730b473104030060300603006030060300603
1a0200003f6703c6703b6703a6703a670396703867037670376703667035670346703367032670306702f6702d6702b6702a67028670266702467022670206701d6701b670196701767016670136700e67009670
000400002b6731f6732b6731f6732b6731f6732b6731f6732b6731f673326732e6732a6732667323673226731e6731b6731867315673126730f6730c6730867305673026730a6030660301603006030060300603
020500003f670386703f670386703f670386703f670386703f6703d6703c6703b67039670376403467032640316702e6402b6702864025670216401e6701b64018670166401467012640116700e6400967006640
18060000213730a373233730b373253730c373273730d373293730e3732b3730f3732d373103732f37311373313731237333373133733537314373373731537339373163733b373173733d373183733f37319373
901000001563000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
020400000a6700c670106701467016670196701b6701e670206702267024670276702a6702b6702c6702d6702f670306703067032670336703367000000000000000000000000000000000000000000000000000
000200003047331473304732e4732d4732b4732847323473004030040300403004030040300403004030040300403004030040300403004030040300403004030040300403004030040300403004030040300403
0004000032473314733147330473304732f4732e4732d4732c4732b4732947328473264732447322473204731e4731c4731a47318473164731447312473104730d4730b473094730647303473004030040300403
00050000281701e170281701e170281701e170281701e170281701e17000100001000010000100001000010000100001000010000100001000010000100001000010000100001000010000100001000010000100
4d05000027373273732637326373253732537324373243732337323373223732237321373213731f3731f3731f3731f3731f3731f3731f3731f3731f3731f3731f3031f3031f3031f30324303253032630326303
000600002c4731a4732c4731a4732c4731a4732c4732b47329473274732647324473214731f4731c4731747313473104730c47309473044730040312403104030d4030b403094030640303403004030040300403
48080000181730917314173091731017309173121730b173001030110308103011030610301103041030010300103001030010300103001030010300103001030010300103001030010300103001030010300103
0009000022473154732247315473224731b4732247323473244732547326473264732040320403004030040300403004030040300403004030040300403004030040300403004030040300403004030040300403
000800001e373153731e373153731e373153731e373153731e363153631e353153531e343153431e3331533300303003030030300303003030030300303003030030300303003030030300303003030030300303
020400003167030670306702f6702d6702c6702a670296702767027670296702b6702c6702d6702e6702d6702b670296702767025670226701e6701a67016670136700f6700b670086700567002670006700b600
0006000028373283732737326373243732337322373213731f3731e3731c3731b3731937317373153731337311373103730d3730b373093730637304373023730b30309303073030230300303003030030300303
000500002007018070200701807020070180702007018070200701807020070180702007018070200701807020070180702007018070200601806020050180502004018040200301803020020180202001018010
000500002b2701d270292701d27022270272702d270282702e270292702f2702a270302702a270302700020000200002000020000200002000020000200002000020000200002000020000200002000020000200
0004000032470314702f4702e4702d4702b4702a470294702747025470244702347021470204701f4701d4701c4701a4701947017470154701347012470114700f4700d4700a4700947006470044700247000400
000c0000211711717123171181712517119171271711a171291711b1712b1711c1712d1711d1712f1711e171311711f17133171201013510121101371012210139101231013b101241013d101251013f10126101
000b0000220711707122071170712207117001270011a001290011b0012b0011c0012d0011d0012f0011e001310011f00133001200013500121001370012200139001230013b001240013d001250013f00126001
00050000260712707128071290712a0712b0712c0712d0712800127001260012500124001230012200121001230011f00133001200013500121001370012200139001230013b001240013d001250013f00126001
000a000009373093730b3730d3730f37311373153731c373233731137313373143731437315373163731737318373193731b3731c3731f37320373223732437326373283732a3732c3732e373313733437338373
000500002b1712b1712b1712a1712a1712817127171251712317122171201711f1711d1711b1711917116171121710f10133101201013510121101371012210139101231013b101241013d101251013f10126101
__music__
04 12424344
04 03424344
04 04424344
00 40424344

