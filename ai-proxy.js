/*
 * ai-proxy.js · 学生家长工作台的本地 AI 中转（可选）
 * 个人工作台系列 · Developed by @赛博老爸
 *
 * 有些 AI 服务不允许网页直接调用（跨域限制）。这个小程序在你自己的电脑上转发请求：
 *   1. 安装 Node.js（18 或更高版本）
 *   2. 在本文件所在文件夹运行：node ai-proxy.js
 *   3. 工作台「设置 → AI 接口」里的接口地址改成：http://127.0.0.1:8787/ 加原地址
 *      例如 http://127.0.0.1:8787/https://api.deepseek.com
 * 只监听本机 127.0.0.1，不保存、不记录任何内容；关闭窗口即停止。
 */
var http = require('http');
var https = require('https');
var PORT = +process.env.PORT || 8787;

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Max-Age', '86400');
}

http.createServer(function (req, res) {
  cors(res);
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
  var target = decodeURIComponent(req.url.slice(1));
  if (!/^https?:\/\//i.test(target)) {
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('学生家长工作台 · AI 中转正在运行。\n把接口地址改成 http://127.0.0.1:' + PORT + '/ 加原地址即可，例如 http://127.0.0.1:' + PORT + '/https://api.deepseek.com');
    return;
  }
  var u;
  try { u = new URL(target); } catch (e) { res.writeHead(400); res.end('地址不正确'); return; }
  var headers = {};
  Object.keys(req.headers).forEach(function (k) {
    if (['host', 'origin', 'referer', 'connection', 'content-length'].indexOf(k) < 0 && k.indexOf('sec-') !== 0) headers[k] = req.headers[k];
  });
  var chunks = [];
  req.on('data', function (c) { chunks.push(c); });
  req.on('end', function () {
    var body = Buffer.concat(chunks);
    if (body.length) headers['content-length'] = body.length;
    var mod = u.protocol === 'http:' ? http : https;
    var up = mod.request({ method: req.method, hostname: u.hostname, port: u.port || (u.protocol === 'http:' ? 80 : 443), path: u.pathname + u.search, headers: headers }, function (r) {
      var h = {};
      Object.keys(r.headers).forEach(function (k) { if (k.indexOf('access-control-') !== 0) h[k] = r.headers[k]; });
      h['Access-Control-Allow-Origin'] = '*';
      res.writeHead(r.statusCode || 502, h);
      r.pipe(res);
    });
    up.on('error', function (e) {
      if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('中转失败：' + e.message);
    });
    up.end(body);
  });
}).listen(PORT, '127.0.0.1', function () {
  console.log('学生家长工作台 · AI 中转已启动：http://127.0.0.1:' + PORT + '/');
  console.log('接口地址示例：http://127.0.0.1:' + PORT + '/https://api.deepseek.com');
  console.log('按 Ctrl + C 停止。');
});
