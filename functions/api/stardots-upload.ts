// Cloudflare Pages Function: 代理 StarDots 文件上传 API
// 路径: /api/stardots-upload

interface Env {
	STARDOTS_KEY: string;
	STARDOTS_SECRET: string;
}

// MD5 哈希计算
function md5(input: string): string {
	function safeAdd(x: number, y: number): number {
		const lsw = (x & 0xffff) + (y & 0xffff);
		const msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xffff);
	}
	function bitRotateLeft(num: number, cnt: number): number {
		return (num << cnt) | (num >>> (32 - cnt));
	}
	function md5cmn(q: number, a: number, b: number, x: number, s: number, t: number): number {
		return safeAdd(bitRotateLeft(safeAdd(safeAdd(a, q), safeAdd(x, t)), s), b);
	}
	function md5ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
		return md5cmn((b & c) | (~b & d), a, b, x, s, t);
	}
	function md5gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
		return md5cmn((b & d) | (c & ~d), a, b, x, s, t);
	}
	function md5hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
		return md5cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function md5ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
		return md5cmn(c ^ (b | ~d), a, b, x, s, t);
	}
	function binlMD5(x: number[], len: number): number[] {
		x[len >> 5] |= 0x80 << len % 32;
		x[(((len + 64) >>> 9) << 4) + 14] = len;
		let a = 1732584193, b = -271733879, c = -1732584194, d = 271733878;
		for (let i = 0; i < x.length; i += 16) {
			const olda = a, oldb = b, oldc = c, oldd = d;
			a = md5ff(a, b, c, d, x[i], 7, -680876936);
			d = md5ff(d, a, b, c, x[i + 1], 12, -389564586);
			c = md5ff(c, d, a, b, x[i + 2], 17, 606105819);
			b = md5ff(b, c, d, a, x[i + 3], 22, -1044525330);
			a = md5ff(a, b, c, d, x[i + 4], 7, -176418897);
			d = md5ff(d, a, b, c, x[i + 5], 12, 1200080426);
			c = md5ff(c, d, a, b, x[i + 6], 17, -1473231341);
			b = md5ff(b, c, d, a, x[i + 7], 22, -45705983);
			a = md5ff(a, b, c, d, x[i + 8], 7, 1770035416);
			d = md5ff(d, a, b, c, x[i + 9], 12, -1958414417);
			c = md5ff(c, d, a, b, x[i + 10], 17, -42063);
			b = md5ff(b, c, d, a, x[i + 11], 22, -1990404162);
			a = md5ff(a, b, c, d, x[i + 12], 7, 1804603682);
			d = md5ff(d, a, b, c, x[i + 13], 12, -40341101);
			c = md5ff(c, d, a, b, x[i + 14], 17, -1502002290);
			b = md5ff(b, c, d, a, x[i + 15], 22, 1236535329);
			a = md5gg(a, b, c, d, x[i + 1], 5, -165796510);
			d = md5gg(d, a, b, c, x[i + 6], 9, -1069501632);
			c = md5gg(c, d, a, b, x[i + 11], 14, 643717713);
			b = md5gg(b, c, d, a, x[i], 20, -373897302);
			a = md5gg(a, b, c, d, x[i + 5], 5, -701558691);
			d = md5gg(d, a, b, c, x[i + 10], 9, 38016083);
			c = md5gg(c, d, a, b, x[i + 15], 14, -660478335);
			b = md5gg(b, c, d, a, x[i + 4], 20, -405537848);
			a = md5gg(a, b, c, d, x[i + 9], 5, 568446438);
			d = md5gg(d, a, b, c, x[i + 14], 9, -1019803690);
			c = md5gg(c, d, a, b, x[i + 3], 14, -187363961);
			b = md5gg(b, c, d, a, x[i + 8], 20, 1163531501);
			a = md5gg(a, b, c, d, x[i + 13], 5, -1444681467);
			d = md5gg(d, a, b, c, x[i + 2], 9, -51403784);
			c = md5gg(c, d, a, b, x[i + 7], 14, 1735328473);
			b = md5gg(b, c, d, a, x[i + 12], 20, -1926607734);
			a = md5hh(a, b, c, d, x[i + 5], 4, -378558);
			d = md5hh(d, a, b, c, x[i + 8], 11, -2022574463);
			c = md5hh(c, d, a, b, x[i + 11], 16, 1839030562);
			b = md5hh(b, c, d, a, x[i + 14], 23, -35309556);
			a = md5hh(a, b, c, d, x[i + 1], 4, -1530992060);
			d = md5hh(d, a, b, c, x[i + 4], 11, 1272893353);
			c = md5hh(c, d, a, b, x[i + 7], 16, -155497632);
			b = md5hh(b, c, d, a, x[i + 10], 23, -1094730640);
			a = md5hh(a, b, c, d, x[i + 13], 4, 681279174);
			d = md5hh(d, a, b, c, x[i], 11, -358537222);
			c = md5hh(c, d, a, b, x[i + 3], 16, -722521979);
			b = md5hh(b, c, d, a, x[i + 6], 23, 76029189);
			a = md5hh(a, b, c, d, x[i + 9], 4, -640364487);
			d = md5hh(d, a, b, c, x[i + 12], 11, -421815835);
			c = md5hh(c, d, a, b, x[i + 15], 16, 530742520);
			b = md5hh(b, c, d, a, x[i + 2], 23, -995338651);
			a = md5ii(a, b, c, d, x[i], 6, -198630844);
			d = md5ii(d, a, b, c, x[i + 7], 10, 1126891415);
			c = md5ii(c, d, a, b, x[i + 14], 15, -1416354905);
			b = md5ii(b, c, d, a, x[i + 5], 21, -57434055);
			a = md5ii(a, b, c, d, x[i + 12], 6, 1700485571);
			d = md5ii(d, a, b, c, x[i + 3], 10, -1894986606);
			c = md5ii(c, d, a, b, x[i + 10], 15, -1051523);
			b = md5ii(b, c, d, a, x[i + 1], 21, -2054922799);
			a = md5ii(a, b, c, d, x[i + 8], 6, 1873313359);
			d = md5ii(d, a, b, c, x[i + 15], 10, -30611744);
			c = md5ii(c, d, a, b, x[i + 6], 15, -1560198380);
			b = md5ii(b, c, d, a, x[i + 13], 21, 1309151649);
			a = md5ii(a, b, c, d, x[i + 4], 6, -145523070);
			d = md5ii(d, a, b, c, x[i + 11], 10, -1120210379);
			c = md5ii(c, d, a, b, x[i + 2], 15, 718787259);
			b = md5ii(b, c, d, a, x[i + 9], 21, -343485551);
			a = safeAdd(a, olda); b = safeAdd(b, oldb); c = safeAdd(c, oldc); d = safeAdd(d, oldd);
		}
		return [a, b, c, d];
	}
	function str2binl(str: string): number[] {
		const bin: number[] = [];
		const mask = (1 << 8) - 1;
		for (let i = 0; i < str.length * 8; i += 8) {
			bin[i >> 5] |= (str.charCodeAt(i / 8) & mask) << i % 32;
		}
		return bin;
	}
	function binl2hex(binarray: number[]): string {
		const hexTab = "0123456789abcdef";
		let str = "";
		for (let i = 0; i < binarray.length * 4; i++) {
			str += hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8 + 4)) & 0xf) +
				hexTab.charAt((binarray[i >> 2] >> ((i % 4) * 8)) & 0xf);
		}
		return str;
	}
	function utf8Encode(str: string): string {
		return unescape(encodeURIComponent(str));
	}
	const encoded = utf8Encode(input);
	return binl2hex(binlMD5(str2binl(encoded), encoded.length * 8));
}

