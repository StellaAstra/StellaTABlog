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
		enable: true,
		mode: "meting",
		volume: 0.7,
		playMode: "random",
		showLyrics: true,
		meting: {
			api: "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&r=:r",
			server: "netease",
			type: "playlist",
			id: "893900023", // Replace with your NetEase Cloud Music playlist ID
			fallbackApis: [
				"https://meting.qjqq.cn/?server=:server&type=:type&id=:id&r=:r",
			],
		},
		local: {
			playlist: [
				{
					name: "够爱（翻自 曾沛慈）",
					artist: "是我呀卡司宝贝",
					url: "https://music.163.com/song/media/outer/url?id=1846812463.mp3",
					cover:
						"http://p2.music.126.net/nQqUGffgtOv5PjfwqgVJyw==/109951166562832347.jpg?param=300x300",
					lrc: "[00:00.000] 作词 : 无[00:01.000] 作曲 : 无[00:14.056]我穿梭金星 木星 水星 火星 土星 追寻[00:17.051]追寻你 时间滴滴答滴答答的声音[00:42.507]指头还残留 你为我[00:47.510]擦的指甲油 没想透[00:54.764]你好像说过 你和我[00:59.520]会不会有以后[01:04.263]世界一直一直变[01:06.264]地球不停的转动[01:08.260]在你的时空 我从未退缩懦弱[01:16.760]当我靠在你耳朵[01:18.952]只想轻轻对你说[01:21.203]我的温柔 只想让你都拥有[01:28.960]我的爱 只能够[01:31.457]让你一个人 独自拥有",
				},
				{
					name: "老人と海",
					artist: "ヨルシカ",
					url: "http://music.163.com/song/media/outer/url?id=2112843978.mp3",
					cover:
						"http://p1.music.126.net/5aHcGADR5i6biE5TSqf_aQ==/109951166295171725.jpg?param=300x300",
				},
				{
					name: "让风告诉你",
					artist: "花玲,喵☆酱,宴宁,kinsen",
					url: "http://music.163.com/song/media/outer/url?id=1818031620.mp3",
					cover:
						"http://p2.music.126.net/pYKBjkB6FoNh5Yxkb9uCbw==/109951165698369632.jpg?param=300x300",
				},
				{
					name: "偏爱",
					artist: "张芸京",
					url: "http://music.163.com/song/media/outer/url?id=5238992.mp3",
					cover:
						"http://p2.music.126.net/a4KYp477snGHe3ZyjVpe1w==/109951165351505570.jpg?param=300x300",
				},
				{
					name: "主角",
					artist: "沉画文阁,马里奥,曲杨,draceana",
					url: "http://music.163.com/song/media/outer/url?id=2161503002.mp3",
					cover:
						"http://p1.music.126.net/GydBHMkoBHmIAszwTmixVg==/109951169632692426.jpg?param=300x300",
				},
				{
					name: "Wings！You Are My Future",
					artist: "Wthegg",
					url: "http://music.163.com/song/media/outer/url?id=1427978795.mp3",
					cover:
						"http://p1.music.126.net/VYrOp9s17r8DWvKKwkmWIw==/109951164765426714.jpg?param=300x300",
				},
				{
					name: "A Shadow in My Heart",
					artist: "Koi no Koe",
					url: "http://music.163.com/song/media/outer/url?id=2749544447.mp3",
					cover:
						"http://p1.music.126.net/VYrOp9s17r8DWvKKwkmWIw==/109951164765426714.jpg?param=300x300",
				},
				{
					name: "花降らし",
					artist: "Winky诗",
					url: "http://music.163.com/song/media/outer/url?id=422790932.mp3",
					cover:
						"http://p1.music.126.net/pwpTt5raiqkgGPcqX05HQw==/109951163292374223.jpg?param=300x300",
				},
				{
					name: "山鬼",
					artist: "Wthegg",
					url: "http://music.163.com/song/media/outer/url?id=28496172.mp3",
					cover:
						"http://p2.music.126.net/gJ1tIJ7s7g_d7vheVDBkjA==/109951164503300910.jpg?param=300x300",
				},
				{
					name: "恋音と雨空",
					artist: "AAA",
					url: "http://music.163.com/song/media/outer/url?id=1905677176.mp3",
					cover:
						"http://p2.music.126.net/pi4CfJheRtnW5pRwrESyUg==/109951166779457794.jpg?param=300x300",
				},
				{
					name: "春日影",
					artist: "CRYCHIC",
					url: "http://music.163.com/song/media/outer/url?id=2149887904.mp3",
					cover:
						"http://p2.music.126.net/ftPKFERCtl52kJ3YAQ9jFw==/109951170517222756.jpg?param=300x300",
				},
				{
					name: "Harmonious",
					artist: "Binary Haze Interactive / Mili",
					url: "http://music.163.com/song/media/outer/url?id=1850441824.mp3",
					cover:
						"http://p2.music.126.net/cCXt0Rbny_HPiEKLNmA6Fw==/109951166057712738.jpg?param=300x300",
				},
				{
					name: "防晒",
					artist: "多多poi",
					url: "http://music.163.com/song/media/outer/url?id=1472581969.mp3",
					cover:
						"http://p2.music.126.net/dpJ8BbO0Al39b9UVt6hrjg==/109951165253010590.jpg?param=300x300",
				},
				{
					name: "ZERO",
					artist: "小林啓樹",
					url: "http://music.163.com/song/media/outer/url?id=28762669.mp3",
					cover:
						"http://p2.music.126.net/Zn7vc55s3L4OZVeQ0q17oA==/6023124697610248.jpg?param=300x300",
				},
				{
					name: "酸的。",
					artist: "ChiliChill",
					url: "http://music.163.com/song/media/outer/url?id=2048823150.mp3",
					cover:
						"http://p2.music.126.net/FAliF-dGwVxp-pbE6ZcK7A==/109951168624114464.jpg?param=300x300",
				},
				{
					name: "独角",
					artist: "UnicornPhantom",
					url: "http://music.163.com/song/media/outer/url?id=1934213146.mp3",
					cover:
						"http://p2.music.126.net/1HOpmf61G-QHQmm5xIv9rg==/109951167230524234.jpg?param=300x300",
				},
				{
					name: "眼镜的葬礼",
					artist: "ChiliChill",
					url: "http://music.163.com/song/media/outer/url?id=2038565489.mp3",
					cover:
						"http://p2.music.126.net/9CUSX5TMwwcWzCIHizA_Sg==/109951168540374251.jpg?param=300x300",
				},
			],
		},
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
