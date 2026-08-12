/* common.js — 算法一体化平台 共享 JavaScript */

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
  return key;
}
var _toastTimer;
function showToast(msg) {
  var el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(function() { el.classList.remove('show'); }, 2000);
}
function toggleSidebar() {
  var s = document.querySelector('.sidebar');
  if (!s) return;
  s.classList.toggle('collapsed');
  try { localStorage.setItem('sidebar_collapsed', s.classList.contains('collapsed')); } catch(e) {}
}
document.addEventListener('click', function(e) {
  if (!e.target.closest('.user-menu')) {
    var dd = document.getElementById('userDropdown');
    if (dd) dd.classList.remove('show');
  }
});

/* 任务类型 */
function getTaskTypeLabel(taskType) {
  return (taskType === 'segment') ? '分割模型' : '目标检测';
}
function getTaskTypeTag(taskType) {
  if (taskType === 'segment') return '<span class="tag" style="background:#f9f0ff;color:#722ed1;margin-left:6px;">分割</span>';
  return '<span class="tag" style="background:#e6f7ff;color:#1890ff;margin-left:6px;">目标检测</span>';
}

/* Tag 管理 */
function getTags() {
  try { return JSON.parse(localStorage.getItem('platform_tags')) || getDefaultTags(); } catch(e) { return getDefaultTags(); }
}
function saveTags(tags) { localStorage.setItem('platform_tags', JSON.stringify(tags)); }
function getDefaultTags() {
  var defaults = ['安防', '工业', '交通'];
  saveTags(defaults);
  return defaults;
}

/* 算法子页面横向导航栏 */
var ALGO_PAGES = [
  { key: 'data_center',    label: '数据中心', href: 'data_center.html',    icon: '<path d="M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16zM3.3 7L12 12l8.7-5M12 22V12"/>' },
  { key: 'training',       label: '模型训练', href: 'training.html',       icon: '<path d="M6.5 6.5L17.5 17.5M3 8l2-2M21 16l-2 2M3 16l5-5M16 8l5 5M9 7l3-3 3 3M9 17l3 3 3-3"/>' },
  { key: 'evaluation',     label: '模型推理', href: 'evaluation.html',     icon: '<path d="M9 3h6v5l4 8a3 3 0 0 1-2.7 4.3H7.7A3 3 0 0 1 5 16l4-8V3zM9 3h6"/>' }
];

function renderAlgoNav(activeKey) {
  var pid = localStorage.getItem('current_project') || '';
  var pname = getProjectName(pid);
  var html = '<div class="algo-nav">' +
    '<div class="algo-nav-title">' + pname + '</div>' +
    '<div class="algo-nav-tabs">';
  ALGO_PAGES.forEach(function(pg) {
    html += '<a class="algo-nav-tab' + (pg.key === activeKey ? ' active' : '') + '" href="' + pg.href + '">' +
      '<svg viewBox="0 0 24 24">' + pg.icon + '</svg>' +
      '<span>' + pg.label + '</span>' +
    '</a>';
  });
  html += '</div></div>';
  return html;
}

/* 在页面中插入横向导航（调用此函数，传入当前页 key 和容器 id） */
function mountAlgoNav(activeKey, containerId) {
  var el = document.getElementById(containerId);
  if (el) el.innerHTML = renderAlgoNav(activeKey);
}
