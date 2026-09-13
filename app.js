let DATA = {teachers:[]};
let currentTeacher = null;
let currentClass = null;

const $ = s => document.querySelector(s);

async function loadData(){
  try{
    const res = await fetch('data.json', {cache:'no-store'});
    DATA = await res.json();
    renderSubjects();
    renderTeachers(DATA.teachers || []);
    renderLectures(DATA.teachers || []);
  }catch(e){
    console.error(e);
    $('#teachersGrid').innerHTML = '<div class="empty">تعذر تحميل data.json</div>';
  }
}

function subjectMap(){
  const map = new Map();
  (DATA.teachers||[]).forEach(t=>{
    const subject = t.subject || 'مادة';
    if(!map.has(subject)) map.set(subject, []);
    map.get(subject).push(t);
  });
  return map;
}
function subjectIcon(subject){
  if(subject.includes('كيمي')) return '⚗';
  if(subject.includes('عربي')) return '📖';
  if(subject.includes('اسلام')) return '✦';
  if(subject.includes('رياض')) return '∑';
  if(subject.includes('فيزياء')) return '⚡';
  if(subject.includes('أحياء') || subject.includes('احياء')) return '🧬';
  return '✦';
}
function renderSubjects(){
  const map = subjectMap();
  $('#subjectsGrid').innerHTML = [...map.entries()].map(([name,teachers])=>`
    <article class="subject-card" onclick="filterSubject(${JSON.stringify(name)})">
      <div class="subject-icon">${subjectIcon(name)}</div>
      <h3>${escapeHtml(name)}</h3>
      <span>${teachers.length} مدرس</span>
    </article>`).join('') || '<div class="empty">لا توجد مواد</div>';
}
function renderTeachers(teachers){
  $('#teachersGrid').innerHTML = teachers.map(t=>`
    <article class="teacher-card" onclick="openTeacher(${Number(t.id)})">
      <img src="${safeUrl(t.image)}" alt="" onerror="this.style.visibility='hidden'">
      <div class="teacher-info">
        <h3>${escapeHtml(t.name||'مدرس')}</h3>
        <p>${escapeHtml(t.subject||'')}</p>
      </div>
    </article>`).join('') || '<div class="empty">لا توجد نتائج</div>';
}
function allLectures(){
  const arr=[];
  (DATA.teachers||[]).forEach(t=>(t.classes||[]).forEach(c=>(c.lectures||[]).forEach(l=>arr.push({teacher:t,className:c.name,lecture:l}))));
  return arr;
}
function renderLectures(teachers){
  const arr=[];
  teachers.forEach(t=>(t.classes||[]).forEach(c=>(c.lectures||[]).slice(0,3).forEach(l=>arr.push({teacher:t,className:c.name,lecture:l}))));
  $('#lecturesGrid').innerHTML = arr.slice(0,8).map(x=>lectureHtml(x)).join('') || '<div class="empty">لا توجد محاضرات</div>';
}
function lectureHtml(x){
  return `<article class="lecture-card" onclick='openLecture(${JSON.stringify(encodeURIComponent(JSON.stringify(x)))})'>
    <div class="play">▶</div>
    <div class="lecture-info"><strong>${escapeHtml(x.lecture.title||'محاضرة')}</strong><small>${escapeHtml(x.teacher.name||'')} • ${escapeHtml(x.className||'')}</small></div>
    <span>›</span>
  </article>`;
}
function filterSubject(subject){
  const teachers=(DATA.teachers||[]).filter(t=>t.subject===subject);
  renderTeachers(teachers);
  scrollToSection('teachers');
}
function openTeacher(id){
  currentTeacher=(DATA.teachers||[]).find(t=>Number(t.id)===Number(id));
  if(!currentTeacher) return;
  const classes=currentTeacher.classes||[];
  $('#modalBody').innerHTML=`
    <h2>${escapeHtml(currentTeacher.name)}</h2>
    <p>${escapeHtml(currentTeacher.subject||'')}</p>
    <div class="class-tabs">${classes.map((c,i)=>`<button class="class-tab ${i===0?'active':''}" onclick="selectClass(${i})">${escapeHtml(c.name)}</button>`).join('')}</div>
    <div id="classLectures"></div>`;
  selectClass(0);
  $('#modal').classList.remove('hidden');
}
function selectClass(i){
  currentClass=currentTeacher?.classes?.[i];
  document.querySelectorAll('.class-tab').forEach((b,n)=>b.classList.toggle('active',n===i));
  const list=currentClass?.lectures||[];
  $('#classLectures').innerHTML=list.map(l=>lectureHtml({teacher:currentTeacher,className:currentClass.name,lecture:l})).join('')||'<div class="empty">لا توجد محاضرات</div>';
}
function openLecture(encoded){
  const x=JSON.parse(decodeURIComponent(encoded));
  const url=x.lecture.url||'';
  $('#modalBody').innerHTML=`<h2>${escapeHtml(x.lecture.title||'المحاضرة')}</h2><p>${escapeHtml(x.teacher.name||'')} • ${escapeHtml(x.className||'')}</p><div class="player" id="player"></div>`;
  const player=$('#player');
  if(/\.m3u8($|\?)/i.test(url)){
    player.innerHTML='<video id="video" controls playsinline></video>';
    const video=$('#video');
    if(window.Hls && Hls.isSupported()){
      const hls=new Hls(); hls.loadSource(url); hls.attachMedia(video);
    }else if(video.canPlayType('application/vnd.apple.mpegurl')) video.src=url;
    else player.innerHTML='<p>المتصفح لا يدعم تشغيل هذا الفيديو.</p>';
  }else if(/youtu\.be|youtube\.com/i.test(url)){
    const id=youtubeId(url);
    player.innerHTML=`<iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>`;
  }else{
    player.innerHTML=`<video src="${safeUrl(url)}" controls playsinline></video>`;
  }
  $('#modal').classList.remove('hidden');
}
function youtubeId(url){
  try{const u=new URL(url); return u.hostname.includes('youtu.be')?u.pathname.slice(1):u.searchParams.get('v')||''}catch{return ''}
}
function closeModal(){ $('#modal').classList.add('hidden'); $('#modalBody').innerHTML=''; }
function scrollToSection(id){ document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'}); }
function scrollToTop(){ window.scrollTo({top:0,behavior:'smooth'}); }
function escapeHtml(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}
function safeUrl(v){try{const u=new URL(v);return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}

$('#search').addEventListener('input', e=>{
  const q=e.target.value.trim().toLowerCase();
  if(!q){renderTeachers(DATA.teachers||[]);return}
  const result=(DATA.teachers||[]).filter(t=>
    String(t.name||'').toLowerCase().includes(q) ||
    String(t.subject||'').toLowerCase().includes(q) ||
    (t.classes||[]).some(c=>String(c.name||'').toLowerCase().includes(q) ||
      (c.lectures||[]).some(l=>String(l.title||'').toLowerCase().includes(q)))
  );
  renderTeachers(result);
});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});
loadData();
