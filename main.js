const { server } = require('./server');
const { listenPort } = require('./config');

// 本地服务器开启监听
server.listen(listenPort);
console.log('[server] server is running ......');