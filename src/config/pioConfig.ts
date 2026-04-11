import type { Live2DModelConfig, SpineModelConfig } from "../types/config";

// Spine 看板娘配置
export const spineModelConfig: SpineModelConfig = {
	// Spine 看板娘开关
	enable: true,

	// Spine模型配置
	model: {
		// Spine模型文件路径
		path: "/pio/models/spine/Cyrene/xilian.json",
		// 模型缩放比例
		scale: 1.0,
		// X轴偏移
		x: 0,
		// Y轴偏移
		y: 0,
	},

	// 位置配置
	position: {
		// 显示位置 bottom-left，bottom-right，top-left，top-right，注意：在右下角可能会挡住返回顶部按钮
		corner: "bottom-left",
		// 距离边缘0px
		offsetX: 50,
		// 距离下边缘0px
		offsetY: 0,
	},

	// 尺寸配置
	size: {
		// 容器宽度
		width: 335,
		// 容器高度
		height: 365,
	},

	// 交互配置
	interactive: {
		// 交互功能开关
		enabled: true,
		// 点击时随机播放的动画列表
		clickAnimations: [
			// "emoji_0",
			// "emoji_1",
			// "emoji_2",
			// "emoji_3",
			// "emoji_4",
			// "emoji_5",
			// "emoji_6",
		],
		// 点击时随机显示的文字消息
		clickMessages: [
			"嗨，好久不见！我是昔涟~",
			"这一次，该从哪一页讲起呢？✨",
			"这一定是个不同以往的浪漫故事……🌟",
			"你也是这么想的，对吧？",
			"有什么想对我说的吗？💫",
			"流星划过夜空，生命的长河荡起涟漪，闪烁十三种光彩。🚀",
			"你要栽下记忆的种子，让往昔的花朵在明日绽放。⭐",
			"然后，一起写下不同以往的诗篇吧♪💖",
		],
		// 文字显示时间（毫秒）
		messageDisplayTime: 3000,
		// 待机动画列表
		idleAnimations: ["idle"], //"idle", "emoji_0", "emoji_1", "emoji_3", "emoji_4"
		// 待机动画切换间隔（毫秒）
		idleInterval: 8000,
	},

	// 响应式配置
	responsive: {
		// 在移动端隐藏
		hideOnMobile: true,
		// 移动端断点
		mobileBreakpoint: 768,
	},

	// 层级
	zIndex: 1000, // 层级

	// 透明度
	opacity: 1.0,
};

// Live2D 看板娘配置
export const live2dModelConfig: Live2DModelConfig = {
	// Live2D 看板娘开关
	enable: false,
	// Live2D模型配置
	model: {
		// Live2D模型文件路径
		path: "/pio/models/live2d/illyasviel/illyasviel.model.json",
		// path: "/pio/models/live2d/illyasviel/illyasviel.model.json",
	},

	// 位置配置
	position: {
		// 显示位置 bottom-left，bottom-right，top-left，top-right，注意：在右下角可能会挡住返回顶部按钮
		corner: "bottom-left",
		// 距离边缘0px
		offsetX: 0,
		// 距离下边缘0px
		offsetY: 0,
	},

	// 尺寸配置
	size: {
		// 容器宽度
		width: 280,
		// 容器高度
		height: 255,
	},

	// 交互配置
	interactive: {
		// 交互功能开关
		enabled: true,
		// 点击时随机显示的文字消息，motions 和 expressions 将从模型 JSON 文件中自动读取
		clickMessages: [
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
		],
		// 随机显示的文字消息显示时间（毫秒）
		messageDisplayTime: 3000,
	},

	// 响应式配置
	responsive: {
		// 在移动端隐藏
		hideOnMobile: true,
		// 移动端断点
		mobileBreakpoint: 768,
	},
};
