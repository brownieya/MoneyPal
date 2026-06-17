# MoneyPal

## 当前打包策略

这个项目现在已经改成更适合**个人自用**的 Android 发布方式：

- `production` 不再生成 `AAB`
- `production` 会生成 `APK`
- 当前 Android 架构只打包 `arm64-v8a`
- 适合你自己安装、覆盖安装、配合 OTA 更新使用

相关配置文件：

- [eas.json](/D:/GitLearn/MoneyPal/eas.json)
- [app.json](/D:/GitLearn/MoneyPal/app.json)
- [package.json](/D:/GitLearn/MoneyPal/package.json)

---

## 当前 OTA 配置状态

项目已经具备 Expo EAS Update 的 OTA 基础能力：

- 已安装 `expo-updates`
- 已配置 `updates.url`
- 已配置 `extra.eas.projectId`
- 已配置 `runtimeVersion.policy = "fingerprint"`
- 已配置 `development / preview / production` 三个 channel

也就是说，这个项目可以做：

- 首次安装一个 Android APK
- 之后对 **JS / TS / 样式 / 图片资源** 这类非原生改动，直接通过 OTA 下发更新

---

## 一句话理解 OTA

OTA 更新适合：

- 页面样式修改
- 文案修改
- React / Zustand / 业务逻辑修改
- 图片、图标、静态资源更新

OTA 更新不适合：

- 修改 Android 原生代码
- 修改 `android/` 工程配置
- 新增或删除原生依赖
- 修改 Expo 原生插件配置

如果你做了上面这些“原生层变更”，就必须重新打一个新的 APK，不能只发 OTA。

---

## 第一次使用前要做什么

### 1. 先准备 EAS 登录

确保你已经登录 Expo / EAS：

```bash
eas login
```

### 2. 第一次先打一个 production APK

这个 APK 是 OTA 的“底座”。

根目录执行：

```bash
npm run build:android:production
```

它等价于：

```bash
eas build --profile production --platform android
```

当前 `production` profile 的行为：

- channel: `production`
- distribution: `internal`
- android buildType: `apk`
- Android ABI: `arm64-v8a`
- EAS 直接上传单个 APK 产物，不再返回整目录 `.tar.gz`

打包完成后，下载安装这个 APK 到你的手机。

---

## 日常 OTA 更新流程

当你只改了 JS / TS / 样式 / 页面逻辑时，流程如下：

### 1. 修改代码

例如：

- 首页样式
- 账单分类逻辑
- 文案
- 统计页交互

### 2. 发布 production OTA

在项目根目录执行：

```bash
npm run update:production
```

它等价于：

```bash
eas update --branch production
```

### 3. 手机端获取更新

已经安装过 production APK 的设备：

- 启动 App 时会检查更新
- 下载到新版本 OTA 后
- 通常在下一次重启 App 时生效

如果你希望尽快看到效果，最稳妥的做法是：

1. 完成 OTA 发布
2. 彻底关闭 App
3. 重新打开 App

---

## 建议的实际工作流

### 情况 A：只是改页面、文案、逻辑

直接走 OTA：

```bash
npm run update:production
```

### 情况 B：改了原生代码或原生配置

必须重新打 APK：

```bash
npm run build:android:production
```

安装新 APK 后，如果后续只是继续改 JS 层，再继续走 OTA。

---

## 推荐的发布判断标准

可以直接 OTA 的改动：

- `src/` 下的大多数 React 页面代码
- 样式调整
- Zustand store 逻辑
- 分类规则、展示逻辑
- 静态资源

必须重打 APK 的改动：

- `android/` 下的任何原生改动
- `app.json` 里影响原生构建的配置
- 新增需要原生能力的 npm 包
- Kotlin / Java / Gradle 改动
- Expo 插件配置改动

---

## 当前项目常用命令

### 本地开发

```bash
npm run start
```

### Android development 包

```bash
npm run build:android:development
```

### Android production APK

```bash
npm run build:android:production
```

### 发布 development OTA

```bash
npm run update:development
```

### 发布 preview OTA

```bash
npm run update:preview
```

### 发布 production OTA

```bash
npm run update:production
```

---

## 你现在最常用的两条命令

### 重新打一个给自己安装的 APK

```bash
npm run build:android:production
```

### 给已安装的 production APK 推送 OTA

```bash
npm run update:production
```

---

## 一个非常重要的提醒

你现在的 `runtimeVersion` 使用的是：

```json
"runtimeVersion": {
  "policy": "fingerprint"
}
```

这意味着：

- 原生层发生变化时，runtimeVersion 会变化
- 旧 APK 不能接收不兼容的新 OTA
- 这是对的，也是更安全的配置

它能避免“原生不兼容但 OTA 还硬推过去”的问题。

---

## 官方文档参考

这个 README 的流程基于 Expo 官方文档：

- [Expo Updates (SDK 56)](https://docs.expo.dev/versions/v56.0.0/sdk/updates/)
- [EAS Update Get Started](https://docs.expo.dev/eas-update/getting-started/)
- [EAS JSON](https://docs.expo.dev/eas/json/)

如果后面你希望，我还可以继续补两类内容到这个 README：

1. `从零到第一次成功 OTA` 的截图式操作说明
2. `哪些改动能 OTA、哪些改动必须重打包` 的项目内实例清单
