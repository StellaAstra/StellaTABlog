import type { AUTO_MODE, DARK_MODE, LIGHT_MODE } from "@constants/constants";

export type SiteConfig = {
	title: string;
	subtitle: string;

	lang:
		| "en"
		| "zh_CN"
		| "zh_TW"
		| "ja"
		| "ko"
		| "es"
		| "th"
		| "vi"
		| "tr"
		| "id";

	themeColor: {
		hue: number;
		fixed: boolean;
	};
	banner: {
		enable: boolean;
		src: string;
		position?: "top" | "center" | "bottom";
		type?: "image" | "video"; // 支持图片或视频格式
		credit: {
			enable: boolean;
			text: string;
			url?: string;
		};
	};
	toc: {
		enable: boolean;
		depth: 1 | 2 | 3;
	};

	favicon: Favicon[];

	clarity: {
		enable: boolean;
		projectId: string;
	};

	musicPlayer: {
		enable: boolean;
	};
};

export type Favicon = {
	src: string;
	theme?: "light" | "dark";
	sizes?: string;
};

export enum LinkPreset {
	Home = 0,
	Archive = 1,
	About = 2,
	Links = 3,
	Images = 4,
}

export type NavBarLink = {
	name: string;
	url: string;
	external?: boolean;
};

export type NavBarConfig = {
	links: (NavBarLink | LinkPreset)[];
};

export type ProfileConfig = {
	avatar?: string;
	name: string;
	bio?: string;
	links: {
		name: string;
		url: string;
		icon: string;
	}[];
};

export type LicenseConfig = {
	enable: boolean;
	name: string;
	url: string;
};

export type LIGHT_DARK_MODE =
	| typeof LIGHT_MODE
	| typeof DARK_MODE
	| typeof AUTO_MODE;

export type BlogPostData = {
	body: string;
	title: string;
	published: Date;
	description: string;
	tags: string[];
	draft?: boolean;
	image?: string;
	category?: string;
	prevTitle?: string;
	prevSlug?: string;
	nextTitle?: string;
	nextSlug?: string;
};

export type ExpressiveCodeConfig = {
	theme: string;
};

/**
 * Pio 看板娘配置
 */
export type PioConfig = {
	enable: boolean; // 是否启用看板娘
	models?: string[]; // 模型文件路径数组
	position?: "left" | "right"; // 看板娘位置
	width?: number; // 看板娘宽度
	height?: number; // 看板娘高度
	mode?: "static" | "fixed" | "draggable"; // 展现模式
	hiddenOnMobile?: boolean; // 是否在移动设备上隐藏
	dialog?: {
		welcome?: string | string[]; // 欢迎词
		touch?: string | string[]; // 触摸提示
		home?: string; // 首页提示
		skin?: [string, string]; // 换装提示 [切换前, 切换后]
		close?: string; // 关闭提示
		link?: string; // 关于链接
		custom?: Array<{
			selector: string; // CSS选择器
			type: "read" | "link"; // 类型
			text?: string; // 自定义文本
		}>;
	};
};
