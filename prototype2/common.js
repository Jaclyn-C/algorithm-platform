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

/* 演示图片生成（与 data_center 的 genImages 同构） */
function _demoImages(p, n) {
  var a = [];
  for (var i = 0; i < n; i++) {
    a.push({ id: p + '_' + (i + 1), name: p + '_' + String(i + 1).padStart(3, '0') + '.jpg', hue: (i * 23) % 360, dup: false, tag: null });
  }
  return a;
}

/* ===== 平台角色（超级管理员 / 管理员 / 普通用户）与标签授权 ===== */
/* 平台角色与算法内角色正交：平台角色管"平台级"事务（用户、标签），
   算法内角色（创建者/工程师/标注员/查看者）管"某个算法里"能做什么。 */
function isPlatformAdmin(u) { u = u || getUser(); return !!u && (u.role === 'super_admin' || u.role === 'admin'); }
function isSuperAdmin(u) { u = u || getUser(); return !!u && u.role === 'super_admin'; }
function platformRoleLabel(u) {
  u = u || getUser();
  if (!u) return '普通用户';
  if (u.role === 'super_admin') return '超级管理员';
  if (u.role === 'admin') return '管理员';
  return '普通用户';
}
/* 用户可用的标签：超管/管理员可用全部；普通用户用其被授权的 tags。 */
function getGrantedTags(u) {
  u = u || getUser();
  if (!u) return [];
  if (isPlatformAdmin(u)) return getTags();
  return Array.isArray(u.tags) ? u.tags.slice() : [];
}

/* 确保系统存在一个超级管理员（幂等）。用于兼容旧数据：把已有 admin 提为超管，
   否则把第一个用户提为超管。同步当前登录态。 */
function ensureSuperAdmin() {
  var users = [];
  try { users = JSON.parse(localStorage.getItem('platform_users')) || []; } catch(e) {}
  if (!users.length) return;
  if (users.some(function(u) { return u.role === 'super_admin'; })) return;
  var target = users.find(function(u) { return u.role === 'admin'; }) || users[0];
  target.role = 'super_admin';
  localStorage.setItem('platform_users', JSON.stringify(users));
  try {
    var cu = JSON.parse(localStorage.getItem('current_user'));
    if (cu && cu.username === target.username) localStorage.setItem('current_user', JSON.stringify(target));
  } catch(e) {}
}

/* 在侧边栏「系统设置」下注入「用户管理」入口（仅超管/管理员可见） */
;(function() {
  ensureSuperAdmin();
  var groups = document.querySelectorAll('.sidebar-group');
  for (var i = 0; i < groups.length; i++) {
    var t = groups[i].querySelector('.sidebar-group-title');
    if (!t || t.textContent.indexOf('系统设置') < 0) continue;
    if (groups[i].querySelector('a[href="user_manage.html"]')) continue;
    var u = getUser();
    if (!u || !isPlatformAdmin(u)) continue;
    var a = document.createElement('a');
    a.className = 'sidebar-item';
    a.href = 'user_manage.html';
    a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg><span>用户管理</span>';
    var first = groups[i].querySelector('.sidebar-item');
    if (first) groups[i].insertBefore(a, first); else groups[i].appendChild(a);
  }
})();

/* 为“所有算法”补全演示数据集（按需、幂等）。
   修复：原先演示数据集只在进入数据集管理页(data_center)时才按当前算法生成，
   导致登录后算法卡片的“数据集”数量与“数据集总览”都为空，要点进某个算法再退出才更新。
   现在在算法项目页 / 数据集总览页加载时即补全，口径与 data_center 一致：数据集按 project(=算法ID) 关联。*/
function ensureDemoDatasets() {
  var projects = [];
  try { projects = JSON.parse(localStorage.getItem('personal_projects')) || []; } catch(e) {}
  if (!projects.length) return;
  var ds = [];
  try { ds = JSON.parse(localStorage.getItem('dc_datasets')) || []; } catch(e) {}
  var changed = false;
  var vids = ['路段A监控.mp4', '厂区夜间.mp4'];
  var cfg = [['·抽样', 60, 'deduped'], ['·夜间片段', 40, 'extracted']];
  projects.forEach(function(p) {
    if (ds.some(function(d) { return d.project === p.id; })) return; // 该算法已有数据集，跳过
    var pfx = (p.id || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'ds';
    cfg.forEach(function(c, i) {
      var id = pfx + '_' + (i + 1);
      if (ds.some(function(d) { return d.id === id; })) return; // 避免 id 冲突
      var imgs = _demoImages(id, c[1]);
      if (i === 0) for (var k = 0; k < 15 && k < imgs.length; k++) imgs[k].dup = true;
      ds.push({
        id: id, name: p.name + c[0], videoName: vids[i] || '视频',
        createdAt: '2026-08-0' + (2 + i), stage: c[2], splitRatio: null,
        project: p.id, uploader: '—', imgs: imgs
      });
    });
    changed = true;
  });
  if (changed) localStorage.setItem('dc_datasets', JSON.stringify(ds));
}
