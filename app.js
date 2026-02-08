async function queryAI(prompt){
  const res = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  const data = await res.json();
  return Array.isArray(data) && data[0]?.generated_text ? data[0].generated_text : JSON.stringify(data);
}

// Clean assignments + Golda chat implementation
// Tracks per-student submission status



const LS_KEY = 'assignments::demo';
const LS_EVENTS_KEY = 'classroomEvents::demo';
const LS_ACTIVITIES_KEY = 'classroomActivities::demo';
const LS_PERFORMANCE_KEY = 'classroomPerformance::demo';
const LS_STUDENTS_PERF_KEY = 'studentsPerformance::demo';
const LS_REMINDER_KEY = 'teacherReminder::demo';
let assignments = [];
let classroomEvents = [];
let classroomActivities = [];
let performanceTasks = [];
let studentPerformances = [];
let currentUser = JSON.parse(localStorage.getItem('currentUser::demo') || 'null');

function showToast(msg){
  const container = document.getElementById('toastContainer');
  if(!container) return;
  const el = document.createElement('div');
  el.className = 'max-w-xs px-4 py-3 rounded shadow-lg text-sm bg-white border';
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(()=> el.remove(), 3000);
}

function saveAssignments(){
  try{ localStorage.setItem(LS_KEY, JSON.stringify(assignments)); }catch(e){ console.error(e); }
}

function loadAssignments(){
  try{ assignments = JSON.parse(localStorage.getItem(LS_KEY) || '[]'); }catch(e){ assignments = []; }
}

function saveEvents(){
  try{ localStorage.setItem(LS_EVENTS_KEY, JSON.stringify(classroomEvents)); }catch(e){ console.error(e); }
}

function loadEvents(){
  try{ classroomEvents = JSON.parse(localStorage.getItem(LS_EVENTS_KEY) || '[]'); }catch(e){ classroomEvents = []; }
}

function saveActivities(){
  try{ localStorage.setItem(LS_ACTIVITIES_KEY, JSON.stringify(classroomActivities)); }catch(e){ console.error(e); }
}

function loadActivities(){
  try{ classroomActivities = JSON.parse(localStorage.getItem(LS_ACTIVITIES_KEY) || '[]'); }catch(e){ classroomActivities = []; }
}

function savePerformance(){
  try{ localStorage.setItem(LS_PERFORMANCE_KEY, JSON.stringify(performanceTasks)); }catch(e){ console.error(e); }
}

function loadPerformance(){
  try{ performanceTasks = JSON.parse(localStorage.getItem(LS_PERFORMANCE_KEY) || '[]'); }catch(e){ performanceTasks = []; }
}

function loadStudentPerformances(){
  try{ studentPerformances = JSON.parse(localStorage.getItem(LS_STUDENTS_PERF_KEY) || '[]'); }catch(e){ studentPerformances = []; }
}

function seedDemoSchedule(){
  const demoDisabled = localStorage.getItem('demoScheduleDisabled::demo') === '1';
  if(demoDisabled) return;
  const demoSeeded = localStorage.getItem('demoScheduleSeeded::demo') === '1';
  if(demoSeeded) return;

  if(classroomEvents.length || classroomActivities.length || performanceTasks.length){
    localStorage.setItem('demoScheduleSeeded::demo', '1');
    return;
  }

  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const addDays = (d) => {
    const dt = new Date();
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().slice(0, 10);
  };

  if(classroomEvents.length === 0){
    const eventTitles = [
      'Science Fair Orientation',
      'Math Quiz Bee',
      'Club Recruitment Day',
      'Parents-Teachers Meeting',
      'Library Reading Hour'
    ];
    classroomEvents = [
      { id: `evt-${Date.now()}-1`, title: pick(eventTitles), date: addDays(Math.floor(Math.random() * 5) + 2) },
      { id: `evt-${Date.now()}-2`, title: pick(eventTitles), date: addDays(Math.floor(Math.random() * 8) + 7) }
    ];
    saveEvents();
  }

  if(classroomActivities.length === 0){
    const activityTitles = [
      'Worksheet: Fraction Practice',
      'Group Discussion: Ecosystems',
      'Reading: Chapter 3 Summary',
      'Lab Notes Check',
      'Vocabulary Drill'
    ];
    classroomActivities = [
      { id: `act-${Date.now()}-1`, title: pick(activityTitles), date: addDays(Math.floor(Math.random() * 4) + 1) },
      { id: `act-${Date.now()}-2`, title: pick(activityTitles), date: addDays(Math.floor(Math.random() * 6) + 5) }
    ];
    saveActivities();
  }

  if(performanceTasks.length === 0){
    const performanceTitles = [
      'Oral Recitation: Chapter 2',
      'Experiment Demo Presentation',
      'Poetry Reading',
      'Poster Design Output',
      'Role Play Assessment'
    ];
    performanceTasks = [
      { id: `perf-${Date.now()}-1`, title: pick(performanceTitles), date: addDays(Math.floor(Math.random() * 5) + 3) },
      { id: `perf-${Date.now()}-2`, title: pick(performanceTitles), date: addDays(Math.floor(Math.random() * 9) + 9) }
    ];
    savePerformance();
  }

  localStorage.setItem('demoScheduleSeeded::demo', '1');
}