function generateNonce(length = 16): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

function getStardotsSignHeaders(key: string, secret: string): Record<string, string> {
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const nonce = generateNonce();
	const needSignStr = `${timestamp}|${secret}|${nonce}`;
	const sign = md5(needSignStr).toUpperCase();

	// 注意：上传文件时不要设置 Content-Type，让 fetch 自动为 FormData 设置正确的 multipart/form-data boundary
	return {
		"x-stardots-timestamp": timestamp,
		"x-stardots-nonce": nonce,
		"x-stardots-key": key,
		"x-stardots-sign": sign,
	};
}

export const onRequest: PagesFunction<Env> = async (context) => {
	const { env, request } = context;

	// 处理 CORS 预检请求
	if (request.method === "OPTIONS") {
		return new Response(null, {
			status: 204,
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Methods": "PUT, POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Max-Age": "86400",
			},
		});
	}

	if (request.method !== "POST") {
		return new Response(
			JSON.stringify({ success: false, message: "仅支持 POST 请求" }),
			{ status: 405, headers: { "Content-Type": "application/json" } }
		);
	}

	const key = env.STARDOTS_KEY;
	const secret = env.STARDOTS_SECRET;

	if (!key || !secret) {
		return new Response(
			JSON.stringify({ success: false, message: "服务端未配置 API 密钥" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}

	try {
		// 读取前端发送的 FormData
		const formData = await request.formData();
		const file = formData.get("file");
		const space = formData.get("space");

		if (!file || !(file instanceof File)) {
			return new Response(
				JSON.stringify({ success: false, message: "缺少文件" }),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}

		// 构建转发给 Stardots 的 FormData
		const uploadFormData = new FormData();
		uploadFormData.append("file", file);
		if (space) {
			uploadFormData.append("space", space.toString());
		}

		const headers = getStardotsSignHeaders(key, secret);

		const response = await fetch("https://api.stardots.io/openapi/file/upload", {
			method: "PUT",
			headers: headers,
			body: uploadFormData,
			redirect: "manual", // 不自动跟随重定向，以便检测 API 是否失效
		});

		// 如果被重定向（302 等），说明 API 端点可能已失效
		if (response.status >= 300 && response.status < 400) {
			const location = response.headers.get("Location") || "unknown";
			return new Response(
				JSON.stringify({
					success: false,
					message: `API 端点已失效 (${response.status} → ${location})，请检查 Stardots API 地址是否变更`,
				}),
				{ status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
			);
		}

		const data = await response.text();

		// 检测是否返回了 HTML 而不是 JSON（API 失效的典型表现）
		if (data.trimStart().startsWith("<!DOCTYPE") || data.trimStart().startsWith("<html")) {
			return new Response(
				JSON.stringify({
					success: false,
					message: "API 返回了 HTML 页面而非 JSON，端点可能已失效或地址已变更",
				}),
				{ status: 502, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } }
			);
		}

		return new Response(data, {
			status: response.status,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (err) {
		return new Response(
			JSON.stringify({ success: false, message: "代理上传失败: " + (err instanceof Error ? err.message : "未知错误") }),
			{ status: 502, headers: { "Content-Type": "application/json" } }
		);
	}
};
