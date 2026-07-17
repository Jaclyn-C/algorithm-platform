/* ============================================================
   common.js — 算法训练平台 共享 JavaScript
   所有页面均引用此文件（含 login.html）
   ============================================================ */

/* ----- getUser / getProjectName / logout ----- */
function getUser() {
  try { return JSON.parse(localStorage.getItem('current_user')); } catch(e) { return null; }
}

function logout() {
  localStorage.removeItem('current_user');
  location.href = 'login.html';
}

function getProjectName(key) {
  try {
    var pl = JSON.parse(localStorage.getItem('project_list') || '[]');
    var pp = JSON.parse(localStorage.getItem('personal_projects') || '[]');
    var found = pl.concat(pp).find(function(p) { return p.id === key; });
    if (found) return found.name;
  } catch(e) {}
  var m = { security: '保安服检测', fire: '烟火检测', helmet: '安全帽检测' };
  return m[key] || key;
}

/* ----- Toast ----- */
var _toastTimer;
function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { el.classList.remove('show'); }, 2000);
}

/* ----- User dropdown: click outside to close ----- */
document.addEventListener('click', function(e) {
  if (!e.target.closest('.user-menu')) {
    var dd = document.getElementById('userDropdown');
    if (dd) dd.classList.remove('show');
  }
});

/* ----- Sidebar collapse (handled by inline script in each page) ----- */

/* ----- Task Type ----- */
function getCurrentTaskType() {
  return localStorage.getItem('current_task_type') || 'detection';
}
function onTaskTypeChange(sel) {
  localStorage.setItem('current_task_type', sel.value);
}

/* ----- Park / Campus ----- */
function onParkChange(sel) {
  localStorage.setItem('current_park', sel.value);
}
setTimeout(function initHeaderSelectors() {
  var tsel = document.getElementById('headerTaskType');
  if (tsel) {
    var current = localStorage.getItem('current_task_type') || 'detection';
    tsel.value = current;
    if (!localStorage.getItem('current_task_type')) {
      localStorage.setItem('current_task_type', 'detection');
    }
  }
  var psel = document.getElementById('headerPark');
  if (psel) {
    var park = localStorage.getItem('current_park') || 'ganzhou';
    psel.value = park;
    if (!localStorage.getItem('current_park')) {
      localStorage.setItem('current_park', 'ganzhou');
    }
  }
}, 0);

function toggleSidebar() {
  var s = document.querySelector('.sidebar');
  if (!s) return;
  s.classList.toggle('collapsed');
  try { localStorage.setItem('sidebar_collapsed', s.classList.contains('collapsed')); } catch(e) {}
}
