// Security Protection
(function() {
    'use strict';
    
    // Disable right-click context menu
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    document.addEventListener('keydown', function(e) {
        // F12
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+I
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        // Ctrl+Shift+J
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        // Ctrl+U
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
        // Ctrl+S
        if (e.ctrlKey && e.keyCode === 83) {
            e.preventDefault();
            return false;
        }
        // Ctrl+A
        if (e.ctrlKey && e.keyCode === 65) {
            e.preventDefault();
            return false;
        }
        // Ctrl+P
        if (e.ctrlKey && e.keyCode === 80) {
            e.preventDefault();
            return false;
        }
    });
    
    // Disable text selection
    document.addEventListener('selectstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Disable drag
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // Override console methods
    const methods = ['log', 'debug', 'info', 'warn', 'error', 'assert', 'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 'count', 'trace', 'profile', 'profileEnd'];
    for (let i = 0; i < methods.length; i++) {
        console[methods[i]] = function() {};
    }
})();

// Application State
const AppState = {
    currentPage: 'home',
    currentTeacher: null,
    currentClass: null,
    currentLecture: null,
    currentSubject: null,
    progress: JSON.parse(localStorage.getItem('courseProgress') || '{}'),
    darkMode: localStorage.getItem('darkMode') === 'true',
    telegramModalShown: localStorage.getItem('telegramModalShown') === 'true'
};

// Proxy URL Configuration
const PROXY_URL = 'https://videoiq.duckdns.org';

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setupDarkMode();
    showTelegramModal();
    loadHomePage();
}

function setupEventListeners() {
    // Dark mode toggle
    document.getElementById('darkModeToggle').addEventListener('click', toggleDarkMode);
    
    // Back button
    document.getElementById('backBtn').addEventListener('click', goBack);
    
    // Telegram modal
    document.getElementById('confirmSubscription').addEventListener('click', closeTelegramModal);
    
    // Mark completed button
    document.getElementById('markCompleted').addEventListener('click', markLectureCompleted);
    
    // Material tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchMaterialTab(this.dataset.tab);
        });
    });
}

function setupDarkMode() {
    if (AppState.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    }
}

function toggleDarkMode() {
    AppState.darkMode = !AppState.darkMode;
    localStorage.setItem('darkMode', AppState.darkMode);
    
    if (AppState.darkMode) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.documentElement.removeAttribute('data-theme');
        document.getElementById('darkModeToggle').innerHTML = '<i class="fas fa-moon"></i>';
    }
}

// Navigation Functions
function navigateToPage(page) {
    showLoading();
    
    setTimeout(() => {
        hideLoading();
        
        switch(page) {
            case 'abwab2026':
                loadTeachersPage(window.dataAb2026, 'محاضرات أبواب 2026');
                break;
            case 'abwab2025':
                loadTeachersPage(window.dataAb2025, 'محاضرات أبواب 2025');
                break;
            case 'iraq2025':
                loadTeachersPage(window.dataIq2025, 'العراق أكاديمي 2025');
                break;
            case 'materials':
                loadMaterialsPage();
                break;
            case 'exams':
                loadExamsPage();
                break;
        }
        
        updateBackButton();
    }, 500);
}

function loadHomePage() {
    showPage('homePage');
    AppState.currentPage = 'home';
    renderHomeSubjects();
    renderHomeTeachers();
    updateBackButton();
}

