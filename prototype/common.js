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

/* 园区选择已移除（原 onParkChange / checkParkAndTask / setupPrompt 门禁）*/

function toggleSidebar() {
  var s = document.querySelector('.sidebar');
  if (!s) return;
  s.classList.toggle('collapsed');
  try { localStorage.setItem('sidebar_collapsed', s.classList.contains('collapsed')); } catch(e) {}
}

/* ============================================================
   数据中心共享数据种子（dc_media / dc_datasets）
   data_center 与 datasets_overview 均调用，保证两页数据一致
   ============================================================ */
function genImages(prefix, n) {
  var arr = [];
  for (var i = 0; i < n; i++) {
    arr.push({ id: prefix + '_' + (i + 1), name: prefix + '_' + String(i + 1).padStart(3, '0') + '.jpg', hue: (i * 23) % 360, dup: false, tag: null });
  }
  return arr;
}

function ensureDcSeed() {
  // 媒体库视频（全局共享）
  var media = [];
  try { media = JSON.parse(localStorage.getItem('dc_media')) || []; } catch(e) {}
  if (media.length === 0) {
    media = [
      { id: 'vid_1', name: '保安服_路段A.mp4', size: '412 MB', duration: '00:15:32', resolution: '1920×1080', fps: 30 },
      { id: 'vid_2', name: '烟火_厂区夜间.mp4', size: '286 MB', duration: '00:09:45', resolution: '1920×1080', fps: 25 },
      { id: 'vid_3', name: '安全帽_车间.mp4', size: '198 MB', duration: '00:06:20', resolution: '1280×720', fps: 30 }
    ];
    localStorage.setItem('dc_media', JSON.stringify(media));
  }
  // 数据集（按项目归属）
  var datasets = [];
  try { datasets = JSON.parse(localStorage.getItem('dc_datasets')) || []; } catch(e) {}
  var changed = false;
  // 迁移：清除没有 project 归属的旧种子
  var filtered = datasets.filter(function(d){ return d.project; });
  if (filtered.length !== datasets.length) { datasets = filtered; changed = true; }
  // 收集所有已知项目 id（当前项目 + 个人/团队项目列表），为每个尚无数据集的项目生成专属示例
  var pidSet = {};
  var cur = localStorage.getItem('current_project') || '';
  if (cur) pidSet[cur] = true;
  try { JSON.parse(localStorage.getItem('personal_projects') || '[]').forEach(function(p){ if (p && p.id) pidSet[p.id] = true; }); } catch(e) {}
  try { JSON.parse(localStorage.getItem('project_list') || '[]').forEach(function(p){ if (p && p.id) pidSet[p.id] = true; }); } catch(e) {}
  Object.keys(pidSet).forEach(function(pid){
    if (!datasets.some(function(d){ return d.project === pid; })) {
      seedProjectDatasets(datasets, pid);
      changed = true;
    }
  });
  if (changed) localStorage.setItem('dc_datasets', JSON.stringify(datasets));
}

// 为单个项目生成 4 个示例数据集（以项目名命名，故各项目不同）
function seedProjectDatasets(datasets, pid) {
  var pname = getProjectName(pid);
  var prefix = ((pid || 'ds').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10) || 'ds') + '_';
  var defs = [
    // [名称后缀, 来源视频, 阶段, 总数, 重复数, 日期, 上传者]
    ['·抽样', '保安服_路段A.mp4', 'deduped', 24, 6, '2026-08-02', '张明'],
    ['·夜间片段', '烟火_厂区夜间.mp4', 'extracted', 20, 0, '2026-08-05', '李华'],
    ['·补录', '保安服_路段A.mp4', 'review', 18, 3, '2026-08-07', '王芳'],
    ['·全景', '烟火_厂区夜间.mp4', 'annotated', 32, 6, '2026-08-08', '赵磊']
  ];
  defs.forEach(function(df, i){
    var imgs = genImages(prefix + (i + 1), df[3]);
    for (var k = 0; k < df[4] && k < imgs.length; k++) imgs[k].dup = true;
    datasets.push({
      id: prefix + (i + 1), name: pname + df[0], videoName: df[1], createdAt: df[5],
      extract: { mode: 'interval', interval: 30, quality: 85 }, stage: df[2], splitRatio: null,
      project: pid, uploader: df[6], imgs: imgs
    });
  });
}
