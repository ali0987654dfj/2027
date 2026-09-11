
let DATA = {teachers:[]};
let currentTeacher = null;
const $ = s => document.querySelector(s);

async function loadData(){
  try{
    const res = await fetch("data.json", {cache:"no-store"});
    if(!res.ok) throw new Error("data.json");
    DATA = await res.json();
  }catch(e){
    console.error(e);
    DATA = {teachers:[]};
  }
  $("#teacherCount").textContent = DATA.teachers.length;
  renderTeachers(DATA.teachers);
}

function renderTeachers(teachers){
  const grid = $("#teachersGrid");
  grid.innerHTML = "";
  $("#emptyTeachers").classList.toggle("hidden", teachers.length !== 0);
  teachers.forEach(t=>{
    const lectures = (t.classes||[]).reduce((n,c)=>n+(c.lectures||[]).length,0);
    const card = document.createElement("article");
    card.className="teacher-card";
    card.innerHTML = `
      <img class="teacher-img" src="${esc(t.image||"")}" alt="${esc(t.name)}" onerror="this.style.opacity='.35'">
      <h3>${esc(t.name)}</h3>
      <div class="subject">${esc(t.subject||"")}</div>
      <div class="teacher-meta"><span>${(t.classes||[]).length} فصل</span><span>${lectures} محاضرة</span></div>
      <button class="open-btn">عرض المحاضرات</button>`;
    card.querySelector(".open-btn").onclick=()=>openTeacher(t.id);
    grid.appendChild(card);
  });
}

function openTeacher(id){
  currentTeacher = DATA.teachers.find(t=>String(t.id)===String(id));
  if(!currentTeacher) return;
  $("#teachersSection").classList.add("hidden");
  $(".hero").classList.add("hidden");
  $("#teacherView").classList.remove("hidden");
  $("#teacherHeader").innerHTML = `
    <img src="${esc(currentTeacher.image||"")}" alt="" onerror="this.style.opacity='.35'">
    <div><h2>${esc(currentTeacher.name)}</h2><p>${esc(currentTeacher.subject||"")}</p></div>`;
  const wrap=$("#classes"); wrap.innerHTML="";
  (currentTeacher.classes||[]).forEach((c,ci)=>{
    const box=document.createElement("section"); box.className="class-box";
    box.innerHTML=`<div class="class-title"><span>${esc(c.name||"المحاضرات")}</span><span>${(c.lectures||[]).length} محاضرة</span></div><div class="lectures"></div>`;
    const list=box.querySelector(".lectures");
    (c.lectures||[]).forEach((l,li)=>{
      const item=document.createElement("div"); item.className="lecture";
      item.innerHTML=`<div><h4>${esc(l.title||`محاضرة ${li+1}`)}</h4><p>${esc(l.description||"")}</p></div><button class="play">▶ تشغيل</button>`;
      item.querySelector(".play").onclick=()=>playLecture(l,currentTeacher);
      list.appendChild(item);
    });
    wrap.appendChild(box);
  });
  window.scrollTo({top:0,behavior:"smooth"});
}

function closeTeacher(){
  $("#teacherView").classList.add("hidden");
  $(".hero").classList.remove("hidden");
  $("#teachersSection").classList.remove("hidden");
  window.scrollTo({top:0,behavior:"smooth"});
}

function playLecture(lecture,teacher){
  $("#playerTitle").textContent=lecture.title||"المحاضرة";
  $("#playerTeacher").textContent=teacher.name;
  $("#playerDescription").textContent=lecture.description||"";
  const area=$("#videoArea"); area.innerHTML="";
  const url=lecture.url||"";
  if(isYoutube(url)){
    const iframe=document.createElement("iframe");
    iframe.src=youtubeEmbed(url);
    iframe.allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen=true; area.appendChild(iframe);
  }else if(url.includes(".m3u8")){
    const video=document.createElement("video");
    video.controls=true; video.playsInline=true; video.autoplay=true;
    area.appendChild(video);
    if(video.canPlayType("application/vnd.apple.mpegurl")) video.src=url;
    else if(window.Hls && Hls.isSupported()){
      const hls=new Hls();
      hls.loadSource(url); hls.attachMedia(video);
      hls.on(Hls.Events.ERROR,(e,d)=>{ if(d.fatal) showVideoError(area); });
    }else showVideoError(area);
  }else{
    const video=document.createElement("video");
    video.controls=true; video.playsInline=true; video.src=url; area.appendChild(video);
  }
  $("#playerModal").classList.remove("hidden");
}
function showVideoError(area){area.innerHTML='<div style="padding:30px;text-align:center;color:#cbd5e1">تعذر تشغيل هذا الرابط في المتصفح.</div>'}
function isYoutube(u){return /youtu\.be\/|youtube\.com\//i.test(u)}
function youtubeEmbed(u){
  let id="";
  try{
    const x=new URL(u);
    if(x.hostname.includes("youtu.be")) id=x.pathname.slice(1);
    else id=x.searchParams.get("v")||x.pathname.split("/").pop();
  }catch{}
  return "https://www.youtube.com/embed/"+encodeURIComponent(id)+"?autoplay=1&rel=0";
}
function closePlayer(){ $("#playerModal").classList.add("hidden"); $("#videoArea").innerHTML=""; }
function esc(v){return String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

$("#searchInput").addEventListener("input",e=>{
  const q=e.target.value.trim().toLowerCase();
  const filtered=DATA.teachers.filter(t=>{
    const base=(t.name+" "+t.subject).toLowerCase();
    const lectures=(t.classes||[]).flatMap(c=>[c.name,...(c.lectures||[]).map(l=>l.title+" "+(l.description||""))]).join(" ").toLowerCase();
    return (base+" "+lectures).includes(q);
  });
  renderTeachers(filtered);
});
$("#backBtn").onclick=closeTeacher;
$("#homeBtn").onclick=()=>{closeTeacher();$("#searchInput").value="";renderTeachers(DATA.teachers)};
$("#closePlayer").onclick=closePlayer;
$("#modalClose").onclick=closePlayer;
$("#themeBtn").onclick=()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("sixthTheme",document.body.classList.contains("dark")?"dark":"light");
};
if(localStorage.getItem("sixthTheme")==="dark") document.body.classList.add("dark");
$("#year").textContent=new Date().getFullYear();
loadData();