function formatEventDate(dateStr){
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderEvents(){
  const list = document.getElementById('eventsList');
  const teacherPanel = document.getElementById('teacherEventPanel');
  const eventTeacherOnly = document.getElementById('eventTeacherOnly');
  if(!list) return;
  const roleSelect = document.getElementById('roleSelect');
  const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');

  if(teacherPanel) teacherPanel.classList.toggle('hidden', role !== 'teacher');
  if(eventTeacherOnly) eventTeacherOnly.classList.toggle('hidden', role !== 'teacher');

  list.innerHTML = '';
  if(classroomEvents.length === 0){
    const empty = document.createElement('div');
    empty.className = 'text-slate-600 text-sm';
    empty.textContent = 'No events scheduled.';
    list.appendChild(empty);
    return;
  }

  classroomEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  classroomEvents.forEach((evt, idx) => {
    const card = document.createElement('div');
    card.className = 'p-3 border rounded bg-amber-50 border-amber-200 text-sm';
    const title = document.createElement('div');
    title.className = 'font-medium text-slate-900';
    title.textContent = evt.title;
    const date = document.createElement('div');
    date.className = 'text-xs text-slate-600 mt-1';
    date.textContent = '📅 ' + formatEventDate(evt.date);
    card.appendChild(title);
    card.appendChild(date);

    if(role === 'teacher'){
      const actions = document.createElement('div');
      actions.className = 'mt-2 flex justify-end gap-2';
      const del = document.createElement('button');
      del.className = 'px-2 py-0.5 bg-red-600 text-white rounded text-xs';
      del.textContent = '✕';
      del.onclick = () => { classroomEvents.splice(idx, 1); saveEvents(); renderEvents(); showToast('Event deleted'); };
      actions.appendChild(del);
      card.appendChild(actions);
    }

    list.appendChild(card);
  });
}

function renderActivities(){
  const list = document.getElementById('activityList');
  const teacherPanel = document.getElementById('activityTeacherPanel');
  const teacherBadge = document.getElementById('activityTeacherOnly');
  const remindWrap = document.getElementById('activityRemindWrap');
  if(!list) return;
  const roleSelect = document.getElementById('roleSelect');
  const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');
  if(teacherPanel) teacherPanel.classList.toggle('hidden', role !== 'teacher');
  if(teacherBadge) teacherBadge.classList.toggle('hidden', role !== 'teacher');
  if(remindWrap) remindWrap.classList.toggle('hidden', role !== 'teacher');

  list.innerHTML = '';
  if(classroomActivities.length === 0){
    const empty = document.createElement('div');
    empty.className = 'text-slate-600 text-sm';
    empty.textContent = 'No activities yet.';
    list.appendChild(empty);
    return;
  }

  classroomActivities.sort((a, b) => new Date(a.date) - new Date(b.date));
  classroomActivities.forEach((act, idx) => {
    const card = document.createElement('div');
    card.className = 'p-3 border rounded bg-white text-sm';
    const title = document.createElement('div');
    title.className = 'font-medium text-slate-900';
    title.textContent = act.title;
    const date = document.createElement('div');
    date.className = 'text-xs text-slate-600 mt-1';
    date.textContent = '📅 ' + formatEventDate(act.date);
    card.appendChild(title);
    card.appendChild(date);

    if(role === 'student'){
      const studentId = currentUser ? currentUser.id : 'guest';
      if(!act.submissions) act.submissions = [];
      const submission = act.submissions.find(s => s.studentId === studentId);
      const actions = document.createElement('div');
      actions.className = 'mt-3 flex items-center gap-2';
      if(submission && submission.completed){
        const status = document.createElement('span');
        status.className = 'text-xs text-green-700 bg-green-100 px-2 py-1 rounded';
        status.textContent = 'Passed ✅ (approved)';
        actions.appendChild(status);
      } else if(submission && submission.submitted){
        const status = document.createElement('span');
        status.className = 'text-xs text-slate-600';
        status.textContent = '⏳ Awaiting teacher approval';
        actions.appendChild(status);
      } else {
        const passBtn = document.createElement('button');
        passBtn.className = 'px-3 py-1 bg-blue-600 text-white rounded text-xs';
        passBtn.textContent = 'DONE';
        passBtn.onclick = () => {
          if(!act.submissions) act.submissions = [];
          let sub = act.submissions.find(s => s.studentId === studentId);
          if(!sub){
            sub = { studentId, studentName: currentUser ? currentUser.name : 'Student', submitted: false, completed: false };
            act.submissions.push(sub);
          }
          sub.submitted = true;
          sub.completed = false;
          saveActivities();
          renderActivities();
          showToast('Submitted for approval');
        };
        actions.appendChild(passBtn);
      }
      card.appendChild(actions);
    }

    if(role === 'teacher'){
      const actions = document.createElement('div');
      actions.className = 'mt-3 flex justify-between items-center gap-2';

      const submissions = act.submissions || [];
      if(submissions.length === 0){
        const empty = document.createElement('span');
        empty.className = 'text-xs text-slate-500';
        empty.textContent = 'No submissions yet.';
        actions.appendChild(empty);
      } else {
        const listWrap = document.createElement('div');
        listWrap.className = 'mt-2 space-y-2 w-full';
        submissions.forEach((sub) => {
          const row = document.createElement('div');
          row.className = 'flex items-center justify-between text-xs bg-slate-50 border rounded px-2 py-1';
          const name = document.createElement('span');
          name.textContent = sub.studentName || 'Student';
          row.appendChild(name);
          const rowActions = document.createElement('div');
          rowActions.className = 'flex items-center gap-2';
          if(sub.completed){
            const status = document.createElement('span');
            status.className = 'text-green-700';
            status.textContent = 'Passed';
            rowActions.appendChild(status);
            const remove = document.createElement('button');
            remove.className = 'px-2 py-0.5 bg-gray-600 text-white rounded';
            remove.textContent = 'Remove';
            remove.onclick = () => {
              act.submissions = act.submissions.filter(s => s.studentId !== sub.studentId);
              saveActivities();
              renderActivities();
              showToast('Removed');
            };
            rowActions.appendChild(remove);
          } else if(sub.submitted){
            const approve = document.createElement('button');
            approve.className = 'px-2 py-0.5 bg-green-600 text-white rounded';
            approve.textContent = 'Approve';
            approve.onclick = () => {
              sub.submitted = false;
              sub.completed = true;
              saveActivities();
              renderActivities();
              showToast('Approved');
            };
            const reject = document.createElement('button');
            reject.className = 'px-2 py-0.5 bg-red-600 text-white rounded';
            reject.textContent = 'Reject';
            reject.onclick = () => {
              sub.submitted = false;
              saveActivities();
              renderActivities();
              showToast('Rejected');
            };
            rowActions.appendChild(approve);
            rowActions.appendChild(reject);
          }
          row.appendChild(rowActions);
          listWrap.appendChild(row);
        });
        card.appendChild(listWrap);
      }

      const del = document.createElement('button');
      del.className = 'px-2 py-0.5 bg-red-600 text-white rounded text-xs';
      del.textContent = '✕';
      del.onclick = () => { classroomActivities.splice(idx, 1); saveActivities(); renderActivities(); showToast('Activity deleted'); };
      actions.appendChild(del);
      card.appendChild(actions);
    }

    list.appendChild(card);
  });
}

function renderPerformance(){
  const list = document.getElementById('performanceList');
  const teacherPanel = document.getElementById('performanceTeacherPanel');
  const teacherBadge = document.getElementById('performanceTeacherOnly');
  const remindWrap = document.getElementById('performanceRemindWrap');
  if(!list) return;
  const roleSelect = document.getElementById('roleSelect');
  const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');
  if(teacherPanel) teacherPanel.classList.toggle('hidden', role !== 'teacher');
  if(teacherBadge) teacherBadge.classList.toggle('hidden', role !== 'teacher');
  if(remindWrap) remindWrap.classList.toggle('hidden', role !== 'teacher');

  list.innerHTML = '';
  if(performanceTasks.length === 0){
    const empty = document.createElement('div');
    empty.className = 'text-slate-600 text-sm';
    empty.textContent = 'No performance tasks yet.';
    list.appendChild(empty);
    return;
  }

  performanceTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
  performanceTasks.forEach((task, idx) => {
    const card = document.createElement('div');
    card.className = 'p-3 border rounded bg-white text-sm';
    const title = document.createElement('div');
    title.className = 'font-medium text-slate-900';
    title.textContent = task.title;
    const date = document.createElement('div');
    date.className = 'text-xs text-slate-600 mt-1';
    date.textContent = '📅 ' + formatEventDate(task.date);
    card.appendChild(title);
    card.appendChild(date);

    if(role === 'student'){
      const studentId = currentUser ? currentUser.id : 'guest';
      if(!task.submissions) task.submissions = [];
      const submission = task.submissions.find(s => s.studentId === studentId);
      const actions = document.createElement('div');
      actions.className = 'mt-3 flex items-center gap-2';
      if(submission && submission.completed){
        const status = document.createElement('span');
        status.className = 'text-xs text-green-700 bg-green-100 px-2 py-1 rounded';
        status.textContent = 'Passed ✅ (approved)';
        actions.appendChild(status);
      } else if(submission && submission.submitted){
        const status = document.createElement('span');
        status.className = 'text-xs text-slate-600';
        status.textContent = '⏳ Awaiting teacher approval';
        actions.appendChild(status);
      } else {
        const passBtn = document.createElement('button');
        passBtn.className = 'px-3 py-1 bg-purple-600 text-white rounded text-xs';
        passBtn.textContent = 'DONE';
        passBtn.onclick = () => {
          if(!task.submissions) task.submissions = [];
          let sub = task.submissions.find(s => s.studentId === studentId);
          if(!sub){
            sub = { studentId, studentName: currentUser ? currentUser.name : 'Student', submitted: false, completed: false };
            task.submissions.push(sub);
          }
          sub.submitted = true;
          sub.completed = false;
          savePerformance();
          renderPerformance();
          showToast('Submitted for approval');
        };
        actions.appendChild(passBtn);
      }
      card.appendChild(actions);
    }

    if(role === 'teacher'){
      const actions = document.createElement('div');
      actions.className = 'mt-3 flex justify-between items-center gap-2';

      const submissions = task.submissions || [];
      if(submissions.length === 0){
        const empty = document.createElement('span');
        empty.className = 'text-xs text-slate-500';
        empty.textContent = 'No submissions yet.';
        actions.appendChild(empty);
      } else {
        const listWrap = document.createElement('div');
        listWrap.className = 'mt-2 space-y-2 w-full';
        submissions.forEach((sub) => {
          const row = document.createElement('div');
          row.className = 'flex items-center justify-between text-xs bg-slate-50 border rounded px-2 py-1';
          const name = document.createElement('span');
          name.textContent = sub.studentName || 'Student';
          row.appendChild(name);
          const rowActions = document.createElement('div');
          rowActions.className = 'flex items-center gap-2';
          if(sub.completed){
            const status = document.createElement('span');
            status.className = 'text-green-700';
            status.textContent = 'Passed';
            rowActions.appendChild(status);
            const remove = document.createElement('button');
            remove.className = 'px-2 py-0.5 bg-gray-600 text-white rounded';
            remove.textContent = 'Remove';
            remove.onclick = () => {
              task.submissions = task.submissions.filter(s => s.studentId !== sub.studentId);
              savePerformance();
              renderPerformance();
              showToast('Removed');
            };
            rowActions.appendChild(remove);
          } else if(sub.submitted){
            const approve = document.createElement('button');
            approve.className = 'px-2 py-0.5 bg-green-600 text-white rounded';
            approve.textContent = 'Approve';
            approve.onclick = () => {
              sub.submitted = false;
              sub.completed = true;
              savePerformance();
              renderPerformance();
              showToast('Approved');
            };
            const reject = document.createElement('button');
            reject.className = 'px-2 py-0.5 bg-red-600 text-white rounded';
            reject.textContent = 'Reject';
            reject.onclick = () => {
              sub.submitted = false;
              savePerformance();
              renderPerformance();
              showToast('Rejected');
            };
            rowActions.appendChild(approve);
            rowActions.appendChild(reject);
          }
          row.appendChild(rowActions);
          listWrap.appendChild(row);
        });
        card.appendChild(listWrap);
      }

      const del = document.createElement('button');
      del.className = 'px-2 py-0.5 bg-red-600 text-white rounded text-xs';
      del.textContent = '✕';
      del.onclick = () => { performanceTasks.splice(idx, 1); savePerformance(); renderPerformance(); showToast('Task deleted'); };
      actions.appendChild(del);
      card.appendChild(actions);
    }

    list.appendChild(card);
  });
}

function formatDue(ts){ return ts ? new Date(ts).toLocaleString() : '—'; }

function getDueDateHighlight(ts){
  if(!ts) return '';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = new Date(ts); due.setHours(0, 0, 0, 0);
  const msPerDay = 86400000;
  const daysUntil = Math.ceil((due - today) / msPerDay);
  if(daysUntil === 1) return 'due-tomorrow';
  if(daysUntil === 3) return 'due-three-days';
  if(daysUntil > 3) return 'due-later';
  return '';
}

function getStudentSubmission(a, studentId){
  if(!a.submissions) a.submissions = [];
  return a.submissions.find(s => s.studentId === studentId);
}

function getAllStudentNames(){
  const names = [];

  // From registered users
  try{
    const users = JSON.parse(localStorage.getItem('users::demo') || '[]');
    users.filter(u => u.role === 'student').forEach(u => { if(u.name) names.push(u.name); });
  }catch(e){}

  // From student performance records
  loadStudentPerformances();
  studentPerformances.forEach(s => { if(s.name) names.push(s.name); });

  // From activity submissions
  classroomActivities.forEach(item => {
    (item.submissions || []).forEach(sub => { if(sub.studentName) names.push(sub.studentName); });
  });

  // From performance submissions
  performanceTasks.forEach(item => {
    (item.submissions || []).forEach(sub => { if(sub.studentName) names.push(sub.studentName); });
  });

  return [...new Set(names)];
}

function saveReminder(message){
  try{
    const existing = JSON.parse(localStorage.getItem(LS_REMINDER_KEY) || '[]');
    const list = Array.isArray(existing) ? existing : [];
    list.unshift({ message, at: Date.now() });
    localStorage.setItem(LS_REMINDER_KEY, JSON.stringify(list));
  }catch(e){ console.error(e); }
}

function loadReminder(){
  try{ return JSON.parse(localStorage.getItem(LS_REMINDER_KEY) || '[]'); }catch(e){ return []; }
}

function renderStudentReminder(){
  const wrap = document.getElementById('studentReminder');
  const text = document.getElementById('studentReminderText');
  const time = document.getElementById('studentReminderTime');
  if(!wrap || !text || !time) return;
  const roleSelect = document.getElementById('roleSelect');
  const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');
  if(role !== 'student'){ wrap.classList.add('hidden'); return; }
  const reminders = loadReminder();
  if(!Array.isArray(reminders) || reminders.length === 0){ wrap.classList.add('hidden'); return; }
  const lines = reminders.map(r => r.message).filter(Boolean);
  text.innerHTML = lines.map(l => `• ${l}`).join('<br>');
  const latest = reminders[0];
  const ts = latest && latest.at ? new Date(latest.at) : new Date();
  time.textContent = `Last sent: ${ts.toLocaleString()}`;
  wrap.classList.remove('hidden');
}

function getLatestTitle(items, fallback){
  if(!items || items.length === 0) return fallback;
  let latest = items[0];
  items.forEach(item => {
    if(!item.date) return;
    if(!latest.date || new Date(item.date) > new Date(latest.date)) latest = item;
  });
  return latest.title || fallback;
}

function renderAssignments(){
  const list = document.getElementById('assignmentsList');
  if(!list) return;
  list.innerHTML = '';
  if(assignments.length === 0){
    const empty = document.createElement('div');
    empty.className = 'text-slate-600';
    empty.textContent = 'No assignments yet.';
    list.appendChild(empty);
    return;
  }
  const roleSelect = document.getElementById('roleSelect');
  const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');

  assignments.forEach(a => {
    const highlight = getDueDateHighlight(a.due);
    
    if(role === 'student'){
      const card = document.createElement('div');
      card.className = `p-3 border rounded bg-white ${highlight}`;
      const studentId = currentUser ? currentUser.id : 'guest';
      const submission = getStudentSubmission(a, studentId);
      const isCompleted = submission && submission.completed;
      const isSubmitted = submission && submission.submitted;
      
      const title = document.createElement('div'); 
      let titleText = a.title;
      if(isCompleted) titleText += ' ✅';
      if(isSubmitted && !isCompleted) titleText += ' ⏳ (awaiting approval)';
      title.className = 'font-medium'; 
      title.textContent = titleText;
      
      const meta = document.createElement('div'); meta.className = 'text-xs text-slate-600'; 
      meta.textContent = `Due: ${formatDue(a.due)} • Posted by ${a.author || 'Teacher'}`;
      
      const desc = document.createElement('div'); desc.className = 'text-sm text-slate-700 mt-2'; desc.textContent = a.description || '';
      const actions = document.createElement('div'); actions.className = 'mt-3 flex gap-2';
      
      if(!isSubmitted && !isCompleted){
        const mark = document.createElement('button');
        mark.className = 'px-3 py-1 bg-green-600 text-white rounded text-sm';
        mark.textContent = 'Submit';
        mark.onclick = () => {
          if(!a.submissions) a.submissions = [];
          let sub = a.submissions.find(s => s.studentId === studentId);
          if(!sub) { sub = { studentId, studentName: currentUser ? currentUser.name : 'Student', submitted: false, completed: false }; a.submissions.push(sub); }
          sub.submitted = true;
          saveAssignments(); renderAssignments(); showToast('Submitted for approval');
        };
        actions.appendChild(mark);
      }
      if(isSubmitted && !isCompleted){
        const status = document.createElement('span');
        status.className = 'px-3 py-1 text-sm text-slate-600';
        status.textContent = '⏳ Waiting for teacher approval...';
        actions.appendChild(status);
      }
      
      card.appendChild(title); card.appendChild(meta); card.appendChild(desc); card.appendChild(actions);
      list.appendChild(card);
    }
    
    if(role === 'teacher'){
      if(!a.submissions || a.submissions.length === 0){
        const card = document.createElement('div');
        card.className = `p-3 border rounded bg-white ${highlight}`;
        const title = document.createElement('div'); title.className = 'font-medium'; title.textContent = a.title;
        const meta = document.createElement('div'); meta.className = 'text-xs text-slate-600'; meta.textContent = `Due: ${formatDue(a.due)} • Posted by ${a.author || 'Teacher'} • No submissions yet`;
        const desc = document.createElement('div'); desc.className = 'text-sm text-slate-700 mt-2'; desc.textContent = a.description || '';
        const actions = document.createElement('div'); actions.className = 'mt-3 flex gap-2';
        const del = document.createElement('button');
        del.className = 'px-3 py-1 bg-gray-600 text-white rounded text-sm';
        del.textContent = 'Delete';
        del.onclick = () => { assignments = assignments.filter(x => x.id !== a.id); saveAssignments(); renderAssignments(); showToast('Deleted'); };
        actions.appendChild(del);
        card.appendChild(title); card.appendChild(meta); card.appendChild(desc); card.appendChild(actions);
        list.appendChild(card);
      } else {
        a.submissions.forEach(sub => {
          if(sub.completed){
            // Minimized view for approved submissions
            const miniCard = document.createElement('div');
            miniCard.className = 'p-2 border rounded bg-green-50 text-xs flex items-center justify-between';
            const miniText = document.createElement('span');
            miniText.className = 'text-slate-700';
            miniText.textContent = `✅ ${a.title} — ${sub.studentName}`;
            miniCard.appendChild(miniText);
            const del = document.createElement('button');
            del.className = 'px-2 py-0.5 bg-gray-600 text-white rounded text-xs';
            del.textContent = 'Remove';
            del.onclick = () => { a.submissions = a.submissions.filter(x => x.studentId !== sub.studentId); if(a.submissions.length === 0) a.submissions = []; saveAssignments(); renderAssignments(); showToast('Removed'); };
            miniCard.appendChild(del);
            list.appendChild(miniCard);
          } else {
            // Full view for pending submissions
            const card = document.createElement('div');
            card.className = `p-3 border rounded bg-white ${highlight}`;
            const title = document.createElement('div'); 
            let titleText = a.title;
            if(sub.submitted && !sub.completed) titleText += ' ⏳ (awaiting approval)';
            title.className = 'font-medium'; 
            title.textContent = titleText;
            
            const meta = document.createElement('div'); meta.className = 'text-xs text-slate-600'; 
            let metaText = `Due: ${formatDue(a.due)} • Posted by ${a.author || 'Teacher'} • Student: ${sub.studentName}`;
            meta.textContent = metaText;
            
            const desc = document.createElement('div'); desc.className = 'text-sm text-slate-700 mt-2'; desc.textContent = a.description || '';
            const actions = document.createElement('div'); actions.className = 'mt-3 flex gap-2';
            
            if(sub.submitted && !sub.completed){
              const approve = document.createElement('button');
              approve.className = 'px-3 py-1 bg-blue-600 text-white rounded text-sm';
              approve.textContent = 'Approve';
              approve.onclick = () => { sub.submitted = false; sub.completed = true; saveAssignments(); renderAssignments(); showToast('Approved'); };
              actions.appendChild(approve);
              const reject = document.createElement('button');
              reject.className = 'px-3 py-1 bg-red-600 text-white rounded text-sm';
              reject.textContent = 'Reject';
              reject.onclick = () => { sub.submitted = false; saveAssignments(); renderAssignments(); showToast('Rejected'); };
              actions.appendChild(reject);
            }
            
            const del = document.createElement('button');
            del.className = 'px-3 py-1 bg-gray-600 text-white rounded text-sm';
            del.textContent = 'Remove';
            del.onclick = () => { a.submissions = a.submissions.filter(x => x.studentId !== sub.studentId); if(a.submissions.length === 0) a.submissions = []; saveAssignments(); renderAssignments(); showToast('Removed'); };
            actions.appendChild(del);
            
            card.appendChild(title); card.appendChild(meta); card.appendChild(desc); card.appendChild(actions);
            list.appendChild(card);
          }
        });
        
        const card = document.createElement('div');
        card.className = 'p-3 border rounded bg-white mt-2';
        const del = document.createElement('button');
        del.className = 'px-3 py-1 bg-gray-600 text-white rounded text-sm';
        del.textContent = 'Delete Assignment';
        del.onclick = () => { assignments = assignments.filter(x => x.id !== a.id); saveAssignments(); renderAssignments(); showToast('Deleted'); };
        card.appendChild(del);
        list.appendChild(card);
      }
    }
  });
}


function handlePostNow(){
  const roleSelect = document.getElementById('roleSelect');
  const postTitle = document.getElementById('postTitle');
  const postDesc = document.getElementById('postDesc');
  const postDue = document.getElementById('postDue');
  const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');
  if(role !== 'teacher'){ showToast('Only teachers can post assignments'); return; }
  if(!postTitle || !postTitle.value.trim()){ showToast('Please add a title'); return; }
  const obj = {
    id: Date.now().toString(),
    title: postTitle.value.trim(),
    description: postDesc ? postDesc.value.trim() : '',
    due: postDue && postDue.value ? new Date(postDue.value).getTime() : null,
    author: currentUser ? currentUser.name : 'Teacher',
    createdAt: Date.now(),
    submissions: []
  };
  assignments.unshift(obj);
  saveAssignments();
  postTitle.value = ''; if(postDesc) postDesc.value = ''; if(postDue) postDue.value = '';
  renderAssignments();
  showToast('Assignment posted');
}

function init(){
  // Seed demo accounts if missing
  try{
    const users = JSON.parse(localStorage.getItem('users::demo') || '[]');
    const ensureUser = (name, role, email) => {
      if(!users.find(u => u.email === email)){
        users.push({ id: `${role}-${name}`, name, email, password: '123', role });
      }
    };
    ['student1','student2','student3','student4','student5'].forEach(n => ensureUser(n, 'student', `${n}@gmail.com`));
    ['teacher1','teacher2','teacher3','teacher4','teacher5'].forEach(n => ensureUser(n, 'teacher', `${n}@gmail.com`));
    localStorage.setItem('users::demo', JSON.stringify(users));
  }catch(e){}

  loadAssignments();
  loadEvents();
  loadActivities();
  loadPerformance();
  loadStudentPerformances();
  seedDemoSchedule();
  const roleSelect = document.getElementById('roleSelect');
  const teacherPanel = document.getElementById('teacherPanel');
  const postBtn = document.getElementById('postBtn');
  const studentsLink = document.getElementById('studentsLink');
  const studentProfileLink = document.getElementById('studentProfileLink');

  if(roleSelect){
    if(currentUser){ try{ roleSelect.value = currentUser.role; roleSelect.disabled = !!currentUser.role; }catch(e){} }
    roleSelect.addEventListener('change', ()=>{ if(teacherPanel) teacherPanel.classList.toggle('hidden', roleSelect.value !== 'teacher'); if(studentsLink) studentsLink.classList.toggle('hidden', roleSelect.value !== 'teacher'); if(studentProfileLink) studentProfileLink.classList.toggle('hidden', roleSelect.value !== 'student'); renderAssignments(); renderEvents(); renderActivities(); renderPerformance(); });
    const initRole = currentUser ? currentUser.role : roleSelect.value;
    if(teacherPanel) teacherPanel.classList.toggle('hidden', initRole !== 'teacher');
    if(studentsLink) studentsLink.classList.toggle('hidden', initRole !== 'teacher');
    if(studentProfileLink) studentProfileLink.classList.toggle('hidden', initRole !== 'student');
  }

  if(postBtn) postBtn.addEventListener('click', handlePostNow);
  const postDueDone = document.getElementById('postDueDone'); if(postDueDone) postDueDone.addEventListener('click', handlePostNow);

  const eventAddBtn = document.getElementById('eventAddBtn');
  const eventTitle = document.getElementById('eventTitle');
  const eventDate = document.getElementById('eventDate');
  const eventClearBtn = document.getElementById('eventClearBtn');
  if(eventAddBtn){
    eventAddBtn.addEventListener('click', ()=>{
      const title = (eventTitle.value || '').trim();
      const date = eventDate.value;
      if(!title || !date){ showToast('Please fill in event name and date'); return; }
      classroomEvents.push({ id: Date.now().toString(), title, date });
      saveEvents();
      eventTitle.value = '';
      eventDate.value = '';
      renderEvents();
      showToast('Event added');
    });
  }
  if(eventClearBtn){
    eventClearBtn.addEventListener('click', ()=>{
      const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');
      if(role !== 'teacher'){ showToast('Teacher access only'); return; }
      classroomEvents = [];
      saveEvents();
      localStorage.setItem('demoScheduleDisabled::demo', '1');
      renderEvents();
      showToast('Events cleared');
    });
  }

  const activityAddBtn = document.getElementById('activityAddBtn');
  const activityTitle = document.getElementById('activityTitle');
  const activityDate = document.getElementById('activityDate');
  const activityClearBtn = document.getElementById('activityClearBtn');
  if(activityAddBtn){
    activityAddBtn.addEventListener('click', ()=>{
      const title = (activityTitle.value || '').trim();
      const date = activityDate.value;
      if(!title || !date){ showToast('Please fill in activity name and date'); return; }
      classroomActivities.push({ id: Date.now().toString(), title, date });
      saveActivities();
      activityTitle.value = '';
      activityDate.value = '';
      renderActivities();
      showToast('Activity added');
    });
  }
  if(activityClearBtn){
    activityClearBtn.addEventListener('click', ()=>{
      const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');
      if(role !== 'teacher'){ showToast('Teacher access only'); return; }
      classroomActivities = [];
      saveActivities();
      localStorage.setItem('demoScheduleDisabled::demo', '1');
      renderActivities();
      showToast('Activities cleared');
    });
  }

  const performanceAddBtn = document.getElementById('performanceAddBtn');
  const performanceTitle = document.getElementById('performanceTitle');
  const performanceDate = document.getElementById('performanceDate');
  const performanceClearBtn = document.getElementById('performanceClearBtn');
  if(performanceAddBtn){
    performanceAddBtn.addEventListener('click', ()=>{
      const title = (performanceTitle.value || '').trim();
      const date = performanceDate.value;
      if(!title || !date){ showToast('Please fill in task name and date'); return; }
      performanceTasks.push({ id: Date.now().toString(), title, date });
      savePerformance();
      performanceTitle.value = '';
      performanceDate.value = '';
      renderPerformance();
      showToast('Performance task added');
    });
  }
  if(performanceClearBtn){
    performanceClearBtn.addEventListener('click', ()=>{
      const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');
      if(role !== 'teacher'){ showToast('Teacher access only'); return; }
      performanceTasks = [];
      savePerformance();
      localStorage.setItem('demoScheduleDisabled::demo', '1');
      renderPerformance();
      showToast('Performance tasks cleared');
    });
  }

  const activityRemindBtn = document.getElementById('activityRemindBtn');
  if(activityRemindBtn){
    activityRemindBtn.addEventListener('click', ()=>{
      const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');
      if(role !== 'teacher'){ showToast('Teacher access only'); return; }
      const names = getAllStudentNames();
      if(names.length === 0){ showToast('No students to remind'); return; }
      const latestActivity = getLatestTitle(classroomActivities, 'your activity');
      saveReminder(`Please complete and submit: ${latestActivity}.`);
      renderStudentReminder();
      showToast(`Remind: ${names.join(', ')}`);
    });
  }

  const performanceRemindBtn = document.getElementById('performanceRemindBtn');
  if(performanceRemindBtn){
    performanceRemindBtn.addEventListener('click', ()=>{
      const role = currentUser ? currentUser.role : (roleSelect ? roleSelect.value : 'student');
      if(role !== 'teacher'){ showToast('Teacher access only'); return; }
      const names = getAllStudentNames();
      if(names.length === 0){ showToast('No students to remind'); return; }
      const latestPerformance = getLatestTitle(performanceTasks, 'your performance task');
      saveReminder(`Please complete and submit: ${latestPerformance}.`);
      renderStudentReminder();
      showToast(`Remind: ${names.join(', ')}`);
    });
  }

  // Golda chat
  const chatToggle = document.getElementById('goldaToggle');
  const chatPanel = document.getElementById('goldaPanel');
  const messages = document.getElementById('goldaMessages');
  const input = document.getElementById('goldaInput');
  const send = document.getElementById('goldaSend');
  function escapeHtml(s){ return String(s||'').replace(/[&"'<>]/g, c=> ({'&':'&amp;','"':'&quot;','\'':'&#39;','<':'&lt;','>':'&gt;'}[c])); }
  
  if(chatToggle && chatPanel && messages){
    chatToggle.addEventListener('click', ()=> chatPanel.classList.toggle('hidden'));
    function append(who, text){
      const m = document.createElement('div');
      m.className = who === 'user' ? 'text-right text-sm' : 'text-left text-sm';
      m.innerHTML = `<div class="inline-block p-2 rounded ${who==='user' ? 'bg-green-600 text-white' : 'bg-white border'}">${escapeHtml(text)}</div>`;
      messages.appendChild(m);
      messages.scrollTop = messages.scrollHeight;
    }

    


    if(send){
      send.addEventListener('click', async ()=>{
        const txt = (input.value||'').trim();
        if(!txt) return;
        input.value='';
        append('user', txt);
        append('golda', '⏳ Thinking...');
        const aiReply = await respondToAI(txt);
        const last = messages.lastChild;
        if(last && last.textContent.includes('⏳ Thinking')) last.remove();
        append('golda', aiReply);
      });
    }

  }

  renderAssignments();
  renderEvents();
  renderActivities();
  renderPerformance();
  renderStudentReminder();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

