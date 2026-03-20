import type {
	ExpressiveCodeConfig,
	LicenseConfig,
	NavBarConfig,
	ProfileConfig,
	SiteConfig,
	SpineModelConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

export const siteConfig: SiteConfig = {
	title: "StellaAstra Blog",
	subtitle: "TA Learning",
	lang: "zh_CN", // 'en', 'zh_CN', 'zh_TW', 'ja', 'ko', 'es', 'th'
	themeColor: {
		hue: 250, // Default hue for the theme color, from 0 to 360. e.g. red: 0, teal: 200, cyan: 250, pink: 345
		fixed: false, // Hide the theme color picker for visitors
	},
	banner: {
		enable: true,
		src: "/videos/Cyrene.mp4", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
		// 如果要使用MP4视频，可以这样配置：
		// src: "/videos/banner-video.mp4", // 视频文件放在 public/videos/ 目录下
		// type: "video", // 设置为视频类型
		position: "center", // Equivalent to object-position, only supports 'top', 'center', 'bottom'. 'center' by default
		type: "video", // Support 'image' or 'video' format
		credit: {
			enable: false, // Display the credit text of the banner image
			text: "", // Credit text to be displayed
			url: "", // (Optional) URL link to the original artwork or artist's page
		},
	},
	toc: {
		enable: true, // Display the table of contents on the right side of the post
		depth: 2, // Maximum heading depth to show in the table, from 1 to 3
	},
	favicon: [
		// Leave this array empty to use the default favicon
		{
			src: "/favicon/icon2.png", // Path of the favicon, relative to the /public directory
			theme: "light", // (Optional) Either 'light' or 'dark', set only if you have different favicons for light and dark mode
			sizes: "32x32", // (Optional) Size of the favicon, set only if you have favicons of different sizes
		},
	],
	clarity: {
		enable: true, // 是否启用 Microsoft Clarity 分析
		projectId: "trinn56fhz", // Clarity 项目 ID
	},
	musicPlayer: {
		enable: true, // 是否启用音乐播放器
	},
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		LinkPreset.About,
		LinkPreset.Links,
		LinkPreset.Images, // 如果没有StarDots图床，则注释掉 https://stardots.io/zh/documentation/openapi
		{
			name: "开往🚆",
			url: "https://www.travellings.cn/train.html", // Internal links should not include the base path, as it is automatically added
			external: true, // Show an external link icon and will open in a new tab
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/demo-avatar2.png", // Relative to the /src directory. Relative to the /public directory if it starts with '/'
	name: "StellaAstra",
	bio: "TA Skill learning And share.",
	links: [
		// {
		// 	name: "博客园",
		// 	icon: "fa6-solid:blog", // Visit https://icones.js.org/ for icon codes
		// 	// You will need to install the corresponding icon set if it's not already included
		// 	// `pnpm add @iconify-json/<icon-set-name>`
		// 	url: "https://www.cnblogs.com/ZYPLJ",
		// },
		// {
		// 	name: "GitHub",
		// 	icon: "fa6-brands:github",
		// 	url: "https://github.com/ZyPLJ",
		// },
		{
			name: "GitHub",
			icon: "fa6-brands:github",
			url: "https://github.com/StellaAstra",
		},
		{
			name: "Email",
			icon: "fa6-solid:envelope",
			url: "mailto:1801361622@qq.com",
		},
		{
			name: "bilibili",
			icon: "fa6-brands:bilibili",
			url: "https://space.bilibili.com/38784899?spm_id_from=333.1007.0.0",
		},
		{
			name: "TalkArtist",
			icon: "fa6-brands:adn",
			url: "https://talkartist.cn/user/1942558720317259776",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const commentConfig = {
	enable: false,
	provider: "twikoo",
	twikoo: {
		envId: "https://api.pljzy.top", // 移除末尾的斜杠
		region: "",
		lang: "zh-CN",
	},
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	// Note: Some styles (such as background color) are being overridden, see the astro.config.mjs file.
	// Please select a dark theme, as this blog theme currently only supports dark background color
	theme: "github-dark",
};

export const imageLibraryConfig = {
	// API 密钥已移至 Cloudflare Pages 环境变量（STARDOTS_KEY / STARDOTS_SECRET），不在前端暴露
	// 请在 Cloudflare Dashboard → Pages → 项目设置 → Environment Variables 中配置：
	//   STARDOTS_KEY = 你的key
	//   STARDOTS_SECRET = 你的secret
	// 获取地址: https://dashboard.stardots.io
	defaultSpace: "stella1028", // 默认空间名称
};

// Pio 看板娘配置

// Spine 看板娘配置
export const spineModelConfig: SpineModelConfig = {
	enable: true, // 启用 Spine 看板娘
	model: {
		// Spine模型文件路径
		path: "/pio/models/Spine/Cyrene/xilian.json",
		scale: 1.0, // 模型缩放比例
		x: 0, // X轴偏移
		y: 0, // Y轴偏移
	},
	position: {
		// 显示位置 bottom-left，bottom-right，top-left，top-right，注意：在右下角可能会挡住返回顶部按钮
		corner: "bottom-left",
		offsetX: 50, // 距离右边缘0px
		offsetY: 0, // 距离底部0px
	},
	size: {
		width: 335, // 容器宽度
		height: 365, // 容器高度
	},
	interactive: {
		enabled: true, // 启用交互功能
		clickAnimations: [
			// "emoji_0",
			// "emoji_1",
			// "emoji_2",
			// "emoji_3",
			// "emoji_4",
			// "emoji_5",
			// "emoji_6",
		], // 点击时随机播放的动画列表
		clickMessages: [
			"嗨，好久不见！我是昔涟~",
			"这一次，该从哪一页讲起呢？✨",
			"这一定是个不同以往的浪漫故事……🌟",
			"你也是这么想的，对吧？",
			"有什么想对我说的吗？💫",
			"流星划过夜空，生命的长河荡起涟漪，闪烁十三种光彩。🚀",
			"你要栽下记忆的种子，让往昔的花朵在明日绽放。⭐",
			"然后，一起写下不同以往的诗篇吧♪💖",
		], // 点击时随机显示的文字消息
		messageDisplayTime: 3000, // 文字显示时间（毫秒）
		idleAnimations: ["idle"], // 待机动画列表
		idleInterval: 8000, // 待机动画切换间隔（8秒）
	},
	responsive: {
		hideOnMobile: true, // 在移动端隐藏
		mobileBreakpoint: 768, // 移动端断点
	},
	zIndex: 1000, // 层级
	opacity: 1.0, // 完全不透明
};

export const pioConfig: import("./types/config").PioConfig = {
	enable: false, // 启用看板娘
	models: ["/pio/models/illyasviel/illyasviel.model.json"], // 默认模型路径
	position: "left", // 默认位置在右侧
	width: 280, // 默认宽度
	height: 250, // 默认高度
	mode: "draggable", // 默认为可拖拽模式
	hiddenOnMobile: true, // 默认在移动设备上隐藏
	dialog: {
		welcome: "Welcome to Stella's TA Blog!", // 欢迎词
		touch: [
			"你好！我是伊莉雅丝菲尔·冯·爱因兹贝伦~",
			"有什么需要帮助的吗？",
			"今天天气真不错呢！",
			"要不要一起玩游戏？",
			"记得按时休息哦！",
			"今天也要加油哦！✨",
			"想要一起去看星空吗？🌟",
			"记得要好好休息呢~",
			"有什么想对我说的吗？💫",
			"让我们一起探索未知的世界吧！🚀",
			"每一颗星星都有自己的故事~⭐",
			"希望能带给你温暖和快乐！💖",
		], // 触摸提示
		home: "点这里返回首页！", // 首页提示
		skin: ["Want to see my new outfit?", "The new outfit looks great~"], // 换装提示
		close: "下次再见~", // 关闭提示
		link: "https://space.bilibili.com/38784899?spm_id_from=333.1007.0.0", // 关于链接
	},
};
