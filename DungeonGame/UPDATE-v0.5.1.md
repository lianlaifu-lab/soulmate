# v0.5.1 统一替换与加载确认

## 为什么上次可能没有生效

用户上传的源码已具有全屏覆盖、浮动摇杆、多指切枪、金币和三种怪物。未拿到实际运行网址/网络请求，不能断言问题一定是缓存。可能性包括：仍打开旧目录、只更新部分文件、线上未部署成功、浏览器/服务器返回旧 HTML 或旧资源。

本轮实际改动是：明确全视口 CSS、切枪按钮不参与浏览器触摸手势、全链路版本化加载、可见运行版本、加载失败界面、完整测试命令和部署说明。五项玩法中已有的逻辑保留并统一交付，不冒充全部新写。

## 替换清单

| 路径 | 处理 |
| --- | --- |
| index.html | 替换。v0.5.1 标记；动态加载入口；成功后启用开始；失败时显示提示 |
| css/style.css | 替换。基础布局直接全视口，移除早期 8:5 限宽；切枪 touch-action:none；加载标签样式 |
| js/immersive.js、js/main.js、js/ui.js | 替换。统一依赖版本；入口注释与开始操作提示同步 |
| js/input.js、js/viewport.js、js/renderer.js | 替换。保留浮动双摇杆、捕获/切枪、相机与绘制，统一依赖版本 |
| js/coins.js、js/combat.js、js/game.js、js/lifecycle.js | 替换。保留击杀掉币、吸附、更新/重开调用，统一依赖版本 |
| js/weapons.js、js/enemies.js、js/navigation.js、js/player.js、js/room.js、js/waves.js | 替换。关联模块统一依赖版本，战斗数值不变 |
| js/config.js、js/dom.js、js/math.js、js/monsters.js、js/state.js | 与基线字节相同，完整随包提供；建议和其余 JS 一起合并覆盖，确保完整 |
| package.json | 替换。版本同步，npm test 覆盖所有测试文件 |
| tests/game.test.js、tests/touch.test.js | 替换。依赖版本同步，新增金币链路/靠墙随机掉落/持续移动切枪/不同视口起手测试 |
| tests/entry.test.js、tests/release.test.js | 新增。完整沉浸入口、全屏失败回退、版本图与启动成功/失败测试 |
| README.md、CHANGELOG.md | 更新当前使用方式与记录 |
| DEVELOPMENT_LOG.md、UPDATE-v0.5.1.md | 新增本轮开发与替换说明 |
| serve.py、旧 UPDATE 文档 | 原样保留，无须替换 |

JS 文件都在原 js/ 下，不创建 js/js 或额外嵌套目录。后续发布新版本时，需一致更新 HTML、CSS 引用及所有模块依赖的版本号；同一版本仅发布一次，避免用相同版本参数反复覆盖不同字节。

本轮没有进行线上部署或 iPhone 真机验收。修改源自上传的完整基线；若本地又有更新，应先比较差异，避免覆盖自己的新增工作。
