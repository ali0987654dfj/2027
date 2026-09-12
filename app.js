let teachers = [];
let activeFilter = "الكل";
const $ = s => document.querySelector(s);

async function loadData(){
  const res = await fetch("data.json");
  const data = await res.json();
  teachers = data.teachers || [];
  renderStats();
  renderFilters();
  renderTeachers();
}

function lectureCount(t){
  return (t.classes||[]).reduce((n,c)=>n+(c.lectures||[]).length,0);
}

function classCount(t){
  return (t.classes||[]).length;
}

function subjects(){
  return [...new Set(teachers.map(t=>t.subject).filter(Boolean))];
}

function renderStats(){
  const lectures = teachers.reduce((n,t)=>n+lectureCount(t),0);
  const classes = teachers.reduce((n,t)=>n+classCount(t),0);

  $("#stats").innerHTML = `
    <div class="stat">
      <div class="stat-icon">👨‍🏫</div>
      <div>
        <b>${teachers.length}</b>
        <span>مدرسين</span>
      </div>
    </div>

    <div class="stat">
      <div class="stat-icon">▣</div>
      <div>
        <b>${classes}</b>
        <span>فصول</span>
      </div>
    </div>

    <div class="stat">
      <div class="stat-icon">▶</div>
      <div>
        <b>${lectures}</b>
        <span>محاضرة</span>
      </div>
    </div>`;
}

function renderFilters(){
  const items = ["الكل", ...subjects()];

  $("#filters").innerHTML = items.map(x =>
    `<button class="filter ${x===activeFilter?'active':''}"
      onclick="setFilter(${JSON.stringify(x)})">${x}</button>`
  ).join("");
}

function setFilter(x){
  activeFilter=x;
  renderFilters();
  renderTeachers();
}

function renderTeachers(){
  const q = ($("#searchInput").value||"").trim().toLowerCase();

  const list = teachers.filter(t=>{
    const matchFilter =
      activeFilter==="الكل" || t.subject===activeFilter;

    const hay = [
      t.name,
      t.subject,
      ...(t.classes||[]).flatMap(c=>[
        c.name,
        ...(c.lectures||[]).map(l=>l.title)
      ])
    ].join(" ").toLowerCase();

    return matchFilter && (!q || hay.includes(q));
  });

  $("#teachersGrid").innerHTML =
    list.map(teacherCard).join("");

  $("#emptyState").hidden = list.length!==0;
}

function teacherCard(t){
  const lectures=lectureCount(t);
  const classes=classCount(t);

  return `
  <article class="teacher">

    <div class="teacher-img">

      <img
        src="${esc(t.image||"")}"
        alt="${esc(t.name)}"
        loading="lazy"
        onerror="this.style.display='none'"
      >

      <span class="count">
        ${lectures} محاضرة
      </span>

    </div>

    <div class="teacher-body">

      <div class="teacher-sub">
        ${esc(t.subject||"مادة")}
      </div>

      <h3>
        ${esc(t.name||"مدرس")}
      </h3>

      <div class="teacher-meta">
        <span>${classes} فصل</span>
        <span>${lectures} محاضرة</span>
      </div>

      <button onclick="openTeacher(${t.id})">
        عرض المحاضرات
      </button>

    </div>

  </article>`;
}

function openTeacher(id){

  const t=teachers.find(
    x=>String(x.id)===String(id)
  );

  if(!t)return;

  $("#homeView").hidden=true;
  $("#stats").hidden=true;
  $(".content-section").hidden=true;
  $("#detailsView").hidden=false;

  $("#teacherDetails").innerHTML=`

    <div class="detail-hero">

      <img
        class="detail-img"
        src="${esc(t.image||"")}"
        alt="${esc(t.name)}"
      >

      <div>

        <div class="detail-sub">
          ${esc(t.subject)}
        </div>

        <h2>
          ${esc(t.name)}
        </h2>

        <p>
          ${lectureCount(t)} محاضرة
          •
          ${classCount(t)} فصل
        </p>

      </div>

    </div>

    ${(t.classes||[]).map(c=>`

      <div class="class-block">

        <h3 class="class-title">
          ${esc(c.name)}
        </h3>

        <div class="lecture-list">

          ${(c.lectures||[]).map((l,i)=>`

            <div
              class="lecture"
              onclick="playLecture(
                ${t.id},
                ${JSON.stringify(c.name)},
                ${i}
              )"
            >

              <span class="play-badge">
                ▶
              </span>

              <div>

                <strong>
                  ${esc(l.title||`محاضرة ${i+1}`)}
                </strong>

                <small>
                  ${esc(l.description||"اضغط للمشاهدة")}
                </small>

              </div>

            </div>

          `).join("")}

        </div>

      </div>

    `).join("")}`;

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}

