import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, deleteDoc, doc, setDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 1. CONFIG
const firebaseConfig = {
    apiKey: "AIzaSyBQNGAQGWwKrWHsDfN7mZwb4LA9jP8V8xI",
    authDomain: "gsc-reminder-system.firebaseapp.com",
    projectId: "gsc-reminder-system",
    storageBucket: "gsc-reminder-system.firebasestorage.app",
    messagingSenderId: "779246880500",
    appId: "1:779246880500:web:7da307e1ee407ad36a80a1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const currentUser = JSON.parse(localStorage.getItem('currentUser::demo') || 'null');

// 2. UI HELPERS
function showToast(msg) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'max-w-xs px-4 py-3 rounded shadow-lg text-sm bg-white border border-indigo-100 mb-2';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// 3. RENDER & LIVE SYNC
function initSync() {
    const list = document.getElementById('studentList');
    const q = query(collection(db, "student_performance"), orderBy("name", "asc"));

    onSnapshot(q, (snapshot) => {
        list.innerHTML = '';
        if (snapshot.empty) {
            list.innerHTML = '<div class="text-slate-600 text-sm">No students added to cloud yet.</div>';
            return;
        }

        snapshot.forEach((studentDoc) => {
            const s = studentDoc.data();
            const id = studentDoc.id;
            
            const card = document.createElement('div');
            card.className = 'p-3 border rounded bg-white text-sm flex items-center justify-between gap-3 shadow-sm';
            
            const categoryLabel = s.category === 'performance' ? 'Performance Task' : 'Activity';
            const statusColor = (s.score / s.over) >= 0.75 ? 'text-green-600' : 'text-red-500';

            card.innerHTML = `
                <div>
                    <div class="font-medium text-slate-900">${s.name}</div>
                    <div class="text-xs text-slate-600">${categoryLabel}: <span class="font-bold">${s.score}/${s.over}</span></div>
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-[10px] font-bold uppercase ${statusColor}">${(s.score / s.over >= 0.75) ? 'PASSED' : 'NOT PASSED'}</span>
                    <button class="del-btn px-3 py-1 bg-red-100 text-red-600 rounded text-xs hover:bg-red-600 hover:text-white transition" data-id="${id}">Delete</button>
                </div>
            `;
            
            card.querySelector('.del-btn').onclick = async () => {
                await deleteDoc(doc(db, "student_performance", id));
                showToast('Student removed from cloud');
            };
            
            list.appendChild(card);
        });
    });
}

// 4. MAIN INIT
function init() {
    // Auth Check
    if (!currentUser) { location.href = 'login.html'; return; }
    document.getElementById('currentUserDisplay').textContent = `${currentUser.name} (${currentUser.role})`;
    
    if (currentUser.role !== 'teacher') {
        document.getElementById('teacherOnly')?.classList.add('hidden');
        document.getElementById('noAccess')?.classList.remove('hidden');
    }

    initSync();

    const addBtn = document.getElementById('addStudentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', async () => {
            const name = document.getElementById('studentName').value.trim();
            const category = document.getElementById('categorySelect').value;
            const score = Number(document.getElementById('scoreValue').value);
            const over = Number(document.getElementById('overValue').value);

            if (!name || isNaN(score) || isNaN(over) || over <= 0) {
                showToast('Please enter valid details');
                return;
            }

            try {
                // Save to Firestore
                await addDoc(collection(db, "student_performance"), {
                    name,
                    category,
                    score: Math.round(score),
                    over: Math.round(over),
                    status: (score / over) >= 0.75 ? 'approved' : 'pending' // Mapping for AI logic
                });

                showToast('Cloud database updated');
                document.getElementById('studentName').value = '';
                document.getElementById('scoreValue').value = '';
                document.getElementById('overValue').value = '';
            } catch (e) {
                console.error(e);
                showToast('Error saving to cloud');
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);