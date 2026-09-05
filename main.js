"use strict";
/* =====================================================================
   十二生肖大冒险  Zodiac Odyssey
   Q 版横版闯关游戏（Canvas 2D）
===================================================================== */

/* ---------- 常量 ---------- */
const TILE = 64;
const VIEW_W = 1280, VIEW_H = 720;
const GRAV = 2500;
const EPS = 1;

/* ---------- 画布 ---------- */
const canvas = document.getElementById('game');
let ctx = canvas.getContext('2d');
canvas.width = VIEW_W; canvas.height = VIEW_H;

/* ---------- 输入 ---------- */
const input = { left:false, right:false, jump:false, _jumpEdge:false, attack:false, _atkEdge:false };
const keys = {};
addEventListener('keydown', (e)=>{
  if(keys[e.code]) return; // 防止长按重复触发边缘
  keys[e.code] = true;
  switch(e.code){
    case 'ArrowLeft': case 'KeyA': input.left = true; break;
    case 'ArrowRight': case 'KeyD': input.right = true; break;
    case 'ArrowUp': case 'KeyW': case 'Space':
      if(!input.jump){ input._jumpEdge = true; }
      input.jump = true; e.preventDefault(); break;
    case 'KeyJ': case 'KeyX': case 'KeyF': case 'Enter':
      if(!input.attack) input._atkEdge = true;
      input.attack = true; break;
    case 'KeyP': case 'Escape': togglePause(); break;
    case 'Digit1': case 'KeyQ': switchWeapon(0); break;
    case 'Digit2': case 'KeyE': switchWeapon(1); break;
    case 'Digit3': switchWeapon(2); break;
    case 'Digit4': switchWeapon(3); break;
  }
});
addEventListener('keyup', (e)=>{
  keys[e.code] = false;
  switch(e.code){
    case 'ArrowLeft': case 'KeyA': input.left = false; break;
    case 'ArrowRight': case 'KeyD': input.right = false; break;
    case 'ArrowUp': case 'KeyW': case 'Space': input.jump = false; break;
    case 'KeyJ': case 'KeyX': case 'KeyF': case 'Enter': input.attack = false; break;
  }
});

/* 触屏按键 */
const TOUCH_KEYS = {
  left:'left', right:'right', jump:'jump', attack:'attack'
};
document.querySelectorAll('.tbtn').forEach(btn=>{
  const k = TOUCH_KEYS[btn.dataset.key];
  const on = (state)=> (e)=>{
    e.preventDefault();
    if(k==='jump' && state && !input.jump) input._jumpEdge = true;
    if(k==='attack' && state && !input.attack) input._atkEdge = true;
    if(k==='left'||k==='right'||k==='jump'||k==='attack') input[k]=state;
  };
  btn.addEventListener('pointerdown', on(true));
  btn.addEventListener('pointerup', on(false));
  btn.addEventListener('pointercancel', on(false));
  btn.addEventListener('pointerleave', on(false));
});
// 防止触屏滚动
addEventListener('touchstart', e=>e.preventDefault(), {passive:false});

/* ---------- 十二生肖数据 & Q 版绘制 ---------- */
const ZODIAC = [
  {id:16, cn:'鼠',  hero:'机智鼠',  body:'#9aa3b5', limb:'#c3cad6', accent:'#f3a9c0', kind:'ear',   sub:'round'},
  {id:17, cn:'牛',  hero:'蛮力牛',  body:'#b0885a', limb:'#a0744a', accent:'#ead6ab', kind:'horn', sub:''},
  {id:18, cn:'虎',  hero:'勇猛虎',  body:'#f0963f', limb:'#ec8400', accent:'#e05f35', kind:'ear',   sub:'tiger'},
  {id:19, cn:'兔',  hero:'玲珑兔',  body:'#f4efe6', limb:'#fff',    accent:'#f2a0b0', kind:'ear',   sub:'long'},
  {id:20, cn:'龙',  hero:'天骄龙',  body:'#63c96a', limb:'#4fb358', accent:'#3fc4b0', kind:'dragon',sub:''},
  {id:21, cn:'蛇',  hero:'灵巧蛇',  body:'#79d357', limb:'#5fbd4a', accent:'#e05555', kind:'tongue',sub:''},
  {id:22, cn:'马',  hero:'疾风马',  body:'#d9a06a', limb:'#c98d55', accent:'#7a4a26', kind:'mane',  sub:''},
  {id:23, cn:'羊',  hero:'智慧羊',  body:'#e8e4da', limb:'#f7f3ec', accent:'#98a3b5', kind:'horn',  sub:'goat'},
  {id:24, cn:'猴',  hero:'顽皮猴',  body:'#a97b4e', limb:'#c99a66', accent:'#e8b08a', kind:'ear',   sub:'round'},
  {id:25, cn:'鸡',  hero:'报晓鸡',  body:'#efb53f', limb:'#e39a26', accent:'#ef5b54', kind:'comb',  sub:''},
  {id:26, cn:'狗',  hero:'忠义狗',  body:'#c9a87a', limb:'#b89464', accent:'#8a6a44', kind:'ear',   sub:'floppy'},
  {id:27, cn:'猪',  hero:'福气猪',  body:'#f2b6c0', limb:'#f9d2d7', accent:'#e88a98', kind:'snout', sub:''},
];