function goHome(){

  $("#detailsView").hidden=true;
  $("#homeView").hidden=false;
  $("#stats").hidden=false;
  $(".content-section").hidden=false;

  window.scrollTo({
    top:0,
    behavior:"smooth"
  });
}


/* =========================
   مشغل المحاضرات
========================= */

let currentPlaylist = [];
let currentIndex = 0;
let currentHls = null;
let ytPlayer = null;
let ytReady = false;

let playbackSpeed =
  Number(
    localStorage.getItem("sads-speed") || 1
  );

const SPEEDS = [
  0.5,
  0.75,
  1,
  1.25,
  1.5,
  1.75,
  2
];


/* إنشاء قائمة المحاضرات */

function buildPlaylist(
  t,
  className,
  selectedIndex
){

  const c=(t.classes||[])
    .find(x=>x.name===className);

  currentPlaylist=
    (c?.lectures||[]).map((l,i)=>({

      teacher:t,

      className,

      index:i,

      lecture:l

    }));

  currentIndex=selectedIndex;

  $("#playlistTeacher").textContent=
    t.name;

  $("#playlistCount").textContent=
    `${currentPlaylist.length} محاضرة`;

  renderPlaylist();
}


/* عرض قائمة المحاضرات */

function renderPlaylist(){

  $("#playlist").innerHTML=
    currentPlaylist.map((x,i)=>`

      <button
        class="playlist-item
        ${i===currentIndex?'active':''}"
        onclick="selectPlaylist(${i})"
      >

        <span class="playlist-num">
          ${i+1}
        </span>

        <span class="playlist-play">
          ${i===currentIndex?'▶':'▷'}
        </span>

        <span class="playlist-text">

          <b>
            ${esc(
              x.lecture.title ||
              `محاضرة ${i+1}`
            )}
          </b>

          <small>
            ${esc(
              x.lecture.description || ""
            )}
          </small>

        </span>

      </button>

    `).join("");

  $("#playlistCount").textContent=
    `${currentPlaylist.length} محاضرة`;
}


/* سرعات التشغيل */

function renderSpeeds(){

  $("#speedList").innerHTML=
    SPEEDS.map(s=>`

      <button
        class="${s===playbackSpeed?'active':''}"
        onclick="setSpeed(${s})"
      >
        ${s}x
      </button>

    `).join("");
}


/* تغيير السرعة */

function setSpeed(speed){

  playbackSpeed=speed;

  localStorage.setItem(
    "sads-speed",
    speed
  );

  applySpeed();

  renderSpeeds();
}


/* تطبيق السرعة على المشغل */

function applySpeed(){

  const video=$("#hlsVideo");

  if(video){

    video.playbackRate=
      playbackSpeed;

  }

  if(
    ytPlayer &&
    typeof ytPlayer.setPlaybackRate==="function"
  ){

    try{

      ytPlayer.setPlaybackRate(
        playbackSpeed
      );

    }catch(e){}

  }
}


/* اختيار محاضرة من القائمة */

function selectPlaylist(i){

  if(
    i<0 ||
    i>=currentPlaylist.length
  )return;

  currentIndex=i;

  renderPlaylist();

  const x=currentPlaylist[i];

  loadPlayerSource(
    x.lecture
  );
}


/* تشغيل المحاضرة التالية */

function playNextLecture(){

  if(
    currentIndex <
    currentPlaylist.length-1
  ){

    selectPlaylist(
      currentIndex+1
    );

  }else{

    renderPlaylist();

  }
}


/* تحميل المحاضرة */

function loadPlayerSource(l){

  if(currentHls){

    try{
      currentHls.destroy();
    }catch(e){}

    currentHls=null;
  }

  ytPlayer=null;
  ytReady=false;

  const url=l.url||"";

  $("#playerLectureTitle").textContent=
    l.title||"المحاضرة";

  $("#playerLectureDesc").textContent=
    l.description||"";

  let html="";


  /* YouTube */

  if(
    /youtu\.be|youtube\.com/i
    .test(url)
  ){

    const id=
      (url.match(
        /(?:youtu\.be\/|v=|embed\/)([^?&/]+)/
      )||[])[1];

    html=id
      ? `<div id="ytPlayer"></div>`
      : `
        <iframe
          src="${esc(url)}"
          allow="
            autoplay;
            encrypted-media;
            picture-in-picture
          "
          allowfullscreen>
        </iframe>
      `;

  }


  /* M3U8 */

  else if(
    /\.m3u8/i.test(url)
  ){

    html=`
      <video
        id="hlsVideo"
        controls
        playsinline
        autoplay>
      </video>
    `;

  }


  /* فيديو عادي */

  else{

    html=`
      <video
        id="hlsVideo"
        controls
        playsinline
        autoplay
        src="${esc(url)}">
      </video>
    `;

  }


  $("#videoWrap").innerHTML=
    html;


  /* YouTube */

  if(
    /youtu\.be|youtube\.com/i.test(url)
    &&
    idFromUrl(url)
  ){

    createYouTubePlayer(
      idFromUrl(url)
    );

  }


  /* M3U8 والفيديو العادي */

  else{

    const video=
      $("#hlsVideo");

    if(video){

      video.playbackRate=
        playbackSpeed;


      /* الانتقال التلقائي */

      video.addEventListener(
        "ended",
        playNextLecture
      );


      /* منع تغيير السرعة بدون تحديث الزر */

      video.addEventListener(
        "ratechange",
        ()=>{

          if(
            video.playbackRate !==
            playbackSpeed
          ){

            video.playbackRate=
              playbackSpeed;

          }

        }
      );


      /* M3U8 */

      if(
        /\.m3u8/i.test(url)
      ){

        if(
          window.Hls &&
          Hls.isSupported()
        ){

          currentHls=
            new Hls();

          currentHls.loadSource(
            url
          );

          currentHls.attachMedia(
            video
          );

          currentHls.on(
            Hls.Events.MANIFEST_PARSED,
            ()=>{

              video.playbackRate=
                playbackSpeed;

              video.play()
                .catch(()=>{});

            }
          );

        }

        else if(
          video.canPlayType(
            "application/vnd.apple.mpegurl"
          )
        ){

          video.src=url;

        }

      }

    }

  }

}


