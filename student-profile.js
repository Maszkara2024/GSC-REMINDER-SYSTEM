// Show current user name
const cur = JSON.parse(localStorage.getItem('currentUser::demo') || 'null');
const display = document.getElementById('currentUserDisplay');
if (display && cur) display.textContent = `${cur.name} (${cur.role})`;

// Load saved email if exists
const realEmailInput = document.getElementById('realEmail');
const savedEmail = localStorage.getItem(`email::${cur?.id}`); // assuming each student has a unique ID
if (savedEmail) realEmailInput.value = savedEmail;

// Save button
document.getElementById('saveProfileBtn')?.addEventListener('click', () => {
  if (!realEmailInput.value) return alert('Please enter an email address.');
  localStorage.setItem(`email::${cur.id}`, realEmailInput.value);
  document.getElementById('saveStatus').textContent = 'Saved!';
});
