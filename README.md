# Astro/fuwai博客配置教程

## 前言

新博客站点部署也有2周多时间了，新站的访问量不是很多，但是我发现有人是用我的[fuwai_zyplj](https://github.com/ZyPLJ/fuwai_zyplj)仓库去修改配置然后再部署自己的博客，因为我个人喜欢对博客乱改，所以我这边出一个教程，来讲讲如何部署和我一样的博客。

<font color='red'>本篇文章重点讲解博客配置！！！</font>

为了方便大家使用我的仓库，我特意将原本的仓库改为私有，新建了一个公共的仓库，包括不限于没有我的文章、其他第三方配置。

我的博客只是在原作者[fuwari](https://github.com/saicaca/fuwari)仓库的基础上增加了：

1. 音乐播放器（全新 Manager/Player 分离架构，支持网易云歌单/本地音乐、LRC 歌词同步）
2. 文章置顶固定（原作者仓库PR中的）
3. 评论系统
4. 友链页面
5. 首图支持视频
6. 番组计划页面（Bangumi）—— 展示你在 [bgm.tv](https://bgm.tv) 上的动画、游戏、书籍、音乐收藏
7. 云端图库页面（Images）—— 基于 [StarDots](https://stardots.io) 图床的瀑布流图片展示、Fancybox 灯箱预览、拖拽上传
8. Spine 骨骼动画看板娘 —— 支持 Spine 模型交互、点击动画、随机消息、拖拽移动
9. Live2D Pio 看板娘 —— 经典 Live2D 模型支持，可与 Spine 二选一

如果对于上述功能不感兴趣的可以直接`clone`原作者的仓库。

## 页面基础配置

大部分页面配置都在`src/config.ts`文件中完成,大部分配置都有注释。重点讲解我添加的配置。

### banner图换成视频

将`type`设置为`video`，然后将`src`指向视频`MP4`格式的视频文件，注意视频文件放在 `public/videos/` 目录下。

```ts
banner: {
    enable: true,
    src: "assets/images/banner.jpg", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
    // 如果要使用MP4视频，可以这样配置：
    // src: "/videos/banner-video.mp4", // 视频文件放在 public/videos/ 目录下
    // type: "video", // 设置为视频类型
    position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
    type: "image", // Support 'image' or 'video' format
    credit: {
        enable: false, // Display the credit text of the banner image
        text: "", // Credit text to be displayed
        url: "", // (Optional) URL link to the original artwork or artist's page
    },
},
```

### Microsoft Clarity 分析

`Microsoft Clarity`是微软提供的用于网站流量分析的工具，如果用不上改成false即可，如果想用就需要去官网注册个账号：https://clarity.microsoft.com/

```ts
clarity: {
    enable: false, // 是否启用 Microsoft Clarity 分析
    projectId: "", // Clarity 项目 ID
},
```

### 音乐播放器

音乐播放器采用 Manager/Player 分离架构，支持页面切换时不中断播放。

**开关配置（`src/config.ts`）：**

```ts
musicPlayer: {
    enable: true, // 是否启用音乐播放器
},
```

**详细配置（`src/config/musicConfig.ts`）：**

```ts
export const musicPlayerConfig: MusicPlayerConfig = {
    showInNavbar: true,       // 是否在导航栏显示播放器入口
    mode: "meting",           // 使用方式："meting"（在线歌单）或 "local"（本地音乐）
    volume: 0.7,              // 默认音量 (0-1)
    playMode: "list",         // 播放模式：'list'=列表循环, 'one'=单曲循环, 'random'=随机
    showLyrics: true,         // 是否启用歌词

    // Meting API 配置（mode 为 "meting" 时使用）
    meting: {
        api: "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id&r=:r",
        server: "netease",    // 音乐平台：netease/tencent/kugou
        type: "playlist",     // 类型：song/playlist/album
        id: "893900023",      // 歌单ID - 替换为你自己的
        fallbackApis: [       // 备用 API（主 API 失败时自动降级）
            "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
        ],
    },

    // 本地音乐配置（mode 为 "local" 时使用）
    local: {
        playlist: [
            {
                name: "歌曲名称",
                artist: "歌手",
                url: "/assets/music/song.mp3",
                cover: "/assets/music/cover/cover.webp",
                lrc: "",  // 歌词文件路径（可选）
            },
        ],
    },
};
```

**功能特性：**

- 🎵 支持网易云/QQ音乐/酷狗歌单在线获取
- 📁 支持本地音乐文件播放
- 📝 LRC 歌词同步显示（支持 URL 和内联歌词）
- 🔄 三种播放模式（列表循环/单曲循环/随机）
- 💿 旋转唱片封面动画
- 📋 歌单列表面板
- 🔊 音量控制与静音
- ♿ 全面的 ARIA 无障碍支持
- 🔗 页面切换不中断播放（Swup 兼容）

### 评论系统

`envId`替换成你部署的评论系统的域名或者ip地址。

本博客集成的[快速上手 | Twikoo 文档](https://twikoo.js.org/quick-start.html)评论系统，如果想部署这个评论系统，官网的部署文档还是很详细的，推荐有服务器的人使用`宝塔+Docker`部署。

如果不想用或者部署不好评论系统，修改`enable`为`false`就能关闭评论。

```ts
export const commentConfig = {
	enable: true,
	provider: "twikoo",
	twikoo: {
		envId: "https://api.pljzy.top", // 移除末尾的斜杠
		region: "",
		lang: "zh-CN",
	},
};

```

如果发现评论系统没有出现，可能是`CDN`文件引入的问题，可以在`src/components/Comment.astro`组件中修改`CDN`文件路径。

```ts
// https://twikoo.js.org/frontend.html CDN指南
const script = document.createElement('script');
script.src = 'https://registry.npmmirror.com/twikoo/1.6.44/files/dist/twikoo.min.js' 
```

### 友链页面

`src/content/spec/links.md`友链页面其实就是`md`文件，如果有新的友链，将参考的`div`复制一份修改里面的内容就行了，对于没有评论系统的，也想使用友链，可以将自己仓库的`issues`地址放出来，让其他博主在`github`上体积`issues`来达到友链提交的效果

### 番组计划（Bangumi）

番组计划页面集成了 [Bangumi 番组计划](https://bgm.tv) 的 API，可以展示你在 bgm.tv 上标记的动画、游戏、书籍、音乐等收藏记录。

**配置方法：**

在 `src/config.ts` 中进行配置：

```ts
// 页面开关
pages: {
    bangumi: true, // 是否启用番组页面
},

// Bangumi 配置
bangumi: {
    userId: "your-username", // 你的 Bangumi 用户名，即 bgm.tv 个人页面 URL 中的用户名
    categoryOrder: ["anime", "game", "book", "music"], // 分类 Tab 的显示顺序
},
```

**参数说明：**

| 参数 | 类型 | 说明 |
|:-----|:-----|:-----|
| `pages.bangumi` | `boolean` | 是否启用番组页面，设为 `false` 可关闭 |
| `bangumi.userId` | `string` | 你的 Bangumi 用户名，在 [bgm.tv](https://bgm.tv) 注册后可获取 |
| `bangumi.categoryOrder` | `string[]` | 分类 Tab 的显示顺序，可选值：`"anime"`（动画）、`"game"`（游戏）、`"book"`（书籍）、`"music"`（音乐）、`"real"`（三次元） |

**功能特性：**

- 📺 支持动画、游戏、书籍、音乐、三次元五大分类
- 🏷️ 支持按状态筛选（想看/在看/看过/搁置/抛弃等）
- ⭐ 显示个人评分和标签
- 📄 客户端分页，流畅浏览
- 🌐 支持 10 种语言国际化
- 🎨 自适应亮色/暗色主题

**导航栏配置：**

番组页面默认已添加到导航栏中（`LinkPreset.Bangumi`）。如果不需要，可以在 `config.ts` 的 `links` 数组中注释掉：

```ts
links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    LinkPreset.About,
    LinkPreset.Links,
    // LinkPreset.Bangumi, // 注释掉即可隐藏番组导航
],
```

### 文章置顶

`pinned` 属性设置为true即为置顶显示

```markdown
---
title: ***文章标题
published: 2025-06-21 发布时间
description: 文章简介
image: ./5.png 文章首图,非必须可删除。
tags: [日常,测试] 文章标签 可多个 
category: 记录生活 文章分类
draft: false 
pinned: false 文章是否固定、置顶
---
```

### 云端图库（Images）

图库页面集成了 [StarDots](https://stardots.io) 云存储服务，支持瀑布流图片展示、Fancybox 灯箱预览和图片上传。

**配置方法：**

1. 在 [StarDots](https://dashboard.stardots.io) 注册并获取 API 密钥
2. 在 Cloudflare Pages 环境变量中配置（不在前端暴露密钥）：
   - `STARDOTS_KEY` = 你的 key
   - `STARDOTS_SECRET` = 你的 secret

3. 在 `src/config.ts` 中设置默认空间：

```ts
export const imageLibraryConfig = {
    defaultSpace: "your-space-name", // 默认空间名称
};
```

**导航栏配置：**

图库页面通过 `LinkPreset.Images` 添加到导航栏中，如果不需要可在 `config.ts` 的 `links` 数组中注释掉：

```ts
links: [
    LinkPreset.Home,
    LinkPreset.Archive,
    LinkPreset.About,
    LinkPreset.Links,
    // LinkPreset.Images, // 注释掉即可隐藏图库导航
],
```

**功能特性：**

- 🖼️ 瀑布流布局（2-5 列自适应）
- 🔍 Fancybox 灯箱预览（缩放、全屏、幻灯片、缩略图）
- ☁️ 支持多空间切换
- 📤 拖拽上传 & 文件选择上传（支持 JPG/PNG/GIF/WebP/SVG/AVIF，最大 10MB）
- 📋 上传成功后一键复制链接
- 📄 分页浏览
- 💀 加载骨架屏、错误重试、空状态提示

### Spine 骨骼动画看板娘

Spine 看板娘支持在页面角落展示 Spine 骨骼动画模型，支持交互和拖拽。

**配置方法（`src/config.ts`）：**

```ts
export const spineModelConfig: SpineModelConfig = {
    enable: true, // 启用 Spine 看板娘
    model: {
        path: "/pio/models/Spine/YourModel/model.json", // 模型文件路径
        scale: 1.0,    // 缩放比例
        x: 0,          // X轴偏移
        y: 0,          // Y轴偏移
    },
    position: {
        corner: "bottom-left", // 显示位置：bottom-left/bottom-right/top-left/top-right
        offsetX: 50,   // 水平偏移
        offsetY: 0,    // 垂直偏移
    },
    size: {
        width: 335,    // 容器宽度
        height: 365,   // 容器高度
    },
    interactive: {
        enabled: true,
        clickAnimations: [],         // 点击时随机播放的动画列表
        clickMessages: [             // 点击时随机显示的文字消息
            "嗨，好久不见！",
            "有什么想对我说的吗？💫",
        ],
        messageDisplayTime: 3000,    // 消息显示时间（毫秒）
        idleAnimations: ["idle"],    // 待机动画列表
        idleInterval: 8000,          // 待机动画切换间隔
    },
    responsive: {
        hideOnMobile: true,  // 在移动端隐藏
        mobileBreakpoint: 768,
    },
    zIndex: 1000,
    opacity: 1.0,
};
```

**功能特性：**

- 🎭 支持 Spine 4.2 骨骼动画模型
- 🖱️ 点击播放随机动画 + 显示随机消息
- ✋ 支持鼠标和触摸拖拽移动
- 📱 响应式：移动端可配置隐藏
- 🌐 CDN 加载失败自动回退本地文件
- 🔗 Swup 页面切换不重新加载模型

### Live2D Pio 看板娘

经典的 Live2D 看板娘，与 Spine 看板娘二选一使用。

**配置方法（`src/config.ts`）：**

```ts
export const pioConfig: PioConfig = {
    enable: false, // 启用看板娘（与 Spine 二选一）
    models: ["/pio/models/illyasviel/illyasviel.model.json"], // 模型路径
    position: "left",      // 位置：left/right
    width: 280,            // 宽度
    height: 250,           // 高度
    mode: "draggable",     // 模式：static/fixed/draggable
    hiddenOnMobile: true,  // 移动端隐藏
    dialog: {
        welcome: "Welcome!",          // 欢迎词
        touch: ["你好！", "有什么需要帮助的吗？"], // 触摸提示
        home: "点这里返回首页！",
        skin: ["Want to see my new outfit?", "The new outfit looks great~"],
        close: "下次再见~",
    },
};
```

> **注意：** Spine 看板娘和 Pio 看板娘建议只启用其中一个，同时启用可能造成页面显示冲突。

## 多提一嘴

大部分博客的配置都是在`src/config.ts`文件中完成，文章底部显示的内容在`src/components/Footer.astro`组件中设置。
部署博客的话可以参考：[基于Astro开发的Fuwari静态博客模版配置CICD流程 - ZY知识库](https://blog.pljzy.top/posts/astro/基于astro开发的fuwari静态博客模版配置cicd流程/)--https://blog.pljzy.top/posts/astro/  这篇文章

## 结语

上述就是博主所集成的工具开关，如果还有问题可以在文章下留言。
推荐先去了解原作者的模版：[fuwari](https://github.com/saicaca/fuwari)--https://github.com/saicaca/fuwari。 如果喜欢本博客集成功能可以参考代码添加进去。

# 🍥Fuwari  
![Node.js >= 20](https://img.shields.io/badge/node.js-%3E%3D20-brightgreen) 
![pnpm >= 9](https://img.shields.io/badge/pnpm-%3E%3D9-blue) 
[![DeepWiki](https://img.shields.io/badge/DeepWiki-saicaca%2Ffuwari-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/saicaca/fuwari)
[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari.svg?type=shield&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari?ref=badge_shield&issueType=license)

A static blog template built with [Astro](https://astro.build).

[**🖥️ Live Demo (Vercel)**](https://fuwari.vercel.app)

![Preview Image](https://raw.githubusercontent.com/saicaca/resource/main/fuwari/home.png)

🌏 README in
[**中文**](https://github.com/saicaca/fuwari/blob/main/docs/README.zh-CN.md) /
[**日本語**](https://github.com/saicaca/fuwari/blob/main/docs/README.ja.md) /
[**한국어**](https://github.com/saicaca/fuwari/blob/main/docs/README.ko.md) /
[**Español**](https://github.com/saicaca/fuwari/blob/main/docs/README.es.md) /
[**ไทย**](https://github.com/saicaca/fuwari/blob/main/docs/README.th.md) (Provided by the community and may not always be up-to-date)

## ✨ Features

- [x] Built with [Astro](https://astro.build) and [Tailwind CSS](https://tailwindcss.com)
- [x] Smooth animations and page transitions
- [x] Light / dark mode
- [x] Customizable theme colors & banner
- [x] Responsive design
- [x] Search functionality with [Pagefind](https://pagefind.app/)
- [x] [Markdown extended features](https://github.com/saicaca/fuwari?tab=readme-ov-file#-markdown-extended-syntax)
- [x] Table of contents
- [x] RSS feed

## 🚀 Getting Started

1. Create your blog repository:
    - [Generate a new repository](https://github.com/saicaca/fuwari/generate) from this template or fork this repository.
    - Or run one of the following commands:
       ```sh
       npm create fuwari@latest
       yarn create fuwari
       pnpm create fuwari@latest
       bun create fuwari@latest
       deno run -A npm:create-fuwari@latest
       ```
2. To edit your blog locally, clone your repository, run `pnpm install` to install dependencies.
    - Install [pnpm](https://pnpm.io) `npm install -g pnpm` if you haven't.
3. Edit the config file `src/config.ts` to customize your blog.
4. Run `pnpm new-post <filename>` to create a new post and edit it in `src/content/posts/`.
5. Deploy your blog to Vercel, Netlify, GitHub Pages, etc. following [the guides](https://docs.astro.build/en/guides/deploy/). You need to edit the site configuration in `astro.config.mjs` before deployment.

## 📝 Frontmatter of Posts

```yaml
---
title: My First Blog Post
published: 2023-09-09
description: This is the first post of my new Astro blog.
image: ./cover.jpg
tags: [Foo, Bar]
category: Front-end
draft: false
lang: jp      # Set only if the post's language differs from the site's language in `config.ts`
pinned: false
---
```

## 🧩 Markdown Extended Syntax

In addition to Astro's default support for [GitHub Flavored Markdown](https://github.github.com/gfm/), several extra Markdown features are included:

- Admonitions ([Preview and Usage](https://fuwari.vercel.app/posts/markdown-extended/#admonitions))
- GitHub repository cards ([Preview and Usage](https://fuwari.vercel.app/posts/markdown-extended/#github-repository-cards))
- Enhanced code blocks with Expressive Code ([Preview](https://fuwari.vercel.app/posts/expressive-code/) / [Docs](https://expressive-code.com/))

## ⚡ Commands

All commands are run from the root of the project, from a terminal:

| Command                    | Action                                              |
|:---------------------------|:----------------------------------------------------|
| `pnpm install`             | Installs dependencies                               |
| `pnpm dev`                 | Starts local dev server at `localhost:4321`         |
| `pnpm build`               | Build your production site to `./dist/`             |
| `pnpm preview`             | Preview your build locally, before deploying        |
| `pnpm check`               | Run checks for errors in your code                  |
| `pnpm format`              | Format your code using Biome                        |
| `pnpm new-post <filename>` | Create a new post                                   |
| `pnpm astro ...`           | Run CLI commands like `astro add`, `astro check`    |
| `pnpm astro --help`        | Get help using the Astro CLI                        |

## ✏️ Contributing

Check out the [Contributing Guide](https://github.com/saicaca/fuwari/blob/main/CONTRIBUTING.md) for details on how to contribute to this project.

## 📄 License

This project is licensed under the MIT License.

[![FOSSA Status](https://app.fossa.com/api/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari.svg?type=large&issueType=license)](https://app.fossa.com/projects/git%2Bgithub.com%2Fsaicaca%2Ffuwari?ref=badge_large&issueType=license)