/* استخراج ID اليوتيوب */

function idFromUrl(url){

  return (
    url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/))([^?&/]+)/
    )||[]
  )[1];

}


/* إنشاء مشغل YouTube */

function createYouTubePlayer(id){

  window.onYouTubeIframeAPIReady=
    function(){

      ytPlayer=
        new YT.Player(
          "ytPlayer",
          {

            videoId:id,

            playerVars:{
              autoplay:1,
              rel:0,
              playsinline:1,
              enablejsapi:1
            },

            events:{

              onReady:e=>{

                ytReady=true;

                e.target.setPlaybackRate(
                  playbackSpeed
                );

                e.target.playVideo();

              },

              onStateChange:e=>{

                if(
                  e.data ===
                  YT.PlayerState.ENDED
                ){

                  playNextLecture();

                }

              }

            }

          }
        );

    };


  if(
    window.YT &&
    window.YT.Player
  ){

    window.onYouTubeIframeAPIReady();

  }

  else{

    const old=
      document.getElementById(
        "yt-api"
      );

    if(!old){

      const s=
        document.createElement(
          "script"
        );

      s.id="yt-api";

      s.src=
        "https://www.youtube.com/iframe_api";

      document.head.appendChild(s);

    }

  }

}


/* تشغيل محاضرة */

function playLecture(
  tid,
  className,
  index
){

  const t=
    teachers.find(
      x=>String(x.id)===String(tid)
    );

  if(!t)return;

  buildPlaylist(
    t,
    className,
    index
  );

  renderSpeeds();

  $("#playerModal").hidden=false;

  document.body.style.overflow=
    "hidden";

  loadPlayerSource(
    currentPlaylist[index].lecture
  );

}


/* إغلاق المشغل */

function closePlayer(){

  $("#playerModal").hidden=true;

  $("#videoWrap").innerHTML="";

  document.body.style.overflow="";

}


/* حماية النص */

function esc(v){

  return String(v??"")
    .replace(
      /[&<>"']/g,
      m=>({
        "&":"&amp;",
        "<":"&lt;",
        ">":"&gt;",
        '"':"&quot;",
        "'":"&#039;"
      }[m])
    );

}


/* البحث */

$("#searchInput")
  .addEventListener(
    "input",
    renderTeachers
  );


/* الوضع الليلي */

$("#themeBtn")
  .addEventListener(
    "click",
    ()=>{

      const dark=
        document.documentElement
          .dataset.theme==="dark";

      document.documentElement
        .dataset.theme=
          dark ? "" : "dark";

      localStorage.setItem(
        "sads-theme",
        dark ? "light" : "dark"
      );

      $("#themeBtn").textContent=
        dark ? "☾" : "☀";

    }
  );


if(
  localStorage.getItem(
    "sads-theme"
  )==="dark"
){

  document.documentElement
    .dataset.theme="dark";

  $("#themeBtn").textContent="☀";

}


/* اختصارات الكيبورد */

document.addEventListener(
  "keydown",
  e=>{

    if(
      (e.ctrlKey||e.metaKey) &&
      e.key.toLowerCase()==="k"
    ){

      e.preventDefault();

      $("#searchInput").focus();

    }

    if(e.key==="Escape"){

      closePlayer();

    }

  }
);


/* تشغيل البيانات */

loadData()
.catch(err=>{

  console.error(err);

  $("#teachersGrid").innerHTML=`
    <div class="empty">

      <h3>
        تعذر تحميل البيانات
      </h3>

      <p>
        تأكد من وجود data.json
        بجانب ملفات الموقع.
      </p>

    </div>
  `;

});