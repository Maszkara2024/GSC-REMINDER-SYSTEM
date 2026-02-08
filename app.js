// Clean assignments + Golda chat implementation
// Tracks per-student submission status

const LS_KEY = 'assignments::demo';
const LS_EVENTS_KEY = 'schoolevents::demo';
let assignments = [];
let schoolEvents = [];
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

function saveSchoolEvents(){
  try{ localStorage.setItem(LS_EVENTS_KEY, JSON.stringify(schoolEvents)); }catch(e){ console.error(e); }
}

function loadSchoolEvents(){
  try{ schoolEvents = JSON.parse(localStorage.getItem(LS_EVENTS_KEY) || '[]'); }catch(e){ schoolEvents = []; }
}

function formatEventDate(dateStr){ 
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function renderSchoolEvents(){
  const list = document.getElementById('eventsList');
  const teacherPanel = document.getElementById('teacherEventPanel');
  const eventTeacherOnly = document.getElementById('eventTeacherOnly');
  const role = currentUser ? currentUser.role : 'student';
  
  if(!list) return;
  
  // Show teacher controls only for teachers
  if(teacherPanel) teacherPanel.classList.toggle('hidden', role !== 'teacher');
  if(eventTeacherOnly) eventTeacherOnly.classList.toggle('hidden', role !== 'teacher');
  
  list.innerHTML = '';
  if(schoolEvents.length === 0){
    const empty = document.createElement('div');
    empty.className = 'text-slate-600 text-sm';
    empty.textContent = 'No events scheduled.';
    list.appendChild(empty);
    return;
  }
  
  schoolEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  schoolEvents.forEach((evt, idx) => {
    const card = document.createElement('div');
    card.className = 'p-3 border rounded bg-blue-50 text-sm';
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
      del.onclick = () => { schoolEvents.splice(idx, 1); saveSchoolEvents(); renderSchoolEvents(); showToast('Event deleted'); };
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
        
        // Get list of students who haven't completed
        const incompleteStudents = a.submissions.filter(s => !s.completed).map(s => s.studentName);
        const remindBtn = document.createElement('button');
        remindBtn.className = 'px-3 py-1 bg-yellow-600 text-white rounded text-sm mr-2';
        remindBtn.textContent = `Auto Remind (${incompleteStudents.length})`;
        remindBtn.onclick = () => {
          if(incompleteStudents.length === 0){
            showToast('All students have completed this assignment!');
          } else {
            showToast(`Reminder sent to: ${incompleteStudents.join(', ')}`);
          }
        };
        card.appendChild(remindBtn);
        
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
  loadAssignments();
  loadSchoolEvents();
  const roleSelect = document.getElementById('roleSelect');
  const teacherPanel = document.getElementById('teacherPanel');
  const postBtn = document.getElementById('postBtn');

  if(roleSelect){
    if(currentUser){ try{ roleSelect.value = currentUser.role; roleSelect.disabled = !!currentUser.role; }catch(e){} }
    roleSelect.addEventListener('change', ()=>{ if(teacherPanel) teacherPanel.classList.toggle('hidden', roleSelect.value !== 'teacher'); renderAssignments(); renderSchoolEvents(); });
    const initRole = currentUser ? currentUser.role : roleSelect.value;
    if(teacherPanel) teacherPanel.classList.toggle('hidden', initRole !== 'teacher');
  }

  if(postBtn) postBtn.addEventListener('click', handlePostNow);
  const postDueDone = document.getElementById('postDueDone'); if(postDueDone) postDueDone.addEventListener('click', handlePostNow);

  // School Events
  const eventAddBtn = document.getElementById('eventAddBtn');
  const eventTitle = document.getElementById('eventTitle');
  const eventDate = document.getElementById('eventDate');
  if(eventAddBtn){
    eventAddBtn.addEventListener('click', ()=>{
      const title = (eventTitle.value || '').trim();
      const date = eventDate.value;
      if(!title || !date){ showToast('Please fill in event name and date'); return; }
      schoolEvents.push({ id: Date.now().toString(), title, date });
      saveSchoolEvents();
      eventTitle.value = '';
      eventDate.value = '';
      renderSchoolEvents();
      showToast('Event added');
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
    function append(who, text){ const m = document.createElement('div'); m.className = who === 'user' ? 'text-right text-sm' : 'text-left text-sm'; m.innerHTML = `<div class="inline-block p-2 rounded ${who==='user' ? 'bg-green-600 text-white' : 'bg-white border'}">${escapeHtml(text)}</div>`; messages.appendChild(m); messages.scrollTop = messages.scrollHeight; }
    function respondTo(msg){ const lower = msg.toLowerCase(); if(/\bhello|hi|hey\b/.test(lower)) return 'Hello — I\'m Golda. I can list assignments or help with posting.'; if(/list assignments|show assignments/.test(lower)) return assignments.length ? assignments.map(a=> `• ${a.title}${a.due ? ' (due ' + new Date(a.due).toLocaleString() + ')' : ''}${a.submissions && a.submissions.length ? ' (' + a.submissions.length + ' submission' + (a.submissions.length > 1 ? 's' : '') + ')' : ''}`).join('\n') : 'No assignments posted yet.'; return "Golda can't do that here."; }
    if(send){ send.addEventListener('click', ()=>{ const txt = (input.value||'').trim(); if(!txt) return; input.value=''; append('user', txt); setTimeout(()=> append('golda', respondTo(txt)), 300); }); }
    if(input) input.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') { e.preventDefault(); if(send) send.click(); } });
  }

  renderAssignments();
  renderSchoolEvents();
}

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

