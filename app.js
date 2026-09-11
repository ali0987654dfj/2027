let state={teachers:[]};
const $=x=>document.querySelector(x);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

async function init(){
  try{
    const r=await fetch('/api/data?v='+Date.now(),{cache:'no-store'});
    if(!r.ok) throw new Error('api');
    state=await r.json(); local(); setStatus('متصل أونلاين ✅');
  }catch(e){
    try{state=JSON.parse(localStorage.getItem('data')||'{"teachers":[]}')}catch(x){state={teachers:[]}}
    setStatus('وضع محلي ⚠️');
  }
  render();
}
function setStatus(x){const el=$('#status');if(el)el.textContent=x}
function local(){localStorage.setItem('data',JSON.stringify(state))}
function render(){
  let q=$('#search').value.trim(),box=$('#teachers');box.innerHTML='';
  state.teachers.forEach((t,ti)=>{
    if(q&&!((t.name||'').includes(q)||(t.subject||'').includes(q)))return;
    let d=document.createElement('article');d.className='teacher';
    d.innerHTML=`<div class="head"><div class="info"><img src="${esc(t.image)}" onerror="this.style.display='none'"><div><h2>${esc(t.name)}</h2><div class="muted">${esc(t.subject)}</div></div></div><div><button onclick="editT(${ti})">تعديل</button><button onclick="addC(${ti})">+ قسم</button><button onclick="delT(${ti})">حذف</button></div></div>${(t.classes||[]).map((c,ci)=>`<div class="class"><div class="classhead"><b>${esc(c.name)}</b><div><button onclick="editC(${ti},${ci})">تعديل</button><button onclick="addL(${ti},${ci})">+ محاضرة</button><button onclick="delC(${ti},${ci})">حذف</button></div></div>${(c.lectures||[]).map((l,li)=>`<div class="lecture"><span><b>${esc(l.title)}</b><br><small>${esc(l.description)}</small></span><span><button onclick="editL(${ti},${ci},${li})">تعديل</button><button onclick="delL(${ti},${ci},${li})">حذف</button></span></div>`).join('')}</div>`).join('')}`;
    box.appendChild(d);
  });
}
function modal(title,body,fn){
  $('#mt').textContent=title;$('#mb').innerHTML=body;$('#modal').classList.remove('hidden');
  $('#save').onclick=async()=>{fn();local();render();$('#modal').classList.add('hidden');await saveOnline()}
}
function editT(i){let t=state.teachers[i];modal('تعديل المدرس',`<label>الاسم</label><input id="a" value="${esc(t.name)}"><label>المادة</label><input id="b" value="${esc(t.subject)}"><label>الصورة</label><input id="c" value="${esc(t.image)}"><button id="save" class="primary">حفظ</button>`,()=>{t.name=$('#a').value;t.subject=$('#b').value;t.image=$('#c').value})}
function addT(){modal('إضافة مدرس',`<label>الاسم</label><input id="a"><label>المادة</label><input id="b"><label>الصورة</label><input id="c"><button id="save" class="primary">إضافة</button>`,()=>state.teachers.push({id:Date.now(),name:$('#a').value,subject:$('#b').value,image:$('#c').value,classes:[]}))}
function addC(i){modal('إضافة قسم',`<label>اسم القسم</label><input id="a"><button id="save" class="primary">إضافة</button>`,()=>state.teachers[i].classes.push({name:$('#a').value,lectures:[]}))}
function editC(i,j){let c=state.teachers[i].classes[j];modal('تعديل القسم',`<label>الاسم</label><input id="a" value="${esc(c.name)}"><button id="save" class="primary">حفظ</button>`,()=>c.name=$('#a').value)}
function addL(i,j){modal('إضافة محاضرة',`<label>العنوان</label><input id="a" placeholder="محاضرة 16"><label>الوصف</label><textarea id="b"></textarea><label>رابط الفيديو</label><input id="c"><button id="save" class="primary">إضافة</button>`,()=>state.teachers[i].classes[j].lectures.push({title:$('#a').value,description:$('#b').value,url:$('#c').value}))}
function editL(i,j,k){let l=state.teachers[i].classes[j].lectures[k];modal('تعديل المحاضرة',`<label>العنوان</label><input id="a" value="${esc(l.title)}"><label>الوصف</label><textarea id="b">${esc(l.description)}</textarea><label>الرابط</label><input id="c" value="${esc(l.url)}"><button id="save" class="primary">حفظ</button>`,()=>{l.title=$('#a').value;l.description=$('#b').value;l.url=$('#c').value})}
function delT(i){if(confirm('حذف المدرس؟')){state.teachers.splice(i,1);local();render();saveOnline()}}
function delC(i,j){if(confirm('حذف القسم؟')){state.teachers[i].classes.splice(j,1);local();render();saveOnline()}}
function delL(i,j,k){if(confirm('حذف المحاضرة؟')){state.teachers[i].classes[j].lectures.splice(k,1);local();render();saveOnline()}}

async function saveOnline(){
  const key=localStorage.getItem('admin_key')||prompt('أدخل مفتاح لوحة التحكم ADMIN_KEY:');
  if(!key){setStatus('لم يتم الحفظ أونلاين ⚠️');return false}
  localStorage.setItem('admin_key',key);
  try{
    const r=await fetch('/api/data',{method:'POST',headers:{'content-type':'application/json','x-admin-key':key},body:JSON.stringify(state)});
    if(r.status===401){localStorage.removeItem('admin_key');setStatus('مفتاح غير صحيح ❌');alert('مفتاح ADMIN_KEY غير صحيح');return false}
    if(!r.ok)throw new Error('save');
    setStatus('تم الحفظ أونلاين ✅');return true;
  }catch(e){setStatus('تعذر الحفظ أونلاين ⚠️');alert('تعذر الحفظ أونلاين حالياً');return false}
}
function downloadJson(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='data.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}

$('#search').oninput=render;
$('#addTeacher').onclick=addT;
$('#close').onclick=()=>$('#modal').classList.add('hidden');
$('#importBtn').onclick=()=>$('#fileInput').click();
$('#fileInput').onchange=async e=>{try{state=JSON.parse(await e.target.files[0].text());local();render();await saveOnline();alert('تم الاستيراد والحفظ أونلاين')}catch(x){alert('JSON غير صالح')}};
$('#exportBtn').onclick=downloadJson;
$('#saveOnline').onclick=saveOnline;
init();
