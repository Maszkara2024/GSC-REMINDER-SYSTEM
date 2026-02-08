const LS_STUDENTS_KEY = 'studentsPerformance::demo';
let students = [];
const currentUser = JSON.parse(localStorage.getItem('currentUser::demo') || 'null');

function showToast(msg){
  const container = document.getElementById('toastContainer');
  if(!container) return;
  const el = document.createElement('div');
  el.className = 'max-w-xs px-4 py-3 rounded shadow-lg text-sm bg-white border';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(()=> el.remove(), 3000);
}

function saveStudents(){
  try{ localStorage.setItem(LS_STUDENTS_KEY, JSON.stringify(students)); }catch(e){ console.error(e); }
}

function loadStudents(){
  try{ students = JSON.parse(localStorage.getItem(LS_STUDENTS_KEY) || '[]'); }catch(e){ students = []; }
}

function renderStudents(){
  const list = document.getElementById('studentList');
  if(!list) return;
  list.innerHTML = '';
  if(students.length === 0){
    const empty = document.createElement('div');
    empty.className = 'text-slate-600 text-sm';
    empty.textContent = 'No students added yet.';
    list.appendChild(empty);
    return;
  }

  students.forEach((s, idx) => {
    const card = document.createElement('div');
    card.className = 'p-3 border rounded bg-white text-sm flex items-center justify-between gap-3';
    const info = document.createElement('div');
    const legacyActivity = Number(s.activity || 0);
    const legacyPerformance = Number(s.performance || 0);
    const category = s.category || (legacyActivity || legacyPerformance ? (legacyPerformance ? 'performance' : 'activity') : 'activity');
    const value = Number(s.value ?? (legacyActivity || legacyPerformance || 0));
    const score = Number(s.score ?? value);
    const over = Number(s.over ?? 100);
    const categoryLabel = category === 'performance' ? 'Performance Task' : 'Activity';
    info.innerHTML = `<div class="font-medium text-slate-900">${s.name}</div>
      <div class="text-xs text-slate-600">${categoryLabel}: ${score}/${over}</div>`;
    const actions = document.createElement('div');
    const del = document.createElement('button');
    del.className = 'px-3 py-1 bg-red-600 text-white rounded text-xs';
    del.textContent = 'Delete';
    del.onclick = () => { students.splice(idx, 1); saveStudents(); renderStudents(); showToast('Student removed'); };
    actions.appendChild(del);
    card.appendChild(info);
    card.appendChild(actions);
    list.appendChild(card);
  });
}

function init(){
  const display = document.getElementById('currentUserDisplay');
  const logoutBtn = document.getElementById('logoutBtn');
  if(display && currentUser){ display.textContent = `${currentUser.name} (${currentUser.role})`; }
  if(logoutBtn){ logoutBtn.addEventListener('click', ()=>{ localStorage.removeItem('currentUser::demo'); location.href = 'login.html'; }); }

  const teacherOnly = document.getElementById('teacherOnly');
  const noAccess = document.getElementById('noAccess');
  if(!currentUser || currentUser.role !== 'teacher'){
    if(teacherOnly) teacherOnly.classList.add('hidden');
    if(noAccess) noAccess.classList.remove('hidden');
  }

  loadStudents();
  renderStudents();

  const addBtn = document.getElementById('addStudentBtn');
  const nameInput = document.getElementById('studentName');
  const categorySelect = document.getElementById('categorySelect');
  const scoreValue = document.getElementById('scoreValue');
  const overValue = document.getElementById('overValue');

  if(addBtn){
    addBtn.addEventListener('click', ()=>{
      if(!currentUser || currentUser.role !== 'teacher'){ showToast('Teacher access only'); return; }
      const name = (nameInput.value || '').trim();
      const category = categorySelect ? categorySelect.value : 'activity';
      const score = Number(scoreValue.value);
      const over = Number(overValue.value);
      if(!name){ showToast('Please enter student name'); return; }
      if(Number.isNaN(score) || score < 0 || Number.isNaN(over) || over <= 0){
        showToast('Score must be 0 or greater and Over must be greater than 0');
        return;
      }
      if(score > over){
        showToast('Score cannot be greater than Over');
        return;
      }

      const existing = students.find(s => s.name.toLowerCase() === name.toLowerCase());
      if(existing){
        existing.category = category;
        existing.score = Math.round(score);
        existing.over = Math.round(over);
        showToast('Student updated');
      } else {
        students.push({ id: Date.now().toString(), name, category, score: Math.round(score), over: Math.round(over) });
        showToast('Student added');
      }
      saveStudents();
      renderStudents();
      nameInput.value = '';
      if(categorySelect) categorySelect.value = 'activity';
      scoreValue.value = '';
      overValue.value = '';
    });
  }
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
