export type FriendLinkItem = {
	title: string;
	url: string;
	avatar: string;
	desc: string;
};

export type FriendLinkSection = {
	title: string;
	items: FriendLinkItem[];
};

export const friendLinkSections: FriendLinkSection[] = [
	{
		title: "🌟 个人链接",
		items: [
			{
				title: "知乎",
				url: "https://www.zhihu.com/people/yuan-cong-yu-chu",
				avatar: "https://pic3.zhimg.com/20d4b0980181cda8b307980806f4b110.png",
				desc: "技术分享与学习交流的园地",
			},
			{
				title: "GitHub",
				url: "https://github.com/StellaAstra",
				avatar:
					"https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
				desc: "代码托管与开源项目分享",
			},
			{
				title: "bilibili",
				url: "https://space.bilibili.com/38784899?spm_id_from=333.1007.0.0",
				avatar: "https://www.bilibili.com/favicon.ico",
				desc: "记录技术成长的足迹",
			},
			{
				title: "Talk Artist",
				url: "https://talkartist.cn/user/1942558720317259776",
				avatar: "https://talkartist.cn/favicon.ico",
				desc: "TA交流的小天地",
			},
			{
				title: "n0va",
				url: "https://n0va.mihoyo.com/#/",
				avatar: "https://stellaastra.dpdns.org/favicon/N0va.png",
				desc: "人工桌面",
			},
			{
				title: "yoyo鹿鸣_Lumi",
				url: "https://space.bilibili.com/488836173?spm_id_from=333.337.0.0",
				avatar: "https://stellaastra.dpdns.org/favicon/Yoyo_lumi.png",
				desc: "参与过的项目",
			},
		],
	},
	{
		title: "🧍 友情链接",
		items: [
			{
				title: "yousen的博客",
				url: "http://www.yousen1.top",
				avatar: "https://stellaastra.dpdns.org/favicon/yousenblog.jpg",
				desc: "机械结构设计师",
			},
			{
				title: "Fox_dream的博客",
				url: "https://moretoil.github.io/",
				avatar: "https://moretoil.github.io/images/head.jpg",
				desc: "Fox_dream の 小站",
			},
		],
	},
	{
		title: "🛠️ 实用工具",
		items: [
			{
				title: "图片转Ico",
				url: "https://ico.pljzy.top",
				avatar: "https://ico.pljzy.top/logo.ico",
				desc: "在线png、jpg、jpeg图片转Ico工具",
			},
			{
				title: "文件快递柜",
				url: "https://share.pljzy.top",
				avatar: "https://share.pljzy.top/assets/logo_small.png",
				desc: "FileCodeBox, 文件快递柜, 口令传送箱, 匿名口令分享文本, 文件",
			},
			{
				title: "TXT转电子书工具",
				url: "https://ebook.deali.cn/",
				avatar: "https://ebook.deali.cn/static/favicon.ico",
				desc: "将TXT文本文件转换为EPUB、MOBI、AZW3等电子书格式",
			},
		],
	},
];
