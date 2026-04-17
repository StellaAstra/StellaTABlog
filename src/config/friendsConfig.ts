import type { FriendLink, FriendsPageConfig } from "../types/config";

// 可以在src/content/spec/friends.md中编写友链页面下方的自定义内容

// 友链页面配置
export const friendsPageConfig: FriendsPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// 是否显示底部自定义内容（friends.mdx 中的内容）
	showCustomContent: true,

	// 是否显示评论区，需要先在commentConfig.ts启用评论系统
	showComment: true,

	// 是否开启随机排序配置，如果开启，就会忽略权重，构建时进行一次随机排序
	randomizeSort: false,
};

// 友链配置
export const friendsConfig: FriendLink[] = [
	{
		title: "Stella’s TA Skills Share Blog",
		imgurl: "https://stellaastra.dpdns.org/favicon/icon2.png",
		desc: "一探索图形技术与分享的平台",
		siteurl: "https://stellaastra.dpdns.org/",
		tags: ["Blog"],
		weight: 100, // 权重，数字越大排序越靠前
		enabled: true, // 是否启用
	},

	{
		title: "知乎",
		imgurl: "https://pic3.zhimg.com/20d4b0980181cda8b307980806f4b110.png",
		desc: "技术分享与学习交流的园地",
		siteurl: "https://www.zhihu.com/people/yuan-cong-yu-chu",
		tags: ["个人链接"],
		weight: 99,
		enabled: true,
	},
	{
		title: "GitHub",
		imgurl:
			"https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
		desc: "代码托管与开源项目分享",
		siteurl: "https://github.com/StellaAstra",
		tags: ["个人链接"],
		weight: 98,
		enabled: true,
	},
	{
		title: "bilibili",
		imgurl: "https://www.bilibili.com/favicon.ico",
		desc: "记录技术成长的足迹",
		siteurl: "https://space.bilibili.com/38784899?spm_id_from=333.1007.0.0",
		tags: ["个人链接"],
		weight: 97,
		enabled: true,
	},
	{
		title: "Talk Artist",
		imgurl: "https://talkartist.cn/favicon.ico",
		desc: "TA交流的小天地",
		siteurl: "https://talkartist.cn/user/1942558720317259776",
		tags: ["个人链接"],
		weight: 96,
		enabled: true,
	},

	{
		title: "Fox_dream的博客",
		imgurl: "https://moretoil.github.io/avatar/head.jpg",
		desc: "Fox_dream の 小站",
		siteurl: "https://moretoil.github.io/",
		tags: ["Blog"],
		weight: 75,
		enabled: true,
	},
	{
		title: "yousen的博客",
		imgurl: "https://stellaastra.dpdns.org/favicon/yousenblog.jpg",
		desc: "机械结构设计师",
		siteurl: "http://www.yousen1.top",
		tags: ["Blog"],
		weight: 74,
		enabled: true,
	},
	{
		title: "WindHolm",
		imgurl:
			"https://q.qlogo.cn/headimg_dl?dst_uin=1323472112&spec=640&img_type=png",
		desc: "追求爱的过程也是爱！",
		siteurl: "https://windholm.dpdns.org/",
		tags: ["Blog"],
		weight: 73,
		enabled: true,
	},
	{
		title: "流萤白沙のBlog",
		imgurl: "https://img.lyrashore.com/img/2025/03/favicon.webp",
		desc: "学习-记录-分享",
		siteurl: "https://lyrashore.com",
		tags: ["Blog"],
		weight: 72,
		enabled: true,
	},

	{
		title: "yoyo鹿鸣_Lumi",
		imgurl: "https://stellaastra.dpdns.org/favicon/Yoyo_lumi.png",
		desc: "我是鹿鸣，期待和你的每次相见> <",
		siteurl: "https://space.bilibili.com/488836173?spm_id_from=333.337.0.0",
		tags: ["参与过的项目"],
		weight: 50,
		enabled: true,
	},
	{
		title: "n0va",
		imgurl: "https://stellaastra.dpdns.org/favicon/deskicon.png",
		desc: "人工桌面",
		siteurl: "https://n0va.mihoyo.com/#/",
		tags: ["参与过的项目"],
		weight: 49,
		enabled: true,
	},
	{
		title: "金铲铲之战",
		imgurl: "https://stellaastra.dpdns.org/favicon/JKLogo.png",
		desc: "符文大陆的冒险",
		siteurl: "https://jcc.qq.com/#/index",
		tags: ["参与过的项目"],
		weight: 48,
		enabled: true,
	},

	{
		title: "图片转Ico",
		imgurl: "https://ico.pljzy.top/logo.ico",
		desc: "在线png、jpg、jpeg图片转Ico工具",
		siteurl: "https://ico.pljzy.top",
		tags: ["实用工具"],
		weight: 25,
		enabled: true,
	},
	{
		title: "Itellyou",
		imgurl: "https://msdn.itellyou.cn/favicon.ico",
		desc: "原版软件/系统镜像",
		siteurl: "https://msdn.itellyou.cn/",
		tags: ["实用工具"],
		weight: 24,
		enabled: true,
	},
	{
		title: "软仓",
		imgurl: "https://stellaastra.dpdns.org/favicon/ruancang.png",
		desc: "软件仓库",
		siteurl: "https://www.ruancang.net/",
		tags: ["实用工具"],
		weight: 23,
		enabled: true,
	},
	{
		title: "playtime",
		imgurl: "https://stellaastra.dpdns.org/favicon/playtime.webp",
		desc: "一键生成玩过游戏的大图",
		siteurl: "https://playtime-panorama.superserio.us",
		tags: ["实用工具"],
		weight: 22,
		enabled: true,
	},

	// {
	// 	title: "Astro",
	// 	imgurl: "https://avatars.githubusercontent.com/u/44914786?v=4&s=640",
	// 	desc: "The web framework for content-driven websites. ⭐️ Star to support our work!",
	// 	siteurl: "https://github.com/withastro/astro",
	// 	tags: ["Framework"],
	// 	weight: 1,
	// 	enabled: true,
	// },
];

// 获取启用的友链并进行排序
export const getEnabledFriends = (): FriendLink[] => {
	const friends = friendsConfig.filter((friend) => friend.enabled);

	if (friendsPageConfig.randomizeSort) {
		return friends.sort(() => Math.random() - 0.5);
	}

	return friends.sort((a, b) => b.weight - a.weight);
};
