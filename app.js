/**
 * APP.JS - The Central Brain
 * Handles: Global State, AI Logic, and UI Rendering
 */

// 1. GLOBAL STATE (The AI's knowledge base)
let firebaseState = {
  activities: [],
  performance: [],
  students: [],
  events: []
};

// 2. THE HANDSHAKE (Called by Firebase listeners in dashboard.html)
window.updateAIBrain = (key, data) => {
  firebaseState[key] = data;
  renderAll(); // Refresh the UI whenever cloud data changes
};

// 3. THE AI ENGINE (Talks to your /api/ai backend)
async function queryAI(prompt) {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        prompt, 
        context: firebaseState // <-- Sending the AI the actual database state!
      })
    });
    const data = await res.json();
    return data.reply;
  } catch (e) {
    console.error("AI Error:", e);
    return "Connection error. Is the server running?";
  }
}

// 4. ANALYTICS HELPERS (For the Assistant to "Read" the data)
const getStats = {
  activities: () => {
    const total = firebaseState.activities.length;
    const approved = firebaseState.activities.filter(a => a.status === 'approved').length;
    return { total, approved, pending: total - approved };
  },
  studentList: () => {
    return firebaseState.students.length > 0 
      ? firebaseState.students.map(s => s.name).join(', ') 
      : "No students registered in the database yet.";
  }
};

// 5. LOCAL CHAT LOGIC
function assistantReplyFor(prompt) {
  const q = prompt.toLowerCase();
  
  if (q.includes('how many') && q.includes('activity')) {
    const stats = getStats.activities();
    return `Currently, there are ${stats.total} activities in this view. ${stats.approved} are approved and ${stats.pending} are awaiting action.`;
  }
  
  if (q.includes('student') && (q.includes('list') || q.includes('who'))) {
    return `Here are the students: ${getStats.studentList()}`;
  }

  if (q.includes('pending') || q.includes('approval')) {
    const stats = getStats.activities();
    return `You have ${stats.pending} pending items in the current selection.`;
  }

  return null;
}

// 6. UI ENGINE (Draws the cards on the screen)
function renderAll() {
  renderList('eventsList', firebaseState.events, 'No upcoming school-wide events.');
  renderList('activityList', firebaseState.activities, 'No activities for this teacher.');
  renderList('performanceList', firebaseState.performance, 'No performance tasks for this teacher.');
}

function renderList(elementId, data, emptyMsg) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = '';
  
  if (!data || data.length === 0) {
    container.innerHTML = `<div class="text-slate-400 text-sm italic p-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">${emptyMsg}</div>`;
    return;
  }

  data.forEach(item => {
    const card = document.createElement('div');
    card.className = 'p-3 bg-white border border-slate-200 rounded-lg flex justify-between items-center mb-2 shadow-sm hover:border-indigo-300 transition-colors';
    
    // Check if item has a teacher name to show a small badge
    const teacherBadge = item.teacherName ? `<span class="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 ml-2">Teacher: ${item.teacherName}</span>` : '';

    card.innerHTML = `
      <div>
        <div class="flex items-center">
            <div class="font-medium text-slate-800 text-sm">${item.title || item.name}</div>
            ${teacherBadge}
        </div>
        <div class="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            ${item.date || 'No date set'}
        </div>
      </div>
      <div class="flex items-center gap-2">
        ${item.status === 'approved' ? '<span class="bg-green-100 text-green-700 text-[10px] px-2 py-1 rounded-full font-bold">APPROVED</span>' : '<span class="bg-amber-50 text-amber-600 text-[10px] px-2 py-1 rounded-full">PENDING</span>'}
      </div>
    `;
    container.appendChild(card);
  });
}

// 7. INITIALIZATION (Chat interface setup)
function initAssistant() {
  const input = document.getElementById('assistantInput');
  const sendBtn = document.getElementById('assistantSendBtn');
  const wrap = document.getElementById('assistantMessages');

  if (!input || !sendBtn) return;

  const addMsg = (role, text) => {
    const bubble = document.createElement('div');
    bubble.className = role === 'user' 
      ? 'ml-auto bg-indigo-600 text-white p-3 rounded-2xl rounded-tr-none mb-3 max-w-[85%] text-sm shadow-sm' 
      : 'mr-auto bg-white border border-slate-200 p-3 rounded-2xl rounded-tl-none mb-3 max-w-[85%] text-sm text-slate-800 shadow-sm';
    bubble.textContent = text;
    wrap.appendChild(bubble);
    wrap.scrollTop = wrap.scrollHeight;
    return bubble;
  };

  const handleSend = async () => {
    const text = input.value.trim();
    if (!text) return;

    addMsg('user', text);
    input.value = '';

    let reply = assistantReplyFor(text);

    if (!reply) {
      const loadingBubble = addMsg('assistant', "Checking the database...");
      reply = await queryAI(text);
      loadingBubble.remove();
    }

    addMsg('assistant', reply);
  };

  sendBtn.onclick = handleSend;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSend();
  });

  document.querySelectorAll('.assistantQuick').forEach(btn => {
    btn.onclick = () => {
      input.value = btn.getAttribute('data-question');
      handleSend();
    };
  });
}

// 8. LAUNCH
document.addEventListener('DOMContentLoaded', () => {
  initAssistant();
  renderAll();
});