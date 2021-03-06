import * as Koa from 'koa';
import * as KoaStatic from 'koa-static';
import * as KoaBody from 'koa-body';
import Router from './middleware/router';
import DbConnection from './db';
import config from './config';
import { terminalLog } from './libs/log';
import { token } from './middleware/token';
import { verifyUser } from './middleware/permission';
import { socketIO } from './socket';
import { cors } from './middleware/cors';

export const app = new Koa();
const router = new Router(app);

// 连接数据库
DbConnection(config.get('mongo')[config.get('env')]);

// 连接socketIO并注入app.context
socketIO(app);

// 跨域
app.use(cors);

// 静态资源
// app.use(KoaStatic(process.cwd()));

// request 获取文件上传
app.use(
  KoaBody({
    multipart: true,
    patchKoa: true,
    strict: false, // 如果为true，不解析GET,HEAD,DELETE请求
    formidable: {
      maxFieldsSize: config.get('upload')['maxUploadSize'] * 1024 * 1024
    }
  })
);

// 检查token
app.use(token);

// 验证用户获取用户权限，必须在token中间件后面
app.use(verifyUser);

// 注册路由
router.register(`${__dirname}/controller`);

app.listen(config.get('port'));
// https.createServer(sslReader(), app.callback()).listen(config.get('port'));

terminalLog(`Server running on port ${config.get('port')}`);