// المواد الدراسية تُستخرج تلقائيًا من حقل subject لكل مدرس.
// لذلك عند إضافة مدرس جديد من لوحة التحكم وحفظ البيانات، تظهر مادته هنا تلقائيًا.
function normalizeSubjectName(subject = '') {
    const raw = String(subject).trim();
    const known = ['الفيزياء','الكيمياء','الرياضيات','الأحياء','العربية','اللغة العربية','الإنكليزي','اللغة الإنكليزية','الانكليزي','الإنجليزية','الأدب','الإسلامية','الاسلامية','الأحياء','الاقتصاد'];
    const found = known.find(name => raw.includes(name));
    if (found) {
        const aliases = {
            'اللغة العربية': 'العربية',
            'اللغة الإنكليزية': 'الإنكليزي',
            'الانكليزي': 'الإنكليزي',
            'الإنجليزية': 'الإنكليزي',
            'الاسلامية': 'الإسلامية'
        };
        return aliases[found] || found;
    }
    return raw
        .replace(/مدرس\s*(مادة)?/g, '')
        .replace(/مدرسة\s*(مادة)?/g, '')
        .replace(/استاذ\s*(مادة)?/g, '')
        .replace(/أستاذ\s*(مادة)?/g, '')
        .replace(/^مادة\s*/g, '')
        .trim() || 'مواد أخرى';
}

function subjectIcon(subject = '') {
    const icons = {
        'الفيزياء': 'fa-atom',
        'الكيمياء': 'fa-flask',
        'الرياضيات': 'fa-square-root-variable',
        'الأحياء': 'fa-dna',
        'العربية': 'fa-book-open',
        'الإنكليزي': 'fa-language',
        'الأدب': 'fa-feather-pointed',
        'الإسلامية': 'fa-mosque'
    };
    return icons[subject] || 'fa-book';
}

function renderHomeSubjects() {
    const box = document.getElementById('homeSubjects');
    if (!box) return;

    const teachers = (window.dataAb2026 && Array.isArray(window.dataAb2026.teachers)) ? window.dataAb2026.teachers : [];
    const subjects = [...new Set(teachers.map(t => normalizeSubjectName(t.subject)).filter(Boolean))];

    box.innerHTML = subjects.map(subject => `
        <button class="subject-pill" onclick='loadTeachersBySubject(${JSON.stringify(subject)})'>
            <i class="fas ${subjectIcon(subject)}"></i><b>${subject}</b>
        </button>
    `).join('') || '<div class="empty-state">أضف مدرسًا من لوحة التحكم لتظهر مادته هنا.</div>';
}

function loadTeachersBySubject(subject) {
    const allTeachers = (window.dataAb2026 && Array.isArray(window.dataAb2026.teachers)) ? window.dataAb2026.teachers : [];
    const filteredTeachers = allTeachers.filter(teacher => normalizeSubjectName(teacher.subject) === subject);
    loadTeachersPage({ teachers: filteredTeachers }, subject);
}

function renderHomeTeachers() {
    const box = document.getElementById('homeTeachers');
    if (!box) return;
    const teachers = (window.dataAb2026 && Array.isArray(window.dataAb2026.teachers)) ? window.dataAb2026.teachers : [];
    box.innerHTML = teachers.slice(0, 8).map(teacher => `
        <article class="home-teacher-card" onclick="loadTeacherPageById(${Number(teacher.id) || 0})">
            <img src="${teacher.image || ''}" alt="${teacher.name || ''}" onerror="this.src='https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg'">
            <h3>${teacher.name || 'مدرس'}</h3>
            <p>${teacher.subject || 'مدرس'}</p>
        </article>
    `).join('') || '<div class="empty-state">لا يوجد مدرسون مضافون حالياً.</div>';
}

function loadTeacherPageById(id) {
    const teachers = window.dataAb2026?.teachers || [];
    const teacher = teachers.find(t => Number(t.id) === Number(id));
    if (teacher) loadTeacherPage(teacher);
}

