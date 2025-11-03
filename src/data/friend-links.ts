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
				avatar: "https://stellaastra.dpdns.org/favicon/deskicon.png",
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
			{
				title: "WindHolm",
				url: "https://windholm.dpdns.org/",
				avatar:
					"https://q.qlogo.cn/headimg_dl?dst_uin=1323472112&spec=640&img_type=png",
				desc: "追求爱的过程也是爱！",
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
				title: "Graphics And Mixed Environment Symposium",
				url: "https://games-cn.org/",
				avatar: "https://games-cn.org/favicon.ico",
				desc: "计算机图形学与混合现实在线平台",
			},
			{
				title: "TXT转电子书工具",
				url: "https://ebook.deali.cn/",
				avatar: "https://ebook.deali.cn/static/favicon.ico",
				desc: "将TXT文本文件转换为EPUB、MOBI、AZW3等电子书格式",
			},
			{
				title: "Itellyou",
				url: "https://msdn.itellyou.cn/",
				avatar: "https://msdn.itellyou.cn/favicon.ico",
				desc: "原版软件/系统镜像",
			},
			{
				title: "软仓",
				url: "https://www.ruancang.net/",
				avatar: "https://stellaastra.dpdns.org/favicon/youcang.png",
				desc: "软件仓库",
			},
			{
				title: "playtime",
				url: "https://playtime-panorama.superserio.us",
				avatar: "https://stellaastra.dpdns.org/favicon/playtime.webp",
				desc: "一键生成玩过游戏的大图",
			},
		],
	},
];