/* 绘制 Q 版生物。x: 脚底中心 x，y: 脚底 y，size: 高度比例基准 */
function drawChibi(a, x, y, size, pose, facing, hitFlash){
  const s = size / 130;                    // 缩放
  const bodyB = a.body, limbB = a.limb, acc = a.accent;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(facing, 1);
  ctx.scale(s, s);
  if(hitFlash){ ctx.globalAlpha = 0.5; }

  const bob = pose===1 ? Math.sin(performance.now()/120)*6 -4 : (pose===2 ? 0:-3);
  const squash = pose===1 && Math.abs((Math.sin(performance.now()/120)))<0.3 ? 0.96 : 1;

  // 腿（走动动画）
  const legKick = pose===1 ? Math.sin(performance.now()/120)*14 : 0;
  if(pose===2){ // 跳跃：腿收拢
    roundRect(-20, 40, 16, 22, 7, limbB);
    roundRect(6, 40, 16, 22, 7, limbB);
  } else {
    roundRect(-22, 40, 18, 26 + (legKick>0? legKick*0.5 : 0), 7, limbB);
    roundRect(6, 40, 18, 26 - (legKick>0?0: legKick*0.5), 7, limbB);
    // 爪子
    ctx.fillStyle = '#fff'; ctx.fillRect(-24, 76, 22, 5); ctx.fillRect(4, 76, 22, 5);
  }

  // 身体
  ctx.fillStyle = bodyB; ctx.beginPath();
  ctx.ellipse(0, 40+bob, 42*squash, 40*squash, 0, 0, Math.PI*2); ctx.fill();

  // 手臂
  ctx.fillStyle = limbB;
  ctx.beginPath(); ctx.ellipse(-38, 34+bob, 12, 14, 0, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(38, 34+bob, 12, 14, 0, 0, Math.PI*2); ctx.fill();

  // 肚皮
  ctx.fillStyle = 'rgba(255,255,255,.75)';
  ctx.beginPath(); ctx.ellipse(0, 52+bob, 26, 22, 0, 0, Math.PI*2); ctx.fill();

  // ---- 头部配件（在身体后方）----
  drawHeadDeco(a, acc, limbB, bodyB, bob, pose);

  // 头
  ctx.fillStyle = bodyB; ctx.beginPath();
  ctx.ellipse(0, -34+bob, 46, 44, 0, 0, Math.PI*2); ctx.fill();

  // 眼睛
  ctx.fillStyle = '#23333d';
  ctx.beginPath(); ctx.arc(-16, -40+bob, 6, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(14, -40+bob, 6, 0, Math.PI*2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(-13, -42+bob, 2.4, 0, Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(17, -42+bob, 2.4, 0, Math.PI*2); ctx.fill();

  // 腮红
  ctx.fillStyle='rgba(255,140,140,.5)';
  ctx.beginPath(); ctx.arc(-30,-26+bob,7,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(30,-26+bob,7,0,Math.PI*2); ctx.fill();

  // 嘴巴
  ctx.strokeStyle='#23333d'; ctx.lineWidth=3; ctx.lineCap='round';
  ctx.beginPath(); ctx.arc(0,-22+bob,7,0.15*Math.PI,0.6*Math.PI); ctx.stroke();

  // 头顶表情（Q 版）加个呆毛/宝石
  ctx.fillStyle = acc; ctx.beginPath(); ctx.ellipse(4,-78+bob,4,7,0,0,Math.PI*2); ctx.fill();

  // 头/身体描边
  ctx.globalAlpha = hitFlash?0.2:1;
  ctx.lineWidth=3; ctx.strokeStyle='rgba(30,30,40,.35)';
  ctx.beginPath(); ctx.ellipse(0,-34+bob,46,44,0,0,Math.PI*2); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0,40+bob,42,40,0,0,Math.PI*2); ctx.stroke();

  ctx.restore();
}

function drawHeadDeco(a, acc, limbB, bodyB, bob, pose){
  const tipY = -78+bob + (pose===1?2:0);
  switch(a.kind){
    case 'ear':
      if(a.sub==='long'){ // 兔子长耳
        ctx.fillStyle='#fff';
        pEll(-12, tipY+10, 10, 34); pEll(12, tipY+10, 10, 34);
        ctx.fillStyle=acc;
        pEll(-12, tipY+13, 5.5, 22); pEll(12, tipY+13, 5.5, 22);
      } else if(a.sub==='tiger'){ // 虎圆耳
        ctx.fillStyle=bodyB; pEll(-28, tipY-6, 12, 13); pEll(20, tipY-6, 12, 13);
        ctx.fillStyle=acc;    pEll(-28, tipY-6, 6, 6);  pEll(20, tipY-6, 6, 6);
      } else if(a.sub==='floppy'){ // 垂耳狗
        ctx.fillStyle = a.dark || acc;
        pEll(-40, tipY+4, 16, 24, -0.4); pEll(40, tipY+4, 16, 24, 0.4);
      } else { // 鼠/猴圆耳
        ctx.fillStyle=limbB; pEll(-28, tipY-6, 12, 14); pEll(22, tipY-6, 12, 14);
        ctx.fillStyle=acc;   pEll(-28, tipY-5, 7, 7);   pEll(22, tipY-5, 7, 7);
      }
      break;
    case 'horn':
      ctx.fillStyle=acc;
      if(a.sub==='goat'){ // 羊卷角
        pEll(-34, tipY-4, 10, 16, -0.5); pEll(34, tipY-4, 10, 16, 0.5);
        pEll(-38, tipY-16, 8, 12, -0.5); pEll(38, tipY-16, 8, 12, 0.5);
      } else { // 牛角
        ctx.beginPath();
        ctx.moveTo(-16, tipY+2); ctx.quadraticCurveTo(-38, tipY-6, -30, tipY-30);
        ctx.lineTo(-20, tipY-24); ctx.quadraticCurveTo(-26, tipY-8, -8, tipY); ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(16, tipY+2); ctx.quadraticCurveTo(38, tipY-6, 30, tipY-30);
        ctx.lineTo(20, tipY-24); ctx.quadraticCurveTo(26, tipY-8, 8, tipY); ctx.closePath(); ctx.fill();
      }
      break;
    case 'dragon': // 龙角+须
      ctx.fillStyle=acc;
      ctx.beginPath(); ctx.moveTo(-8, tipY+6); ctx.quadraticCurveTo(-22, tipY-12, -14, tipY-34);
      ctx.lineTo(-6, tipY-26); ctx.quadraticCurveTo(-12, tipY-10, 0, tipY); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(8, tipY+6); ctx.quadraticCurveTo(22, tipY-12, 14, tipY-34);
      ctx.lineTo(6, tipY-26); ctx.quadraticCurveTo(12, tipY-10, 0, tipY); ctx.closePath(); ctx.fill();
      ctx.strokeStyle=acc; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(-24,-30+bob); ctx.quadraticCurveTo(-36,-36+bob,-30,-46+bob); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24,-30+bob); ctx.quadraticCurveTo(36,-36+bob,30,-46+bob); ctx.stroke();
      break;
    case 'tongue': // 蛇吐信
      ctx.strokeStyle=acc; ctx.lineWidth=4;
      ctx.beginPath(); ctx.moveTo(0,-14+bob); ctx.lineTo(0,-2+bob); ctx.stroke();
      break;
    case 'mane': // 马鬃
      ctx.fillStyle=acc;
      ctx.beginPath(); ctx.moveTo(0, tipY+20); ctx.quadraticCurveTo(-14, tipY, 0, tipY-14);
      ctx.quadraticCurveTo(14, tipY, 0, tipY+20); ctx.fill();
      ctx.beginPath(); ctx.arc(-34, tipY+2, 10, 0, Math.PI*2); ctx.fill(); // 耳
      ctx.beginPath(); ctx.arc(34, tipY+2, 10, 0, Math.PI*2); ctx.fill();
      break;
    case 'comb': // 鸡冠+喙
      ctx.fillStyle=acc;
      ctx.beginPath(); ctx.arc(0, tipY-8, 9, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(-10, tipY-2, 7, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(10, tipY-2, 7, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#f7b500'; // 喙
      ctx.beginPath(); ctx.ellipse(0, tipY+16, 9, 6, 0, 0, Math.PI*2); ctx.fill();
      break;
    case 'snout': // 猪鼻子
      ctx.fillStyle=acc;
      ctx.beginPath(); ctx.ellipse(0, tipY+14, 16, 12, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#d86a78';
      ctx.beginPath(); ctx.arc(-6, tipY+14, 2.6, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(6, tipY+14, 2.6, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle=limbB; pEll(-44, tipY+2, 13, 15, -0.5); pEll(44, tipY+2, 13, 15, 0.5);
      break;
  }
}
function pEll(x,y,rx,ry,rot=0){ ctx.beginPath(); ctx.ellipse(x,y,rx,ry,rot,0,Math.PI*2); ctx.fill(); }
function roundRect(x,y,w,h,r,color){ if(r>6)r=6; ctx.fillStyle=color; ctx.beginPath();
  ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.fill(); }

/* ---------- 存档 ---------- */
const SAVE_KEY = 'zodiac_odyssey_save_v1';
function saveGame(run){
  try{
    const data = {
      character: run.charId, level: run.level, coins: run.coins,
      weapons: run.weapons, currentWeapon: run.curW,
      bestLevel: run.bestLevel, kills: run.kills, ts: Date.now()
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
  }catch(e){}
}
function loadSave(){ try{ const d=JSON.parse(localStorage.getItem(SAVE_KEY)); return d; }catch(e){ return null; } }

/* ---------- 全局运行状态 ---------- */
let run = null; // {charId, level, coins, weapons:[ids], curW, kills, bestLevel, hp}

const WEAPONS = [
  {id:0, name:'弹弓',  icon:'🪀', tier:0, cd:0.42, dmg:9,  speed:680, proj:'rock',   melee:false, desc:'初始武器' },
  {id:1, name:'手枪',  icon:'🔫', tier:1, cd:0.26, dmg:13, speed:760, proj:'bullet', melee:false, desc:'快速点射' },
  {id:2, name:'弓箭',  icon:'🏹', tier:2, cd:0.52, dmg:24, speed:560, proj:'arrow',  melee:false, desc:'高额伤害' },
  {id:3, name:'匕首',  icon:'🔪', tier:3, cd:0.30, dmg:18, range:52, arc:Math.PI*1.1, melee:true, desc:'贴身连斩' },
];

/* ---------- 武器获取 ---------- */
function weaponDropPool(level){
  // 越往后解锁更高级武器
  const unlock = [1];            // 手枪从第1关可出
  if(level>=2) unlock.push(2);   // 弓箭第2关
  if(level>=3) unlock.push(3);   // 匕首第3关
  return unlock;
}
function rollNewWeapon(level){
  const pool = weaponDropPool(level);
  const got = run.weapons;
  const missing = pool.filter(w=> !got.includes(w));
  if(missing.length){ return missing[Math.floor(Math.random()*missing.length)]; }
  return null; // 全齐则无新武器
}

/* ---------- 游戏进行状态 ---------- */
let game = null;
let state = 'menu'; // menu|select|how|play|pause|clear|over
let toastTimer = null;

/* =====================================================================
   关卡生成
===================================================================== */
function generateLevel(level){
  const gW = 72 + Math.floor(level*1.5);  // 地图更宽，更迷宫
  const gH = 14;
  const grid = [];
  for(let y=0;y<gH;y++){ grid.push(new Array(gW).fill(0)); }

  // 地面（底部两行）
  for(let x=0;x<gW;x++){ grid[gH-1][x]=1; grid[gH-3][x]=1; grid[gH-2][x]=1; }

  // 迷宫墙体：随机立柱与走廊 (绝不封死整条地面，保证可通过)
  const rng = mulberry32(level*7919 + 42);
  const cols = 2 + Math.floor(level*0.6)+Math.floor(rng()*3);
  for(let c=0;c<cols;c++){
    const cx = Math.floor(rng()*(gW-12))+2;
    const h = 2 + Math.floor(rng()*2);          // 墙高（2~3 格，保证可跳上）
    const w = 1 + Math.floor(rng()*2);
    for(let i=0;i<w;i++)for(let j=0;j<h;j++){
      if(grid[gH-3-j] && grid[gH-3-j][cx+i]!=null && grid[gH-3-j][cx+i]!==1)
        grid[gH-3-j][cx+i]=1;
    }
  }

  // 单向平台（悬浮）
  const platN = 6 + Math.floor(level*1.2);
  for(let i=0;i<platN;i++){
    const px = Math.floor(rng()*(gW-8))+1;
    const py = 3 + Math.floor(rng()*6);
    const pw = 2 + Math.floor(rng()*2);
    for(let k=0;k<pw;k++){ const t=grid[py]; if(t&&t[px+k]===0) t[px+k]=2; }
  }

  // 玩家起点 & 出口（右下区域放出口）
  const startX = 1;
  const exitX = gW-3;
  const exitY = gH-4;   // 出口在地面以上两格平台上
  grid[gH-4][exitX]=1; grid[gH-4][exitX-1]=1; // 出口小平台

  // 怪物出生点
  const enemies = [];
  const enemyN = 5 + Math.floor(level*1.6);
  for(let i=0;i<enemyN;i++){
    const ex = 4 + Math.floor(rng()*(gW-10));
    const types = enemyTypesForLevel(level);
    const type = types[Math.floor(rng()*types.length)];
    enemies.push({ type, x: ex*TILE + TILE/2, y:(gH-2)*TILE, spawnOnce:i });
  }

  // 宝箱点（放置在实心/平台顶部，保证可到达）
  const chests = [];
  const chestN = 2 + Math.floor(rng()*2);
  const candidates = [];
  for(let cy=2; cy<gH-1; cy++){
    for(let cx=1; cx<gW-2; cx++){
      // 格子上方足够空间、自身非墙、下方有实心或平台支撑
      const under = grid[cy+1]?.[cx]||0;
      if(grid[cy][cx]===0 && (under===1) ){
        // 左右至少一格是空，方便走向宝箱
        if((grid[cy][cx-1]===0) || (grid[cy][cx+1]===0)) candidates.push({x:cx,y:cy});
      }
    }
  }
  // 随机打乱取 chestN 个（避免与起点/出口重叠）
  for(let i=candidates.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [candidates[i],candidates[j]]=[candidates[j],candidates[i]]; }
  for(const cand of candidates){
    if(chests.length>=chestN) break;
    if(Math.abs(cand.x-startX)<4 || Math.abs(cand.x-exitX)<2) continue;
    chests.push({ x:cand.x, y:cand.y, opened:false });
  }
  // 兜底：至少一个宝箱放出口平台附近地面
  if(chests.length===0){ chests.push({ x:exitX-4, y:gH-4, opened:false }); }

  // 金币
  const coins = [];
  const coinN = 12 + Math.floor(level*3);
  for(let i=0;i<coinN;i++){
    const cx = 2 + Math.floor(rng()*(gW-4));
    const cy = 4 + Math.floor(rng()*5);
    coins.push({ x:cx*TILE+TILE/2, y:cy*TILE+TILE/2, taken:false, value:1+Math.floor(rng()*2) });
  }

  return { grid:grid.map(r=>r.slice()), gW, gH, startX, exitX, enemies, chests, coins };
}

function enemyTypesForLevel(level){
  const t = ['mouse'];
  if(level>=1) t.push('spider');
  if(level>=2) t.push('bat');
  if(level>=4) t.push('frog');
  if(level>=5) t.push('boar');
  if(level>=7) t.push('bee');
  if(level>=9) t.push('bear');
  return t;
}

/* 敌人属性（血量随关卡成长） */
function enemyStats(type, level){
  const mult = 1 + (level-1)*0.45 + level*0.1;
  const base = {
    mouse:{ hp:18, speed:70,  dmg:8,  r:.5, fly:false, chase:false, color:'#b8b8c8', face:'mouse'  },
    spider:{hp:30, speed:110, dmg:11, r:.55, fly:false, chase:true,  color:'#7a5aa0', face:'spider' },
    bat:  { hp:24, speed:150, dmg:10, r:.5,  fly:true,  chase:true,  color:'#5a5a78', face:'bat'    },
    frog: { hp:40, speed:130, dmg:14, r:.6,  fly:false, chase:true,  color:'#5fbf4a', face:'frog'   },
    boar: { hp:70, speed:170, dmg:18, r:.7,  fly:false, chase:true,  color:'#8a6a44', face:'boar'   },
    bee:  { hp:34, speed:190, dmg:12, r:.5,  fly:true,  chase:true,  color:'#e8b02a', face:'bee'    },
    bear: { hp:130,speed:90,  dmg:24, r:.85, fly:false, chase:true,  color:'#6b4a30', face:'bear'   },
  }[type];
  return { hp: Math.round(base.hp*mult), speed:base.speed, dmg:Math.round(base.dmg*(1+(level-1)*0.15)),
           r:base.r, fly:base.fly, chase:base.chase, color:base.color, face:base.face };
}

function mulberry32(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed);
  t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }

/* =====================================================================
   碰撞
===================================================================== */
function tileAt(x,y){ const g=game.grid; if(y<0||x<0||x>=game.gW||y>=game.gH) return 1; return g[y][x]; }
function isSolid(x,y){ return tileAt(x,y)===1; }
// 移动实体，返回是否落地
function moveEntity(e, dt){
  const halfW=e.w/2, halfH=e.h/2;
  // X 轴
  e.x += e.vx*dt;
  let x0=Math.floor((e.x-halfW)/TILE), x1=Math.floor((e.x+halfW-EPS)/TILE);
  let y0=Math.floor((e.y-halfH)/TILE), y1=Math.floor((e.y+halfH-EPS)/TILE);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    if(isSolid(tx,ty)){
      if(e.vx>0){ e.x=tx*TILE-halfW-EPS; }
      else if(e.vx<0){ e.x=tx*TILE+TILE+halfW+EPS; }
      e.vx=0; e.hitWall=true;
    }
  }
  // Y 轴
  const prevBottom = e.y + halfH;
  e.y += e.vy*dt;
  e.onGround=false;
  x0=Math.floor((e.x-halfW)/TILE); x1=Math.floor((e.x+halfW-EPS)/TILE);
  y0=Math.floor((e.y-halfH)/TILE); y1=Math.floor((e.y+halfH-EPS)/TILE);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){
    const t=tileAt(tx,ty);
    if(t===1){
      if(e.vy>0){ e.y=ty*TILE-halfH-EPS; e.vy=0; e.onGround=true; }
      else if(e.vy<0){ e.y=(ty+1)*TILE+halfH+EPS; e.vy=0; }
    } else if(t===2 && e.vy>0){ // 单向平台
      const top=ty*TILE;
      if(prevBottom <= top+14 && e.y-halfH <= top+2){
        e.y=ty*TILE-halfH-EPS; e.vy=0; e.onGround=true;
      }
    }
  }
  return e.onGround;
}

/* =====================================================================
   初始化玩家 / 敌人 / 投射物
===================================================================== */
function makePlayer(x,y){
  return { x, y, w:44, h:52, vx:0, vy:0, onGround:false, facing:1,
           hp:100, maxhp:100, invuln:0, atkCd:0, jumps:0, pose:0, hitWall:false };
}
function makeEnemy(type, x, y, level){
  const s = enemyStats(type, level);
  return { type, x, y, w: ((s.r||.5))*TILE, h:((s.r||.5))*TILE, vx:0, vy:0,
           onGround:false, facing:1, hp:s.hp, maxhp:s.hp, dmg:s.dmg, speed:s.speed,
           fly:s.fly, chase:s.chase, color:s.color, face:s.face, dir:Math.random()<.5?1:-1,
           atkCd: Math.random()*1+0.5, startX:x, alive:true, invuln:0, hitWall:false };
}

/* =====================================================================
   开始新关卡
===================================================================== */
function startLevel(){
  const lvl = generateLevel(run.level);
  const px = lvl.startX*TILE + TILE/2;
  const py = (lvl.gH-2)*TILE - 30;
  game = {
    grid:lvl.grid, gW:lvl.gW, gH:lvl.gH, level:run.level,
    player: makePlayer(px, py),
    enemies: lvl.enemies.map(e=>makeEnemy(e.type, e.x, e.y, run.level)),
    chests:lvl.chests, coins:lvl.coins,
    exitX:lvl.exitX, exitPlat:lvl.gH-4,
    projectiles:[], particles:[], floatingTexts:[],
    camX:0, time:0, shake:0, pendLevels:0
  };
  // 武器属性加成到玩家
  game.player.weapons = run.weapons.slice();
  game.player.curW = run.curW;
  game.player.hp = run.hp;

  if(run.inputLevel===null || run.inputLevel!==run.level){
    // 首次进入该关的提示
    run.inputLevel = run.level;
  }
  buildMinimap();
}

/* =====================================================================
   更新
===================================================================== */
function update(dt){
  const p = game.player;
  game.time += dt;
  if(game.shake>0) game.shake = Math.max(0, game.shake-dt*30);

  // ---- 玩家控制 ----
  const ax = (input.right?1:0) - (input.left?1:0);
  if(ax!==0){ p.facing = ax; }
  p.acc = ax*3800;
  p.vx += p.acc*dt;
  // 空气阻力
  if(ax===0){ const f = p.onGround?0.82:0.94; p.vx *= Math.pow(f, dt*60); }
  p.vx = Math.max(-460, Math.min(460, p.vx));

  // 跳跃
  if(input._jumpEdge){
    if(p.onGround){ p.vy=-980; p.jumps=1; p.onGround=false; }
    else if(p.jumps<2){ p.vy=-900; p.jumps++; }
  }
  // 可变跳跃高度
  if(!input.jump && p.vy<-420 && !p.onGround){ p.vy = Math.max(p.vy, -420); }

  p.vy += GRAV*dt;
  p.onGround=false;
  moveEntity(p, dt);
  // 落地重置跳跃
  if(p.onGround) p.jumps=0;
  p.pose = p.onGround ? (Math.abs(p.vx)>20?1:0) : 2;

  // 掉出地图
  if(p.y - p.h/2 > game.gH*TILE+200){ gameOver(); return; }

  // 无敌
  if(p.invuln>0) p.invuln-=dt;

  // ---- 攻击 ----
  p.atkCd-=dt;
  const w = WEAPONS[p.curW];
  if((input.attack || input._atkEdge) && p.atkCd<=0){
    p.atkCd = w.cd;
    fireWeapon(w);
  }

  // ---- 投射物 ----
  for(let i=game.projectiles.length-1;i>=0;i--){
    const pr=game.projectiles[i];
    pr.life-=dt;
    pr.x+=pr.vx*dt; pr.y+=pr.vy*dt; pr.vy+=pr.g*dt;
    // 撞墙
    if(isSolid(Math.floor(pr.x/TILE), Math.floor(pr.y/TILE)) ||
       isSolid(Math.floor(pr.x/TILE), Math.floor((pr.y+ (pr.vy>0?6:-6))/TILE)) ||
       isSolid(Math.floor((pr.x+pr.sign*6)/TILE),Math.floor(pr.y/TILE))){
      burst(pr.x, pr.y, pr.color||'#fff',4); game.projectiles.splice(i,1); continue;
    }
    if(pr.life<=0){ game.projectiles.splice(i,1); continue; }
    if(pr.from==='player'){
      // 命中小怪
      let hit=false;
      for(let e of game.enemies){
        if(!e.alive) continue;
        if(Math.abs(pr.x-e.x)<e.w/2+4 && Math.abs(pr.y-e.y)<e.h/2+4){
          hurtEnemy(e, pr.dmg, pr.vx>0?1:-1); hit=true; break;
        }
      }
      if(hit){ burst(pr.x,pr.y,'#ffd76a',5); game.projectiles.splice(i,1); }
    } else {
      // 命中玩家
      if(p.invuln<=0 && Math.abs(pr.x-p.x)<p.w/2+6 && Math.abs(pr.y-p.y)<p.h/2+6){
        hurtPlayer(pr.dmg); game.projectiles.splice(i,1);
      }
    }
  }

  // ---- 近战匕首攻击判定（每次挥动）----
  if(w.melee && p.atkCd> w.cd - 0.16 && input.attack){
    const reach = w.range;
    for(let e of game.enemies){
      if(!e.alive) continue;
      if((Math.abs(e.x-p.x) < p.w/2+e.w/2+reach) && Math.abs(e.y-p.y)<e.h/2+p.h/2+14){
        hurtEnemy(e, scaledDmg(w.dmg), p.facing);
        slash(p.x, p.y, p.facing);
      }
    }
  }

  // ---- 敌人 ----
  for(const e of game.enemies){
    if(!e.alive){ continue; }
    e.atkCd-=dt;
    if(e.invuln>0)e.invuln-=dt;
    e.hitWall=false;

    // 追击逻辑
    const dx = p.x - e.x;
    const dist = Math.abs(dx);
    let pursue = e.chase && dist < 12*TILE;
    if(pursue){ e.dir = dx>0?1:-1; }

    if(e.fly){
      // 飞行敌人：朝向目标移动，波浪起伏
      e.vx = (pursue? e.dir*e.speed : e.dir*e.speed*0.4);
      e.vy = Math.sin(game.time*4 + e.startX)*90;
    } else {
      e.vx = e.dir*e.speed;
    }
    e.vy += GRAV*dt;
    moveEntity(e, dt);
    // 撞墙回头
    if(e.hitWall){ e.dir*=-1; e.vx=e.dir*Math.abs(e.vx); }
    // 行走类：前方台边自动回头
    if(!e.fly && !pursue && e.onGround){
      const frontX = e.x + e.dir*(e.w/2+6);
      const belowY = e.y + e.h/2 + 8;
      if(!isSolid(Math.floor(frontX/TILE), Math.floor(belowY/TILE))){ e.dir*=-1; e.vx=e.dir*e.speed; }
    }

    // 攻击玩家（接触）
    if(e.atkCd<=0 && p.invuln<=0 && Math.abs(p.x-e.x)<p.w/2+e.w/2+2 && Math.abs(p.y-e.y)<p.h/2+e.h/2+8){
      hurtPlayer(e.dmg); e.atkCd=1.2;
      p.vx += (p.x>e.x?1:-1)*320;
    }

    // 死亡掉落（防重复）
    if(e.hp<=0){ checkoutEnemyDeath(e); }
  }

  // ---- 宝箱 / 金币 / 出口 ----
  for(const c of game.chests){
    if(c.opened) continue;
    if(Math.abs(p.x-(c.x*TILE+TILE/2))<40 && Math.abs(p.y-(c.y*TILE+TILE/2))<40){
      c.opened=true; openChest(c);
    }
  }
  for(const c of game.coins){
    if(c.taken) continue;
    if(Math.abs(p.x-c.x)<28 && Math.abs(p.y-c.y)<28){
      c.taken=true; run.coins+=c.value; floatingText('+'+c.value+' 🪙', p.x, p.y-40, '#ffd76a');
      burst(c.x,c.y,'#ffd76a',4); updateHUD();
    }
  }
  // 出口检测
  const ex = game.exitX;
  if(Math.abs(p.x - (ex*TILE+TILE/2)) < 46 && Math.abs(p.y-(game.exitPlat*TILE))<60){
    levelCleared();
  }

  // 粒子
  for(let i=game.particles.length-1;i>=0;i--){ const pt=game.particles[i]; pt.x+=pt.vx*dt; pt.y+=pt.vy*dt; pt.vy+=300*dt; pt.life-=dt; if(pt.life<=0) game.particles.splice(i,1); }
  for(let i=game.floatingTexts.length-1;i>=0;i--){ const t=game.floatingTexts[i]; t.y-=40*dt; t.life-=dt; if(t.life<=0) game.floatingTexts.splice(i,1); }

  // 相机
  game.camX += (p.x - VIEW_W/2 - game.camX)*Math.min(1, dt*6);
  game.camX = Math.max(0, Math.min(game.camX, game.gW*TILE - VIEW_W));

  input._jumpEdge=false; input._atkEdge=false;
}

/* 武器伤害随关卡微增 */
function scaledDmg(base){ return base + Math.floor((run.level-1)*0.6); }

function fireWeapon(w){
  const p=game.player;
  const tipX = p.x + p.facing*26;
  const tipY = p.y - 10;
  if(w.melee){
    slash(p.x,p.y,p.facing);
    return;
  }
  const baseDmg = scaledDmg(w.dmg);
  let ang = p.facing===1?0:Math.PI;
  if(w.proj==='arrow'){ ang += (Math.random()-0.5)*0.04; }
  const vx = Math.cos(ang||0)*w.speed * (p.facing===1?1:-1)* (p.facing===1?1:1);
  const vxFinal = w.speed * p.facing;
  const pr = { x:tipX, y:tipY, vx:vxFinal, vy:(w.proj==='arrow' ? -60 - Math.abs(p.vx)*0.1 : 0),
               g: w.proj==='arrow'? 380 : 0, dmg:baseDmg, life:1.4, from:'player',
               color: w.proj==='bullet'?'#ffd76a': w.proj==='arrow'?'#c9b4a0':'#aaa',
               sign:p.facing };
  game.projectiles.push(pr);
  if(w.proj==='bullet'){ burst(tipX,tipY,'#ffd76a',4); }
  recoil(p, p.facing);
}

function recoil(p, dir){ p.vx -= dir*30; }
function slash(x,y,face){
  ctx && null;
  game.floatingTexts.push({x:x, y:y-20, str:'', life:0}); // 占位
  burst(x+face*40, y, '#e8ecff',5);
}

function hurtEnemy(e, dmg, dir){
  e.hp -= dmg;
  if(e.invuln<=0){
    e.invuln=0.08;
    e.vx += dir*90;
  }
  floatingText('-'+dmg, e.x, e.y - e.h/2 - 6, '#ff8a8a');
  burst(e.x, e.y, '#ffb0b0', 4);
  if(e.hp<=0){ e.alive=false; checkoutEnemyDeath(e); }
}
function checkoutEnemyDeath(e){
  if(e.dead) return; e.dead=true; e.alive=false;
  run.kills++;
  // 掉落金币
  const dropCoins = 3 + Math.floor(Math.random()*4);
  run.coins += dropCoins;
  floatingText('+'+dropCoins+' 🪙', e.x, e.y-10, '#ffd76a');
  burst(e.x, e.y, '#fff', 8); burst(e.x,e.y,'#ff6a6a',6);

  // 武器掉落（低概率）
  const dropChance = Math.min(0.28, 0.12 + run.level*0.03);
  if(Math.random()<dropChance){
    const nw = rollNewWeapon(run.level);
    if(nw!==null){
      run.weapons.push(nw); run.curW=nw;
      game.player.curW=nw; game.player.weapons=run.weapons.slice();
      weaponToast(nw);
    }
  }
  updateHUD();
}

function increaseHP(maxAdd){
  const p=game.player;
  p.maxhp += maxAdd; p.hp = Math.min(p.maxhp, p.hp+maxAdd);
}

function openChest(c){
  burst(c.x*TILE+TILE/2, c.y*TILE+TILE/2, '#ffd76a', 10);
  const nw = rollNewWeapon(run.level);
  if(nw!==null){
    run.weapons.push(nw); run.curW=nw;
    game.player.curW=nw; game.player.weapons=run.weapons.slice();
    weaponToast(nw);
  } else {
    // 武器齐了 → 加金币+回血
    awardChestBonus();
  }
  updateHUD();
}
function awardChestBonus(){
  const p=game.player;
  const coins = 10+Math.floor(Math.random()*10);
  run.coins+=coins;
  p.hp = Math.min(p.maxhp, p.hp+8);
  floatingText('+'+coins+' 🪙', p.x, p.y-30, '#ffd76a');
  toast('宝箱清空：金币 +'+coins+'，生命 +8');
}

function hurtPlayer(dmg){
  const p=game.player;
  if(p.invuln>0) return;
  p.hp -= dmg; p.invuln=1.0;
  run.hp = p.hp;
  game.shake=12;
  floatingText('-'+dmg, p.x, p.y-30, '#ff5c5c');
  burst(p.x,p.y,'#ff5c5c',6);
  if(p.hp<=0){ p.hp=0; gameOver(); }
  updateHUD();
}

/* ---- 粒子 & 文字 ---- */
function burst(x,y,color,n){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, s=60+Math.random()*160;
  game.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-80,color,life:0.4+Math.random()*0.3,r:2+Math.random()*3}); } }
function floatingText(str,x,y,color){ game.floatingTexts.push({x,y,str,color,life:0.9}); }
function weaponToast(wid){
  const w=WEAPONS[wid];
  toast('获得武器：'+w.icon+' '+w.name+'（'+w.desc+'）  按 1~4 切换');
  buildWeaponBadges();
}

/* ---- 胜利 / 失败 ---- */
function levelCleared(){
  // 加成
  run.coins += 20 + run.level*5;
  increaseHP(6);
  run.hp = game.player.hp;
  run.bestLevel = Math.max(run.bestLevel||0, run.level);
  saveGame(run);
  showClearScreen();
  buildWeaponBadges();
  updateHUD();
}
function gameOver(){
  state='over';
  document.getElementById('go-stats').innerHTML =
    `到达关卡 <b>${run.level}</b>`+
    `<br>击杀 <b>${run.kills}</b> 只小动物`+
    `<br>金币 <b>${run.coins}</b>`;
  showScreen('gameover');
}

/* =====================================================================
   渲染
===================================================================== */
function render(){
  ctx.clearRect(0,0,VIEW_W,VIEW_H);
  // 背景天空
  let g = ctx.createLinearGradient(0,0,0,VIEW_H);
  g.addColorStop(0,'#1a2540'); g.addColorStop(0.6,'#232f4f'); g.addColorStop(1,'#2b3a5e');
  ctx.fillStyle=g; ctx.fillRect(0,0,VIEW_W,VIEW_H);
  // 远处星星
  for(let i=0;i<26;i++){
    const sx=(Math.sin(i*127.3)*0.5+0.5)*VIEW_W - (game.camX*0.1)%VIEW_W;
    ctx.globalAlpha=0.3+0.3*Math.sin(game.time*2+i);
    ctx.fillStyle='#fff'; ctx.fillRect(((sx%VIEW_W)+VIEW_W)%VIEW_W, (i*61)%250+20, 2,2);
  }
  ctx.globalAlpha=1;

  ctx.save();
  if(game.shake>0) ctx.translate((Math.random()-0.5)*game.shake,(Math.random()-0.5)*game.shake);
  ctx.translate(-game.camX, 0);

  const camX0=Math.floor(game.camX/TILE)-1, camX1=Math.ceil((game.camX+VIEW_W)/TILE)+1;
  // 绘制底图块
  for(let tx=camX0; tx<=camX1; tx++){
    for(let ty=0; ty<game.gH; ty++){
      const t=game.grid[ty][tx];
      if(t===1){
        ctx.fillStyle = '#3a4a68';
        ctx.fillRect(tx*TILE,ty*TILE,TILE,TILE);
        ctx.fillStyle = '#4d6088';
        ctx.fillRect(tx*TILE,ty*TILE,TILE,6);
        ctx.strokeStyle='rgba(0,0,0,.2)'; ctx.lineWidth=2;
        ctx.strokeRect(tx*TILE+1,ty*TILE+1,TILE-2,TILE-2);
        // 上部小草/石纹
        ctx.fillStyle='rgba(120,150,90,.4)';
        for(let s=0;s<3;s++){ const sx=(tx*57.3+s*23)%TILE; ctx.fillRect(tx*TILE+sx,ty*TILE+10+((s*17)%16),6,4); }
      } else if(t===2){
        ctx.fillStyle='#4ea06a';
        ctx.fillRect(tx*TILE,ty*TILE,TILE,TILE);
        ctx.fillStyle='#6cc07f';
        ctx.fillRect(tx*TILE,ty*TILE,TILE,18);
        ctx.fillRect(tx*TILE+8,ty*TILE+TILE-8,12,8); ctx.fillRect(tx*TILE+40,ty*TILE+TILE-8,14,8);
        ctx.strokeStyle='rgba(0,0,0,.15)'; ctx.lineWidth=2; ctx.strokeRect(tx*TILE,ty*TILE,TILE,TILE);
      }
    }
  }

  // 出口传送门
  const et=game.exitX;
  ctx.save();
  ctx.translate(et*TILE+TILE/2, game.exitPlat*TILE+ -TILE/2);
  const pulse=0.5+0.5*Math.sin(game.time*3);
  const rg=ctx.createRadialGradient(0,0,4,0,0,44+pulse*10);
  rg.addColorStop(0,'rgba(110,220,255,.95)'); rg.addColorStop(1,'rgba(80,120,255,.05)');
  ctx.fillStyle=rg; ctx.beginPath(); ctx.arc(0,0,44+pulse*10,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#dff6ff';
  ctx.font='28px serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('🌀',0,0);
  floatingTextDrawn='';
  ctx.restore();

  // 金币
  for(const c of game.coins){
    if(c.taken) continue;
    const b=Math.sin(game.time*5+c.x)*3;
    ctx.fillStyle='#ffd76a';
    ctx.beginPath(); ctx.arc(c.x, c.y+b, 10,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#f7b500';
    ctx.beginPath(); ctx.arc(c.x-1, c.y-1+b, 7,0,Math.PI*2); ctx.fill();
  }

  // 宝箱
  for(const c of game.chests){
    const cx=c.x*TILE+TILE/2, cy=c.y*TILE+TILE/2;
    if(c.opened){
      ctx.globalAlpha=0.5;
    }
    ctx.save(); ctx.translate(cx,cy);
    ctx.fillStyle='#8a5a2a'; ctx.fillRect(-22,-18,44,36);
    ctx.fillStyle='#a8783e'; ctx.fillRect(-26,-6,52,8);
    ctx.fillStyle='#ffd76a'; ctx.fillRect(-7,-22,14,16);
    ctx.strokeStyle='#5a3a18'; ctx.lineWidth=2; ctx.strokeRect(-22,-18,44,36); ctx.strokeRect(-26,-6,52,8);
    ctx.restore(); ctx.globalAlpha=1;
  }

  // 敌人
  for(const e of game.enemies){
    if(!e.alive) continue;
    drawEnemy(e);
  }

  // 玩家
  const p=game.player;
  const flash = p.invuln>0 && Math.floor(p.invuln*20)%2===0;
  drawChibi(ZODIAC[run.charId], p.x, p.y+p.h/2, 130, p.pose, p.facing, flash || null);

  // 投射物
  for(const pr of game.projectiles){
    ctx.save(); ctx.translate(pr.x,pr.y);
    if(pr.color==='#c9b4a0'){ // 箭
      ctx.rotate(Math.atan2(pr.vy,Math.abs(pr.vx))* (pr.vx<0?-1:1));
      ctx.strokeStyle='#8a5a2a'; ctx.lineWidth=3;
      ctx.beginPath(); ctx.moveTo(-12,0); ctx.lineTo(6,0); ctx.stroke();
      ctx.fillStyle='#8a5a2a'; ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(4,-4); ctx.lineTo(4,4); ctx.closePath(); ctx.fill();
    } else if(pr.color==='#ffd76a'){ // 子弹
      ctx.fillStyle='#ffd76a'; ctx.beginPath(); ctx.arc(0,0,4,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(0,0,1.6,0,Math.PI*2); ctx.fill();
    } else {
      ctx.fillStyle=pr.color; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }

  // 粒子
  for(const pt of game.particles){
    ctx.globalAlpha=Math.max(0,pt.life/pt.life)?1:1;
    ctx.globalAlpha = Math.min(1, pt.life*2);
    ctx.fillStyle=pt.color; ctx.beginPath(); ctx.arc(pt.x,pt.y,pt.r,0,Math.PI*2); ctx.fill();
  }
  ctx.globalAlpha=1;

  // 浮动文字
  for(const t of game.floatingTexts){
    if(!t.str) continue;
    ctx.globalAlpha=Math.min(1,t.life*2);
    ctx.font='bold 18px "Microsoft YaHei"'; ctx.textAlign='center';
    ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillText(t.str,t.x+1,t.y+1);
    ctx.fillStyle=t.color; ctx.fillText(t.str,t.x,t.y);
  }
  ctx.globalAlpha=1;

  ctx.restore();
  drawMinimap();
}
let floatingTextDrawn='';

function drawAimRing(x,y,r,c){}

function drawEnemy(e){
  const b=Math.sin(game.time*4+e.startX)*3;
  const flash = e.invuln>0;
  drawZodiacEnemy(e, b, flash);
}
/* 敌人：小动物绘制（Q版），基于 face */
function drawZodiacEnemy(e, b, flash){
  const x=e.x, y=e.y+e.h/2;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(e.facing,1);
  if(flash) ctx.globalAlpha=0.5;
  const S=(e.w)/64; // 基础单位缩放
  const c=e.color;
  // 身体大圆
  ctx.fillStyle=c; ctx.beginPath(); ctx.ellipse(0, -20*S, 30*S, 27*S,0,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='rgba(255,255,255,.2)'; ctx.beginPath(); ctx.ellipse(-8*S,-26*S,9*S,8*S,0,0,Math.PI*2); ctx.fill();
  // 肚皮
  ctx.fillStyle='rgba(255,255,255,.55)'; ctx.beginPath(); ctx.ellipse(0,-12*S,18*S,14*S,0,0,Math.PI*2); ctx.fill();
  // 眼睛
  ctx.fillStyle='#23333d';
  ctx.beginPath(); ctx.arc(-12*S,-24*S,5*S,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(12*S,-24*S,5*S,0,Math.PI*2); ctx.fill();
  ctx.fillStyle='#fff'; ctx.beginPath(); ctx.arc(-10*S,-26*S,1.8*S,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(14*S,-26*S,1.8*S,0,Math.PI*2); ctx.fill();
  // 依据类型加特征
  ctx.fillStyle=c;
  switch(e.face){
    case 'mouse': roundRect(0,-40*S,6*S,12*S,3,'#e8a0a8'); roundRect(-20*S,-50*S,14*S,16*S,6,c); roundRect(8*S,-50*S,14*S,16*S,6,c); break;
    case 'spider': for(let i=-1;i<=1;i++){roundRect(-30*S, -40*S+i*4, 8*S,3*S,1,c); roundRect(22*S,-40*S+i*4,8*S,3*S,1,c);} ctx.fillStyle='#e0e0e8'; ctx.beginPath(); ctx.arc(0,-22*S,4*S,0,Math.PI*2); ctx.fill(); break;
    case 'bat': roundRect(-12*S,-52*S,16*S,20*S,8,'#4a4a68'); roundRect(2*S,-52*S,16*S,20*S,8,'#4a4a68'); break;
    case 'frog': ctx.fillStyle='#8adf5f'; ctx.beginPath(); ctx.arc(-12*S,-33*S,6*S,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(12*S,-33*S,6*S,0,Math.PI*2); ctx.fill(); break;
    case 'boar': ctx.fillStyle='#e8d8a0'; ctx.beginPath(); ctx.moveTo(-6*S,-40*S); ctx.lineTo(0*S,-54*S); ctx.lineTo(6*S,-40*S); ctx.fill(); roundRect(4*S,-42*S,10*S,6*S,2,'#fff'); break;
    case 'bee': ctx.fillStyle='#3a3a4a'; ctx.fillRect(-30*S,-30*S,60*S,10*S); ctx.fillRect(-20*S,-44*S,10*S,26*S); ctx.fillRect(12*S,-44*S,10*S,26*S); ctx.fillStyle='#fff'; ctx.beginPath(); ctx.ellipse(0,-26*S,7*S,6*S,0,0,Math.PI*2); ctx.fill(); break;
    case 'bear': roundRect(-24*S,-52*S,20*S,18*S,7,c); roundRect(8*S,-52*S,20*S,18*S,7,c); ctx.fillStyle='#3a2a20'; ctx.fillRect(-6*S,-22*S,12*S,6*S); break;
  }
  // 血条
  const hw=e.w*0.8;
  const ratio=Math.max(0,e.hp/e.maxhp);
  ctx.fillStyle='rgba(0,0,0,.5)'; ctx.fillRect(-hw/2,-e.h/2-14,hw,5);
  ctx.fillStyle=ratio>0.5?'#6ec77a': ratio>0.25?'#ffd76a':'#ff5c5c';
  ctx.fillRect(-hw/2,-e.h/2-14,hw*ratio,5);
  ctx.restore();
}
function roundRect(x,y,w,h,r,color){ if(!color)color='#fff'; ctx.fillStyle=color; ctx.beginPath();
  if(w>0&&h>0){ ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); } ctx.closePath(); ctx.fill(); }

/* ---------- 小地图 ---------- */
let minimapCanvas=null;
function buildMinimap(){
  const el=document.getElementById('minimap');
  el.style.display='block';
  const scale=Math.min(150/game.gW, 60/game.gH);
  const w=Math.max(80, Math.round(game.gW*scale)), h=Math.round(game.gH*scale);
  minimapCanvas=document.createElement('canvas'); minimapCanvas.width=w; minimapCanvas.height=h;
  minimapCanvas.style.width=w+'px'; minimapCanvas.style.height=h+'px';
  el.innerHTML=''; el.appendChild(minimapCanvas);
}
function drawMinimap(){
  if(!minimapCanvas) return;
  const c=minimapCanvas, mc=c.getContext('2d');
  mc.clearRect(0,0,c.width,c.height);
  const s=c.width/game.gW;
  for(let tx=0;tx<game.gW;tx++)for(let ty=0;ty<game.gH;ty++){
    const t=game.grid[ty][tx];
    if(t===1){ mc.fillStyle='#5a6b8c'; mc.fillRect(tx*s,ty*s,s,s); }
    else if(t===2){ mc.fillStyle='#4ea06a'; mc.fillRect(tx*s,ty*s,s,s); }
  }
  mc.fillStyle='#8fd8ff'; mc.fillRect(game.exitX*s,(game.exitPlat-0.4)*s,s,s*0.8);
  mc.fillStyle='#ff5c5c';
  for(const e of game.enemies) if(e.alive) mc.fillRect(e.x/TILE*s, e.y/TILE*s, Math.max(1,s), Math.max(1,s));
  const p=game.player;
  mc.fillStyle='#ffd76a'; mc.fillRect(p.x/TILE*s, p.y/TILE*s, Math.max(1,s+1), Math.max(1,s+1));
}

/* =====================================================================
   HUD
===================================================================== */
function updateHUD(){
  const el=document.getElementById('hp-fill');
  el.style.width=Math.max(0, Math.round(run.hp/ (game.player.maxhp) *100))+'%';
  document.getElementById('coin-count').textContent='🪙 '+run.coins;
  document.getElementById('level-count').textContent=run.level;
  buildWeaponBadges();
}
function buildWeaponBadges(){
  const box=document.getElementById('weapon-badges');
  box.innerHTML='';
  WEAPONS.forEach((w,i)=>{
    const b=document.createElement('span');
    b.className='wbadge'+(run.curW===i?' on':'');
    b.textContent=w.icon+' '+w.name;
    box.appendChild(b);
  });
}
function switchWeapon(i){
  if(!game||state!=='play') return;
  if(run.weapons.includes(i)){ run.curW=i; game.player.curW=i; updateHUD(); toast(WEAPONS[i].icon+' 切换到 '+WEAPONS[i].name); }
}

/* =====================================================================
   屏幕管理 & 事件
===================================================================== */
function showScreen(name){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('menu-screen').classList.toggle('active', name==='menu');
  document.getElementById('select-screen').classList.toggle('active', name==='select');
  document.getElementById('how-screen').classList.toggle('active', name==='how');
  document.getElementById('pause-screen').classList.toggle('active', name==='pause');
  document.getElementById('stage-clear-screen').classList.toggle('active', name==='clear');
  document.getElementById('gameover-screen').classList.toggle('active', name==='over');
  document.getElementById('game-wrap').classList.toggle('hidden', name==='play'||name==='clear'||name==='over');
  document.getElementById('hud').classList.toggle('hidden', !(name==='play'));
  document.getElementById('touch-controls').classList.toggle('hidden', !((name==='play')&&isTouch));
  if(name==='play'){ document.getElementById('game-wrap').classList.remove('hidden'); }
}

let isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints>0;
function toast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg; t.classList.remove('hidden');
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.add('hidden'),2600);
}

/* 菜单初始化 */
function initMenu(){
  document.getElementById('new-game-btn').onclick=()=>{ openSelect(false); };
  document.getElementById('continue-btn').onclick=()=>{
    const s=loadSave();
    if(!s){ toast('暂无存档'); return; }
    run = { charId:s.character, level:s.level, coins:s.coins, weapons:s.weapons||[0],
            curW:s.currentWeapon||s.weapons[0]||0, kills:s.kills||0, bestLevel:s.bestLevel||0 };
    run.hp = 100;
    beginRun();
  };
  document.getElementById('how-btn').onclick=()=>showScreen('how');
  document.getElementById('back-from-how').onclick=()=>showScreen('menu');
  document.getElementById('back-from-select').onclick=()=>showScreen('menu');
  document.getElementById('confirm-btn').onclick=()=>{
    run = { charId:selectedChar, level:1, coins:0, weapons:[0], curW:0, kills:0, bestLevel:0, hp:100 };
    beginRun();
  };
  document.getElementById('resume-btn').onclick=()=>{ state='play'; showScreen('play'); };
  document.getElementById('save-exit-btn').onclick=()=>{ saveExit(); };
  document.getElementById('quit-btn').onclick=()=>{ quitToMenu(); };
  document.getElementById('next-level-btn').onclick=nextLevel;
  document.getElementById('retry-btn').onclick=()=>{ run.hp=100; beginRun(); };
  document.getElementById('go-menu-btn').onclick=()=>quitToMenu();
  updateContinueBtn();
}

function updateContinueBtn(){
  const s=loadSave();
  const btn=document.getElementById('continue-btn');
  if(s){ btn.classList.remove('disabled');
    btn.textContent = '继续游戏（第'+s.level+'关 · '+ZODIAC[s.character%12].hero+'）';
  } else { btn.classList.add('disabled'); }
}

/* 角色选择 */
let selectedChar=0;
function buildZodiacGrid(){
  const grid=document.getElementById('zodiac-grid');
  grid.innerHTML='';
  ZODIAC.forEach((a,i)=>{
    const card=document.createElement('div');
    card.className='zcard'+(i===selectedChar?' selected':'');
    const cv=document.createElement('canvas'); cv.width=132; cv.height=132;
    // 绘制肖像
    let cc=cv.getContext('2d'); cc.clearRect(0,0,132,132);
    // 复制 ctx 绘制用临时画布
    const tmp=ctx; ctx=cc;
    drawChibi(a,66,118,130,0,1,null);
    ctx=tmp;
    const name=document.createElement('div'); name.className='zn'; name.textContent=a.hero;
    const cn=document.createElement('div'); cn.className='zcn'; cn.textContent='生肖：'+a.cn;
    card.appendChild(cv); card.appendChild(name); card.appendChild(cn);
    card.onclick=()=>{ selectedChar=i; document.querySelectorAll('.zcard').forEach(c=>c.classList.remove('selected')); card.classList.add('selected'); document.getElementById('confirm-btn').classList.remove('disabled'); };
    grid.appendChild(card);
  });
}
function openSelect(fresh){ showScreen('select'); }

function beginRun(){
  // 新一局开始，从 run.level 开始
  startLevel();
  state='play';
  showScreen('play');
  updateHUD(); buildWeaponBadges();
  toast('第 '+run.level+' 关 · 找到出口传送门 🌀');
}
function saveExit(){
  run.hp=game.player.hp;
  saveGame(run);
  toast('已存档');
  quitToMenu();
}
function quitToMenu(){
  state='menu'; game=null; showScreen('menu'); updateContinueBtn();
}
function showClearScreen(){
  document.getElementById('clear-stats').innerHTML =
    `通关第 <b>${run.level}</b> 关`+
    `<br>累计击杀 <b>${run.kills}</b> 只`+
    `<br>金币 <b>${run.coins}</b>　生命上限 +6`;
  document.getElementById('next-level-num').textContent = run.level+1;
  document.getElementById('hud').classList.add('hidden');
  document.getElementById('touch-controls').classList.add('hidden');
  showScreen('clear');
}
function nextLevel(){
  run.level++;
  run.hp = game.player.hp;
  saveGame(run);
  beginRun();
}
function togglePause(){
  if(state==='play'){ state='pause'; showScreen('pause'); }
  else if(state==='pause'){ state='play'; showScreen('play'); }
}

/* =====================================================================
   主循环
===================================================================== */
let last=0;
function loop(t){
  requestAnimationFrame(loop);
  const dt=Math.min(0.04,(t-last)/1000||0.016); last=t;
  if(state==='play'&&game){ update(dt); render(); }
}
requestAnimationFrame(loop);

/* 画布自适应缩放 */
function fitCanvas(){
  const wrap=document.getElementById('game-wrap');
  const availW=wrap.clientWidth, availH=wrap.clientHeight;
  if(state==='play'||state==='clear'||state==='over'){
    let s=Math.min(availW/VIEW_W, availH/VIEW_H);
    canvas.style.width=(VIEW_W*s)+'px'; canvas.style.height=(VIEW_H*s)+'px';
  } else { canvas.style.width=VIEW_W+'px'; canvas.style.height=VIEW_H+'px'; }
}
addEventListener('resize', fitCanvas);

/* 出生 → 启动 */
function boot(){
  fitCanvas();
  initMenu();
  buildZodiacGrid();
  showScreen('menu');
  updateContinueBtn();
}
boot();