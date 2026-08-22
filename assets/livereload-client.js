// 智学平台 · Live Reload 客户端（零依赖，挂 EventSource）
(function () {
  if (window.__zxLiveReload) return;
  window.__zxLiveReload = true;

  var es = new EventSource('/api/livereload');

  es.addEventListener('reload', function () {
    // 轻微延迟，确保服务端文件已落盘再刷新
    setTimeout(function () { window.location.reload(); }, 120);
  });

  // 连接断开时 EventSource 会自动按 retry 重连，无需手动处理
  es.onerror = function () {};
})();