function filterHomeTeachers() {
    const input = document.getElementById('homeSearch');
    const q = (input?.value || '').trim().toLowerCase();
    const cards = document.querySelectorAll('#homeTeachers .home-teacher-card');
    cards.forEach(card => {
        card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
}

function setActiveNav(btn) {
    document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
    if (btn) btn.classList.add('active');
}

function loadTeachersPage(data, title) {
    if (!data || !data.teachers) {
        console.error('البيانات غير متوفرة');
        return;
    }
    
    document.getElementById('pageTitle').textContent = title;
    
    const teachersList = document.getElementById('teachersList');
    teachersList.innerHTML = '';
    
    data.teachers.forEach(teacher => {
        const teacherCard = createTeacherCard(teacher);
        teachersList.appendChild(teacherCard);
    });
    
    updateProgress(data);
    showPage('teachersPage');
    AppState.currentPage = 'teachers';
    AppState.currentData = data;
    updateBackButton();
}

function createTeacherCard(teacher) {
    const card = document.createElement('div');
    card.className = 'teacher-card';
    card.onclick = () => loadTeacherPage(teacher);
    
    card.innerHTML = `
        <img class="teacher-avatar" src="${teacher.image}" alt="${teacher.name}" onerror="this.src='https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg'">
        <h3>${teacher.name}</h3>
        <p>${teacher.subject}</p>
        <div class="teacher-stats">
            <span>${teacher.classes ? teacher.classes.length : 0} فصل</span>
        </div>
    `;
    
    return card;
}

function loadTeacherPage(teacher) {
    document.getElementById('teacherImage').src = teacher.image;
    document.getElementById('teacherName').textContent = teacher.name;
    document.getElementById('teacherSubject').textContent = teacher.subject;
    const totalLectures = (teacher.classes || []).reduce((n, c) => n + ((c.lectures || []).length), 0);
    const lc = document.getElementById('teacherLectureCount'); if (lc) lc.textContent = totalLectures;
    const cc = document.getElementById('teacherClassCount'); if (cc) cc.textContent = (teacher.classes || []).length;
    
    const classesList = document.getElementById('classesList');
    classesList.innerHTML = '';
    
    if (teacher.classes) {
        teacher.classes.forEach((classItem, index) => {
            const classElement = createClassElement(classItem, teacher.id, index);
            classesList.appendChild(classElement);
        });
    }
    
    showPage('teacherPage');
    AppState.currentPage = 'teacher';
    AppState.currentTeacher = teacher;
    updateBackButton();
}

function createClassElement(classItem, teacherId, classIndex) {
    const classElement = document.createElement('div');
    classElement.className = 'class-item';
    
    const completedLectures = classItem.lectures ? classItem.lectures.filter(lecture => 
        isLectureCompleted(teacherId, classIndex, lecture.title)
    ).length : 0;
    
    const totalLectures = classItem.lectures ? classItem.lectures.length : 0;
    const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
    
    classElement.innerHTML = `
        <div class="class-header" onclick="toggleClass(this)">
            <div>
                <div class="class-title">${classItem.name}</div>
                <div class="class-progress">${progressPercent}% مكتمل (${completedLectures}/${totalLectures})</div>
            </div>
            <i class="fas fa-chevron-down class-icon"></i>
        </div>
        <div class="lectures-list">
            ${classItem.lectures ? classItem.lectures.map((lecture, lectureIndex) => {
                const escapedUrl = lecture.url.replace(/'/g, "\\'");
                const escapedTitle = lecture.title.replace(/'/g, "\\'");
                const escapedDesc = (lecture.description || '').replace(/'/g, "\\'");
                return `
                    <div class="lecture-item">
                        <div class="lecture-checkbox" onclick="toggleLectureCompletion(event, ${teacherId}, ${classIndex}, '${escapedTitle}')">
                            <div class="checkbox ${isLectureCompleted(teacherId, classIndex, lecture.title) ? 'checked' : ''}">
                                ${isLectureCompleted(teacherId, classIndex, lecture.title) ? '<i class="fas fa-check"></i>' : ''}
                            </div>
                        </div>
                        <div class="lecture-content" onclick="playLecture('${escapedUrl}', '${escapedTitle}', '${escapedDesc}', ${teacherId}, ${classIndex}, ${lectureIndex})">
                            <div class="lecture-info">
                                <h4>${lecture.title}</h4>
                                <p>${lecture.description || ''}</p>
                            </div>
                            <div class="lecture-play">
                                <i class="fas fa-play"></i>
                            </div>
                        </div>
                    </div>
                `;
            }).join('') : '<p>لا توجد محاضرات متاحة</p>'}
        </div>
    `;
    
    return classElement;
}

function toggleClass(header) {
    const classItem = header.parentElement;
    classItem.classList.toggle('active');
}

function toggleLectureCompletion(event, teacherId, classIndex, lectureTitle) {
    event.stopPropagation();
    
    const key = `${teacherId}_${classIndex}_${lectureTitle}`;
    
    if (AppState.progress[key] && AppState.progress[key].completed) {
        delete AppState.progress[key];
    } else {
        AppState.progress[key] = {
            completed: true,
            completedAt: new Date().toISOString()
        };
    }
    
    localStorage.setItem('courseProgress', JSON.stringify(AppState.progress));
    
    const checkbox = event.target.closest('.lecture-checkbox').querySelector('.checkbox');
    if (AppState.progress[key] && AppState.progress[key].completed) {
        checkbox.classList.add('checked');
        checkbox.innerHTML = '<i class="fas fa-check"></i>';
        showNotification('تم تسجيل إكمال المحاضرة!', 'success');
    } else {
        checkbox.classList.remove('checked');
        checkbox.innerHTML = '';
        showNotification('تم إلغاء إكمال المحاضرة', 'info');
    }
    
    updateClassProgress(teacherId, classIndex);
}

function updateClassProgress(teacherId, classIndex) {
    if (AppState.currentTeacher) {
        loadTeacherPage(AppState.currentTeacher);
    }
}

// Extract Video ID from URL
function extractVideoId(url) {
    if (!url || typeof url !== 'string') return null;

    const patterns = [
        /\/embed\/\d+\/([a-f0-9-]{36})/i,
        /\/([a-f0-9-]{36})/i,
        /\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) return match[1];
    }

    const segments = url.split('/').filter(s => s.length > 0);
    const lastSegment = (segments[segments.length - 1] || '').split('?')[0];

    if (/^[a-f0-9-]{36}$/i.test(lastSegment)) return lastSegment;

    return null;
}

// Extract YouTube video ID
function getYouTubeId(url) {
    if (!url || typeof url !== 'string') return null;

    try {
        const u = new URL(url.trim());
        const host = u.hostname.replace(/^www\./i, '').toLowerCase();

        if (host === 'youtu.be') {
            return u.pathname.split('/').filter(Boolean)[0] || null;
        }

        if (host === 'youtube.com' || host.endsWith('.youtube.com')) {
            if (u.pathname === '/watch') return u.searchParams.get('v');

            const match = u.pathname.match(
                /^\/(?:embed|shorts|live)\/([^/?#]+)/
            );

            return match ? match[1] : null;
        }
    } catch (_) {
        return null;
    }

    return null;
}

// Detect the video type
function getVideoType(url) {
    if (!url || typeof url !== 'string') return 'unknown';

    const value = url.trim();
    const cleanUrl = value.split('#')[0].split('?')[0].toLowerCase();

    if (/\.m3u8$/i.test(cleanUrl)) return 'hls';
    if (/\.(mp4|m4v)$/i.test(cleanUrl)) return 'mp4';

    try {
        const u = new URL(value);
        const host = u.hostname.toLowerCase();
        const pathname = u.pathname.toLowerCase();

        if (host.endsWith('googlevideo.com') && pathname.includes('/videoplayback')) {
            return 'mp4';
        }
    } catch (_) {}

    if (getYouTubeId(value)) return 'youtube';
    if (extractVideoId(value)) return 'proxy';

    return 'unknown';
}

// Stop and fully reset both players (native + iframe)
function stopVideoPlayback() {
    const nativePlayer = document.getElementById('videoPlayerNative');
    const iframePlayer = document.getElementById('videoPlayer');

    if (window.currentHls) {
        window.currentHls.destroy();
        window.currentHls = null;
    }

    if (nativePlayer) {
        nativePlayer.pause();
        nativePlayer.removeAttribute('src');
        nativePlayer.load();
        nativePlayer.style.display = 'none';
        nativePlayer.onerror = null;
    }

    if (iframePlayer) {
        iframePlayer.src = '';
        iframePlayer.style.display = 'none';
    }
}

// Load a video source into the correct player based on its type
function setupVideoSource(url) {
    const nativePlayer = document.getElementById('videoPlayerNative');
    const iframePlayer = document.getElementById('videoPlayer');

    if (!url || !nativePlayer || !iframePlayer) {
        showNotification('رابط الفيديو أو مشغل الفيديو غير متوفر', 'error');
        return false;
    }

    stopVideoPlayback();

    const videoType = getVideoType(url);

    // YouTube
    if (videoType === 'youtube') {
        const videoId = getYouTubeId(url);

        if (!videoId) {
            showNotification('رابط YouTube غير صحيح', 'error');
            return false;
        }

        iframePlayer.style.display = 'block';
        iframePlayer.src =
            `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?rel=0&modestbranding=1&playsinline=1`;

        return true;
    }

    // HLS / M3U8
    if (videoType === 'hls') {
        nativePlayer.style.display = 'block';

        if (nativePlayer.canPlayType('application/vnd.apple.mpegurl')) {
            nativePlayer.src = url;
            return true;
        }

        if (window.Hls && Hls.isSupported()) {
            const hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(nativePlayer);

            hls.on(Hls.Events.ERROR, function(event, data) {
                if (data && data.fatal) {
                    showNotification('حدث خطأ أثناء تشغيل البث', 'error');
                }
            });

            window.currentHls = hls;
            return true;
        }

        showNotification(
            'المتصفح لا يدعم تشغيل هذا النوع من الفيديو (m3u8)',
            'error'
        );
        return false;
    }

    // Direct MP4 / M4V / Google video
    if (videoType === 'mp4') {
        nativePlayer.style.display = 'block';
        nativePlayer.src = url;
        nativePlayer.load();

        nativePlayer.onerror = function() {
            showNotification(
                'تعذر تشغيل الفيديو. قد يكون الرابط منتهي الصلاحية أو غير متاح.',
                'error'
            );
        };

        return true;
    }

    // Existing UUID proxy system
    if (videoType === 'proxy') {
        const videoId = extractVideoId(url);

        if (!videoId) {
            showNotification('خطأ في استخراج معرف الفيديو', 'error');
            return false;
        }

        iframePlayer.style.display = 'block';
        iframePlayer.src = `${PROXY_URL}/${encodeURIComponent(videoId)}`;
        return true;
    }

    showNotification(
        'هذا الرابط غير مدعوم. استخدم MP4 أو M3U8 أو رابط YouTube أو رابط UUID القديم.',
        'error'
    );
    return false;
}

// Play Lecture with Proxy
function playLecture(url, title, description, teacherId, classIndex, lectureIndex) {
    const loaded = setupVideoSource(url);

    if (!loaded) {
        return;
    }

    document.getElementById('videoTitle').textContent = title;
    document.getElementById('videoDescription').textContent = description || '';
    
    const markCompletedBtn = document.getElementById('markCompleted');
    const isCompleted = isLectureCompleted(teacherId, classIndex, title);
    
    if (isCompleted) {
        markCompletedBtn.innerHTML = '<i class="fas fa-check"></i> تم الإكمال';
        markCompletedBtn.disabled = true;
        markCompletedBtn.classList.add('completed');
    } else {
        markCompletedBtn.innerHTML = '<i class="fas fa-check"></i> تم إكمال المحاضرة';
        markCompletedBtn.disabled = false;
        markCompletedBtn.classList.remove('completed');
    }
    
    showPage('videoPage');
    AppState.currentPage = 'video';
    AppState.currentLecture = {
        url, title, description, teacherId, classIndex, lectureIndex
    };
}

function markLectureCompleted() {
    if (!AppState.currentLecture) return;
    
    const { teacherId, classIndex, title } = AppState.currentLecture;
    const key = `${teacherId}_${classIndex}_${title}`;
    
    if (!AppState.progress[key]) {
        AppState.progress[key] = {
            completed: true,
            completedAt: new Date().toISOString()
        };
        
        localStorage.setItem('courseProgress', JSON.stringify(AppState.progress));
        
        showNotification('تم تسجيل إكمال المحاضرة بنجاح!', 'success');
        
        const btn = document.getElementById('markCompleted');
        btn.innerHTML = '<i class="fas fa-check"></i> تم الإكمال';
        btn.disabled = true;
        btn.classList.add('completed');
    }
}

function isLectureCompleted(teacherId, classIndex, lectureTitle) {
    const key = `${teacherId}_${classIndex}_${lectureTitle}`;
    return AppState.progress[key] && AppState.progress[key].completed;
}

// Materials Page
function loadMaterialsPage() {
    if (!window.materialsData) {
        console.error('بيانات المواد غير متوفرة');
        return;
    }
    
    showPage('materialsPage');
    AppState.currentPage = 'materials';
    switchMaterialTab('summaries');
}

function switchMaterialTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    const content = document.getElementById('materialsContent');
    const data = window.materialsData[tabName] || [];
    
    content.innerHTML = '';
    
    data.forEach(item => {
        const card = createMaterialCard(item);
        content.appendChild(card);
    });
}

function createMaterialCard(item) {
    const card = document.createElement('div');
    card.className = 'material-card';
    
    card.innerHTML = `
        <img class="material-image" src="${item.image}" alt="${item.title}" onerror="this.src='https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg'">
        <div class="material-info">
            <h3>${item.title}</h3>
            <div class="material-subject">${item.subject}</div>
            <a href="${item.downloadUrl}" target="_blank" class="material-download">
                <i class="fas fa-download"></i>
                تحميل
            </a>
        </div>
    `;
    
    return card;
}

// Exams Page
function loadExamsPage() {
    if (!window.examsData) {
        console.error('بيانات الامتحانات غير متوفرة');
        return;
    }
    
    const examsList = document.getElementById('examsList');
    examsList.innerHTML = '';
    
    window.examsData.subjects.forEach(subject => {
        const subjectCard = createSubjectCard(subject);
        examsList.appendChild(subjectCard);
    });
    
    showPage('examsPage');
    AppState.currentPage = 'exams';
}

function createSubjectCard(subject) {
    const card = document.createElement('div');
    card.className = 'subject-card';
    card.onclick = () => loadSubjectExams(subject);
    
    const icons = {
        'الفيزياء': 'fa-atom',
        'الكيمياء': 'fa-flask',
        'الأحياء': 'fa-dna',
        'الرياضيات': 'fa-calculator'
    };
    
    const icon = icons[subject.name] || 'fa-book';
    
    card.innerHTML = `
        <div class="subject-icon">
            <i class="fas ${icon}"></i>
        </div>
        <h3>${subject.name}</h3>
        <p>${subject.chapters ? subject.chapters.length : 0} فصل</p>
    `;
    
    return card;
}

function loadSubjectExams(subject) {
    document.getElementById('subjectName').textContent = `امتحانات ${subject.name}`;
    
    const chaptersList = document.getElementById('chaptersExamsList');
    chaptersList.innerHTML = '';
    
    if (subject.chapters) {
        subject.chapters.forEach(chapter => {
            const chapterElement = createChapterElement(chapter);
            chaptersList.appendChild(chapterElement);
        });
    }
    
    showPage('subjectExamsPage');
    AppState.currentPage = 'subjectExams';
    AppState.currentSubject = subject;
}

function createChapterElement(chapter) {
    const chapterElement = document.createElement('div');
    chapterElement.className = 'chapter-item';
    
    chapterElement.innerHTML = `
        <div class="chapter-header" onclick="toggleChapter(this)">
            <div class="chapter-title">${chapter.name}</div>
            <i class="fas fa-chevron-down class-icon"></i>
        </div>
        <div class="exams-list">
            ${chapter.exams ? chapter.exams.map(exam => `
                <div class="exam-item">
                    <div class="exam-info">
                        <h4>${exam.title}</h4>
                        <p>${exam.description}</p>
                    </div>
                    <a href="${exam.downloadUrl}" target="_blank" class="exam-download">
                        <i class="fas fa-download"></i>
                        تحميل
                    </a>
                </div>
            `).join('') : '<p>لا توجد امتحانات متاحة</p>'}
        </div>
    `;
    
    return chapterElement;
}

function toggleChapter(header) {
    const chapterItem = header.parentElement;
    chapterItem.classList.toggle('active');
}

// Utility Functions
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

function goBack() {
    switch(AppState.currentPage) {
        case 'teachers':
            loadHomePage();
            break;
        case 'teacher':
            if (AppState.currentData) {
                loadTeachersPage(AppState.currentData, document.getElementById('pageTitle').textContent);
            } else {
                loadHomePage();
            }
            break;
        case 'video':
            stopVideoPlayback();
            if (AppState.currentTeacher) {
                loadTeacherPage(AppState.currentTeacher);
            } else {
                loadHomePage();
            }
            break;
        case 'materials':
        case 'exams':
            loadHomePage();
            break;
        case 'subjectExams':
            loadExamsPage();
            break;
        default:
            loadHomePage();
    }
}

function updateBackButton() {
    const backBtn = document.getElementById('backBtn');
    if (AppState.currentPage === 'home') {
        backBtn.style.display = 'none';
    } else {
        backBtn.style.display = 'inline-flex';
    }
}

function updateProgress(data) {
    if (!data || !data.teachers) return;
    
    let totalLectures = 0;
    let completedLectures = 0;
    
    data.teachers.forEach(teacher => {
        if (teacher.classes) {
            teacher.classes.forEach((classItem, classIndex) => {
                if (classItem.lectures) {
                    classItem.lectures.forEach(lecture => {
                        totalLectures++;
                        if (isLectureCompleted(teacher.id, classIndex, lecture.title)) {
                            completedLectures++;
                        }
                    });
                }
            });
        }
    });
    
    const progressPercent = totalLectures > 0 ? Math.round((completedLectures / totalLectures) * 100) : 0;
    
    document.getElementById('progressText').textContent = `${progressPercent}% مكتمل`;
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
}

function showLoading() {
    document.getElementById('loadingSpinner').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingSpinner').style.display = 'none';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
    `;
    
    if (!document.querySelector('.notification-styles')) {
        const styles = document.createElement('style');
        styles.className = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: var(--bg-primary);
                color: var(--text-primary);
                padding: 1rem 1.5rem;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow-lg);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                z-index: 1001;
                animation: slideInRight 0.3s ease;
            }
            .notification-success {
                border-left: 4px solid var(--success-color);
            }
            .notification-success i {
                color: var(--success-color);
            }
            .notification-info {
                border-left: 4px solid var(--primary-color);
            }
            .notification-info i {
                color: var(--primary-color);
            }
            .notification-error {
                border-left: 4px solid var(--error-color);
            }
            .notification-error i {
                color: var(--error-color);
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Telegram Modal Functions
function showTelegramModal() {
    if (!AppState.telegramModalShown) {
        document.getElementById('telegramModal').style.display = 'flex';
    }
}

function closeTelegramModal() {
    document.getElementById('telegramModal').style.display = 'none';
    AppState.telegramModalShown = true;
    localStorage.setItem('telegramModalShown', 'true');
}

// Performance optimizations
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

let ticking = false;
function updateScrollPosition() {
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateScrollPosition);
        ticking = true;
    }
});

// Service Worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}