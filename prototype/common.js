/* ============================================================
   common.js — 算法一体化平台 共享 JavaScript
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

/* ----- Task Type (per-algorithm, not global) ----- */
/* 模型任务随算法项目存储（taskType: 'detection' | 'segment'），不再使用全局值 */
function getTaskTypeLabel(taskType) {
  return (taskType === 'segment') ? '分割' : '目标检测';
}
function getTaskTypeTag(taskType) {
  var t = taskType || 'detection';
  var seg = '<span class="tag" style="background:#f9f0ff;color:#722ed1;margin-left:6px;">分割</span>';
  var det = '<span class="tag" style="background:#f6ffed;color:#52c41a;margin-left:6px;">目标检测</span>';
  return (t === 'segment') ? seg : det;
}

/* ----- Park / Campus ----- */
function onParkChange(sel) {
  localStorage.setItem('current_park', sel.value);
  checkParkAndTask(true);
}
setTimeout(function initHeaderSelectors() {
  var psel = document.getElementById('headerPark');
  if (psel) {
    var park = localStorage.getItem('current_park');
    if (park) psel.value = park;
  }
  checkParkAndTask();
}, 0);

/* ----- Check if park is selected, show prompt if not ----- */
function checkParkAndTask(fromUser) {
  var park = localStorage.getItem('current_park');
  var ready = !!park;
  var promptEl = document.getElementById('setupPrompt');
  var sidebarEl = document.querySelector('.sidebar');
  var mainEl = document.querySelector('.content');
  var breadcrumb = document.querySelector('.header .breadcrumb');

  if (!ready) {
    // Not ready: show prompt, hide everything
    if (promptEl) promptEl.style.display = 'flex';
    if (mainEl) mainEl.style.display = 'none';
    if (sidebarEl) {
      sidebarEl.querySelectorAll('.sidebar-group').forEach(function(g) { g.style.display = 'none'; });
    }
    if (breadcrumb) breadcrumb.style.display = 'none';
  } else if (fromUser) {
    // User just made the last selection — reload to apply
    location.reload();
  } else {
    // Init: both already selected, just hide prompt
    if (promptEl) promptEl.style.display = 'none';
  }
  return ready;
}

function toggleSidebar() {
  var s = document.querySelector('.sidebar');
  if (!s) return;
  s.classList.toggle('collapsed');
  try { localStorage.setItem('sidebar_collapsed', s.classList.contains('collapsed')); } catch(e) {}
}
