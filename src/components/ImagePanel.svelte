<script lang="ts">
import Icon from "@iconify/svelte";
import { formatDateI18n } from "@utils/date-utils";
import { onMount } from "svelte";
import { imageLibraryConfig } from "../config";

// StarDots 文件数据接口
interface FileData {
	name: string;
	byteSize: number;
	size: string;
	uploadedAt: number;
	url: string;
}

// StarDots 空间数据接口
interface Space {
	name: string;
	public: boolean;
	createdAt: number;
	fileCount: number;
}

// StarDots 通用 API 响应
interface StardotsResponse<T> {
	code: number;
	message: string;
	requestId: string;
	success: boolean;
	ts: number;
	data: T;
}

// 文件列表响应的 data 结构
interface FileListData {
	page: number;
	pageSize: number;
	totalCount: number;
	list: FileData[];
}

// 上传文件项接口
interface UploadItem {
	id: string;
	file: File;
	name: string;
	size: number;
	progress: number;
	status: 'pending' | 'uploading' | 'success' | 'error';
	errorMsg?: string;
	url?: string;
	previewUrl?: string;
}

let images: FileData[] = [];
let spaces: Space[] = [];
let currentSpace: Space | null = null;
let currentPage = 1;
let totalPages = 1;
let totalImages = 0;
let pageSize = 20;
let loading = false;
let error = "";
let bannerImage: FileData | null = null;
let bannerImageLoaded = false;
let bannerImageError = false;

// 上传相关状态
let showUploadPanel = false;
let uploadItems: UploadItem[] = [];
let isDragOver = false;
let isUploading = false;
let fileInput: HTMLInputElement;

// 允许的文件类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml', 'image/avif', 'image/x-icon'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const API_BASE_URL = imageLibraryConfig.apiBaseUrl;
const STARDOTS_KEY = imageLibraryConfig.key;
const STARDOTS_SECRET = imageLibraryConfig.secret;
const DEFAULT_SPACE = imageLibraryConfig.defaultSpace;

// 生成随机 nonce 字符串（4~20个字符，大小写字母和数字）
function generateNonce(length = 16): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}

// MD5 哈希计算（纯 JS 实现）
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
	// 将 UTF-8 字符串编码
	function utf8Encode(str: string): string {
		return unescape(encodeURIComponent(str));
	}
	const encoded = utf8Encode(input);
	return binl2hex(binlMD5(str2binl(encoded), encoded.length * 8));
}

// 生成 StarDots 签名头
function getStardotsHeaders(): Record<string, string> {
	const timestamp = Math.floor(Date.now() / 1000).toString();
	const nonce = generateNonce();
	// 签名算法: md5(timestamp + "|" + secret + "|" + nonce) 转大写
	const needSignStr = `${timestamp}|${STARDOTS_SECRET}|${nonce}`;
	const sign = md5(needSignStr).toUpperCase();

	return {
		"Content-Type": "application/json",
		"x-stardots-timestamp": timestamp,
		"x-stardots-nonce": nonce,
		"x-stardots-key": STARDOTS_KEY,
		"x-stardots-sign": sign,
	};
}

async function fetchSpaces() {
	try {
		const response = await fetch(
			`${API_BASE_URL}/openapi/space/list?page=1&pageSize=100`,
			{
				headers: getStardotsHeaders(),
			},
		);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: StardotsResponse<Space[]> = await response.json();

		if (data.success && data.code === 200) {
			spaces = data.data;
			// 设置默认空间
			if (spaces.length > 0) {
				const defaultSpace =
					spaces.find((s) => s.name === DEFAULT_SPACE) || spaces[0];
				currentSpace = defaultSpace;
				// 获取默认空间的文件
				await fetchImages(1, defaultSpace.name);
			}
		} else {
			error = data.message || "获取空间列表失败";
		}
	} catch (err) {
		error = err instanceof Error ? err.message : "网络请求失败";
	}
}

async function fetchImages(page = 1, spaceName?: string) {
	loading = true;
	error = "";

	const targetSpace = spaceName || currentSpace?.name || DEFAULT_SPACE;

	try {
		const response = await fetch(
			`${API_BASE_URL}/openapi/file/list?space=${encodeURIComponent(targetSpace)}&page=${page}&pageSize=${pageSize}`,
			{
				headers: getStardotsHeaders(),
			},
		);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data: StardotsResponse<FileListData> = await response.json();

		if (data.success && data.code === 200) {
			images = data.data.list;
			currentPage = data.data.page;
			totalImages = data.data.totalCount;
			totalPages = Math.ceil(totalImages / data.data.pageSize);

			// 如果是切换空间或者是第一页，更新banner图片
			if (spaceName && page === 1) {
				bannerImage = images[0] || null;
				resetBannerImageState();
			}
		} else {
			error = data.message || "获取图片失败";
		}
	} catch (err) {
		error = err instanceof Error ? err.message : "网络请求失败";
	} finally {
		loading = false;
	}
}

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

// 从文件名中获取扩展名
function getExtension(filename: string): string {
	const parts = filename.split(".");
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

// 格式化时间戳为可读日期
function formatTimestamp(ts: number): string {
	const date = new Date(ts * 1000);
	return date.toLocaleDateString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

// 判断文件是否为图片
function isImageFile(filename: string): boolean {
	const ext = getExtension(filename);
	return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico", "avif"].includes(ext);
}

function handlePageClick(page: number) {
	if (page >= 1 && page <= totalPages && page !== currentPage) {
		fetchImages(page, currentSpace?.name);
	}
}

async function handleSpaceSwitch(space: Space) {
	if (space.name !== currentSpace?.name) {
		currentSpace = space;
		currentPage = 1;
		await fetchImages(1, space.name);
	}
}

function getPageNumbers(): number[] {
	const ADJ_DIST = 2;
	const VISIBLE = ADJ_DIST * 2 + 1;

	let count = 1;
	let l = currentPage;
	let r = currentPage;

	while (0 < l - 1 && r + 1 <= totalPages && count + 2 <= VISIBLE) {
		count += 2;
		l--;
		r++;
	}
	while (0 < l - 1 && count < VISIBLE) {
		count++;
		l--;
	}
	while (r + 1 <= totalPages && count < VISIBLE) {
		count++;
		r++;
	}

	let pages: number[] = [];
	for (let i = l; i <= r; i++) {
		pages.push(i);
	}

	return pages;
}

function handleBannerImageLoad() {
	bannerImageLoaded = true;
	bannerImageError = false;
}

function handleBannerImageError() {
	bannerImageError = true;
	bannerImageLoaded = false;
}

function resetBannerImageState() {
	bannerImageLoaded = false;
	bannerImageError = false;
}

// ========== 上传功能 ==========

function generateUploadId(): string {
	return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function toggleUploadPanel() {
	showUploadPanel = !showUploadPanel;
	if (!showUploadPanel) {
		// 关闭面板时清理已完成和失败的项（保留正在上传的）
		uploadItems = uploadItems.filter(item => item.status === 'uploading');
	}
}

function validateFile(file: File): string | null {
	if (!ALLOWED_TYPES.includes(file.type)) {
		return `不支持的文件格式: ${file.type || '未知'}`;
	}
	if (file.size > MAX_FILE_SIZE) {
		return `文件过大: ${formatFileSize(file.size)}，最大支持 ${formatFileSize(MAX_FILE_SIZE)}`;
	}
	return null;
}

function addFiles(files: FileList | File[]) {
	const newItems: UploadItem[] = [];
	for (const file of Array.from(files)) {
		const validationError = validateFile(file);
		const previewUrl = validationError ? undefined : URL.createObjectURL(file);
		newItems.push({
			id: generateUploadId(),
			file,
			name: file.name,
			size: file.size,
			progress: 0,
			status: validationError ? 'error' : 'pending',
			errorMsg: validationError || undefined,
			previewUrl,
		});
	}
	uploadItems = [...uploadItems, ...newItems];
}

function removeUploadItem(id: string) {
	const item = uploadItems.find(i => i.id === id);
	if (item?.previewUrl) {
		URL.revokeObjectURL(item.previewUrl);
	}
	uploadItems = uploadItems.filter(i => i.id !== id);
}

function clearCompletedItems() {
	uploadItems = uploadItems.filter(item => {
		if (item.status === 'success' || item.status === 'error') {
			if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
			return false;
		}
		return true;
	});
}

function handleFileSelect(event: Event) {
	const input = event.target as HTMLInputElement;
	if (input.files && input.files.length > 0) {
		addFiles(input.files);
		input.value = ''; // 重置 input，允许重新选择相同文件
	}
}

function handleDragOver(event: DragEvent) {
	event.preventDefault();
	isDragOver = true;
}

function handleDragLeave(event: DragEvent) {
	event.preventDefault();
	isDragOver = false;
}

function handleDrop(event: DragEvent) {
	event.preventDefault();
	isDragOver = false;
	if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
		addFiles(event.dataTransfer.files);
	}
}

async function uploadSingleFile(item: UploadItem): Promise<void> {
	const targetSpace = currentSpace?.name || DEFAULT_SPACE;
	
	// 更新状态为上传中
	uploadItems = uploadItems.map(i =>
		i.id === item.id ? { ...i, status: 'uploading' as const, progress: 0 } : i
	);

	try {
		const formData = new FormData();
		formData.append('file', item.file);
		formData.append('space', targetSpace);

		// 生成签名头（不包含 Content-Type，浏览器会自动设置 multipart boundary）
		const timestamp = Math.floor(Date.now() / 1000).toString();
		const nonce = generateNonce();
		const needSignStr = `${timestamp}|${STARDOTS_SECRET}|${nonce}`;
		const sign = md5(needSignStr).toUpperCase();

		const xhr = new XMLHttpRequest();
		
		await new Promise<void>((resolve, reject) => {
			xhr.upload.addEventListener('progress', (e) => {
				if (e.lengthComputable) {
					const progress = Math.round((e.loaded / e.total) * 100);
					uploadItems = uploadItems.map(i =>
						i.id === item.id ? { ...i, progress } : i
					);
				}
			});

			xhr.addEventListener('load', () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						const response = JSON.parse(xhr.responseText);
						if (response.success && response.code === 200) {
							uploadItems = uploadItems.map(i =>
								i.id === item.id
									? { ...i, status: 'success' as const, progress: 100, url: response.data?.url }
									: i
							);
							resolve();
						} else {
							uploadItems = uploadItems.map(i =>
								i.id === item.id
									? { ...i, status: 'error' as const, errorMsg: response.message || '上传失败' }
									: i
							);
							reject(new Error(response.message));
						}
					} catch {
						uploadItems = uploadItems.map(i =>
							i.id === item.id
								? { ...i, status: 'error' as const, errorMsg: '响应解析失败' }
								: i
						);
						reject(new Error('响应解析失败'));
					}
				} else {
					uploadItems = uploadItems.map(i =>
						i.id === item.id
							? { ...i, status: 'error' as const, errorMsg: `HTTP 错误: ${xhr.status}` }
							: i
					);
					reject(new Error(`HTTP error: ${xhr.status}`));
				}
			});

			xhr.addEventListener('error', () => {
				uploadItems = uploadItems.map(i =>
					i.id === item.id
						? { ...i, status: 'error' as const, errorMsg: '网络错误' }
						: i
				);
				reject(new Error('Network error'));
			});

			xhr.open('POST', `${API_BASE_URL}/openapi/file/upload`);
			xhr.setRequestHeader('x-stardots-timestamp', timestamp);
			xhr.setRequestHeader('x-stardots-nonce', nonce);
			xhr.setRequestHeader('x-stardots-key', STARDOTS_KEY);
			xhr.setRequestHeader('x-stardots-sign', sign);
			xhr.send(formData);
		});
	} catch (err) {
		// 错误已在 Promise 内部处理
	}
}

async function startUpload() {
	if (isUploading) return;
	
	const pendingItems = uploadItems.filter(item => item.status === 'pending');
	if (pendingItems.length === 0) return;

	isUploading = true;

	// 逐个上传（避免并发过多）
	for (const item of pendingItems) {
		await uploadSingleFile(item);
	}

	isUploading = false;

	// 上传完成后刷新图片列表
	const hasSuccess = uploadItems.some(item => item.status === 'success');
	if (hasSuccess && currentSpace) {
		await fetchImages(1, currentSpace.name);
	}
}

function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text).catch(() => {
		// 降级方案
		const textArea = document.createElement('textarea');
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand('copy');
		document.body.removeChild(textArea);
	});
}

onMount(() => {
	fetchSpaces();
	
	// 清理预览 URL
	return () => {
		for (const item of uploadItems) {
			if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
		}
	};
});
</script>

<div class="card-base px-8 py-6">
	<!-- Header -->
	<div class="mb-6">		
		<!-- Space Tabs + Upload Button -->
		{#if spaces.length > 0}
			<div class="flex flex-wrap items-center gap-2 mb-6">
				{#each spaces as space}
					<button
						on:click={() => handleSpaceSwitch(space)}
						class="btn-regular h-8 text-sm px-3 rounded-lg"
					>
						<div class="flex items-center gap-2">
							<Icon icon="material-symbols:photo-library" class="w-4 h-4" />
							<span>{space.name}</span>
							<span class="text-xs opacity-75">({space.fileCount})</span>
						</div>
					</button>
				{/each}
				
				<!-- Upload Button -->
				<button
					on:click={toggleUploadPanel}
					class="btn-regular h-8 text-sm px-3 rounded-lg ml-auto"
					title="上传图片"
				>
					<div class="flex items-center gap-2">
						<Icon icon="material-symbols:cloud-upload" class="w-4 h-4" />
						<span>上传</span>
					</div>
				</button>
			</div>
		{/if}
		
		<!-- Banner Image - 使用当前相册的第一张图片 -->
		{#if loading}
			<!-- Banner Loading State -->
			<div class="gallery-group bg-[var(--card-bg)] rounded-[var(--radius-large)] overflow-hidden transition-all duration-300 hover:shadow-lg mb-6">
				<div class="gallery-header cursor-pointer relative h-48 overflow-hidden group">
					<div class="w-full h-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
					<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
					<div class="absolute bottom-4 left-4 text-white">
						<div class="h-6 bg-white/20 rounded mb-2 animate-pulse"></div>
						<div class="h-4 bg-white/20 rounded mb-1 animate-pulse w-24"></div>
						<div class="h-3 bg-white/20 rounded w-32 animate-pulse"></div>
					</div>
					<div class="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
						<div class="h-4 bg-white/20 rounded w-20 animate-pulse"></div>
					</div>
				</div>
			</div>
		{:else if bannerImage}
			<div class="gallery-group bg-[var(--card-bg)] rounded-[var(--radius-large)] overflow-hidden transition-all duration-300 hover:shadow-lg mb-6">
				<div class="gallery-header cursor-pointer relative h-48 overflow-hidden group">
					<!-- 占位符背景 - 使用图片的主色调或渐变 -->
					<div class="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 animate-pulse"></div>
					
					<img
						src={bannerImage.url}
						alt={bannerImage.name}
						class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
						loading="lazy"
						fetchpriority="high"
						decoding="async"
						on:load={handleBannerImageLoad}
						on:error={handleBannerImageError}
					/>
					
					<!-- 加载状态指示器 -->
					{#if !bannerImageLoaded && !bannerImageError}
						<div class="absolute inset-0 flex items-center justify-center bg-black/20">
							<div class="flex flex-col items-center gap-3">
								<div class="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
								<div class="text-white text-sm font-medium">加载中...</div>
							</div>
						</div>
					{/if}
					
					<!-- 错误状态 -->
					{#if bannerImageError}
						<div class="absolute inset-0 flex items-center justify-center bg-black/40">
							<div class="text-center text-white">
								<Icon icon="material-symbols:broken-image" class="w-12 h-12 mx-auto mb-2 opacity-75" />
								<div class="text-sm">图片加载失败</div>
							</div>
						</div>
					{/if}
					
					<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
					<div class="absolute bottom-4 left-4 text-white">
						<h3 class="text-xl font-bold mb-1">{currentSpace?.name}</h3>
						<p class="text-sm opacity-90">{totalImages} 张图片</p>
					</div>
					<div class="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-sm">
						{formatTimestamp(bannerImage.uploadedAt)}
					</div>
				</div>
			</div>
		{/if}
		
		<!-- Current Space Info -->
		{#if currentSpace}
			<p class="text-black/50 dark:text-white/50">
				当前空间：{currentSpace.name} - 共 {totalImages} 张图片，第 {currentPage} 页，共 {totalPages} 页，如有侵权联系博主删除！
			</p>
		{:else}
			<p class="text-black/50 dark:text-white/50">
				共 {totalImages} 张图片，第 {currentPage} 页，共 {totalPages} 页，如有侵权联系博主删除！
			</p>
		{/if}
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="flex justify-center items-center py-12">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)]"></div>
		</div>
	{:else if error}
		<!-- Error State -->
		<div class="text-center py-12">
			<div class="text-red-500 text-lg mb-4">{error}</div>
			<button 
				on:click={() => currentSpace ? fetchImages(currentPage, currentSpace.name) : fetchImages(currentPage)}
				class="btn-card px-6 py-2 rounded-lg"
			>
				重试
			</button>
		</div>
	{:else}
		<!-- Images Grid -->
		<div class="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 mb-8">
			{#each images as image}
				{#if isImageFile(image.name)}
				<div class="group relative overflow-hidden rounded-lg bg-[var(--card-bg)] shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 mb-6 break-inside-avoid">
					<!-- Image Container -->
					<div 
						class="relative overflow-hidden bg-gray-100 dark:bg-gray-800"
					>
						<img
							src={image.url}
							alt={image.name}
							title={image.name}
							class="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-110"
							loading="lazy"
							decoding="async"
							fetchpriority="auto"
						/>
						
						<!-- GIF Indicator -->
						{#if getExtension(image.name) === 'gif'}
							<div class="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-medium">
								GIF
							</div>
						{/if}
						
						<!-- Overlay on hover -->
						<div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
							<div class="opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0">
								<a 
									href={image.url} 
									target="_blank" 
									rel="noopener noreferrer"
									class="btn-card bg-white/90 hover:bg-white text-black px-4 py-2 rounded-lg shadow-lg"
								>
									<Icon icon="material-symbols:open-in-new" class="w-5 h-5 mr-2" />
									查看原图
								</a>
							</div>
						</div>
					</div>
					
					<!-- Image Info -->
					<div class="p-4">
						<h3 class="font-semibold text-black/75 dark:text-white/75 mb-2 line-clamp-2 group-hover:text-[var(--primary)] transition-colors duration-300">
							{image.name}
						</h3>
						
						<div class="space-y-1 text-sm text-black/50 dark:text-white/50">
							<div class="flex items-center justify-between">
								<span>大小:</span>
								<span>{image.size || formatFileSize(image.byteSize)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span>格式:</span>
								<span class="uppercase">{getExtension(image.name)}</span>
							</div>
							<div class="flex items-center justify-between">
								<span>上传:</span>
								<span>{formatTimestamp(image.uploadedAt)}</span>
							</div>
						</div>
					</div>
				</div>
				{/if}
			{/each}
		</div>

		<!-- Pagination -->
		{#if totalPages > 1}
			<div class="flex flex-row gap-3 justify-center">
				<!-- Previous Page -->
				<button
					on:click={() => handlePageClick(currentPage - 1)}
					disabled={currentPage <= 1}
					class="btn-card overflow-hidden rounded-lg text-[var(--primary)] w-11 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label={currentPage > 1 ? "Previous Page" : null}
				>
					<Icon icon="material-symbols:chevron-left-rounded" class="text-[1.75rem]" />
				</button>

				<!-- Page Numbers -->
				<div class="bg-[var(--card-bg)] flex flex-row rounded-lg items-center text-neutral-700 dark:text-neutral-300 font-bold">
					{#if currentPage > 3}
						<button
							on:click={() => handlePageClick(1)}
							class="btn-card w-11 h-11 rounded-lg overflow-hidden active:scale-[0.85]"
							aria-label="Page 1"
						>
							1
						</button>
						{#if currentPage > 4}
							<Icon icon="material-symbols:more-horiz" class="mx-1" />
						{/if}
					{/if}

					{#each getPageNumbers() as pageNum}
						{#if pageNum === currentPage}
							<div class="h-11 w-11 rounded-lg bg-[var(--primary)] flex items-center justify-center font-bold text-white dark:text-black/70">
								{pageNum}
							</div>
						{:else}
							<button
								on:click={() => handlePageClick(pageNum)}
								class="btn-card w-11 h-11 rounded-lg overflow-hidden active:scale-[0.85]"
								aria-label="Page {pageNum}"
							>
								{pageNum}
							</button>
						{/if}
					{/each}

					{#if currentPage < totalPages - 2}
						{#if currentPage < totalPages - 3}
							<Icon icon="material-symbols:more-horiz" class="mx-1" />
						{/if}
						<button
							on:click={() => handlePageClick(totalPages)}
							class="btn-card w-11 h-11 rounded-lg overflow-hidden active:scale-[0.85]"
							aria-label="Page {totalPages}"
						>
							{totalPages}
						</button>
					{/if}
				</div>

				<!-- Next Page -->
				<button
					on:click={() => handlePageClick(currentPage + 1)}
					disabled={currentPage >= totalPages}
					class="btn-card overflow-hidden rounded-lg text-[var(--primary)] w-11 h-11 disabled:opacity-50 disabled:cursor-not-allowed"
					aria-label={currentPage < totalPages ? "Next Page" : null}
				>
					<Icon icon="material-symbols:chevron-right-rounded" class="text-[1.75rem]" />
				</button>
			</div>
		{/if}
	{/if}

</div>

<!-- Upload Panel Modal -->
{#if showUploadPanel}
	<!-- Backdrop -->
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div 
		class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
		on:click|self={toggleUploadPanel}
	>
		<div class="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
			<!-- Panel Header -->
			<div class="flex items-center justify-between px-6 py-4 border-b border-black/10 dark:border-white/10">
				<div class="flex items-center gap-3">
					<Icon icon="material-symbols:cloud-upload" class="w-6 h-6 text-[var(--primary)]" />
					<h2 class="text-lg font-bold text-black/80 dark:text-white/80">上传图片</h2>
					{#if currentSpace}
						<span class="text-sm text-black/50 dark:text-white/50 bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-full">
							{currentSpace.name}
						</span>
					{/if}
				</div>
				<button 
					on:click={toggleUploadPanel}
					class="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
				>
					<Icon icon="material-symbols:close" class="w-5 h-5 text-black/50 dark:text-white/50" />
				</button>
			</div>

			<!-- Drop Zone -->
			<div class="px-6 py-4">
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div 
					class="relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
						{isDragOver 
							? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.02]' 
							: 'border-black/20 dark:border-white/20 hover:border-[var(--primary)]/50'}"
					on:dragover={handleDragOver}
					on:dragleave={handleDragLeave}
					on:drop={handleDrop}
				>
					<input
						bind:this={fileInput}
						type="file"
						accept="image/*"
						multiple
						class="hidden"
						on:change={handleFileSelect}
					/>
					
					<div class="flex flex-col items-center gap-3">
						<div class="w-16 h-16 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
							<Icon 
								icon={isDragOver ? "material-symbols:file-download" : "material-symbols:add-photo-alternate-outline"} 
								class="w-8 h-8 text-[var(--primary)]" 
							/>
						</div>
						<div>
							<p class="text-black/70 dark:text-white/70 font-medium">
								{isDragOver ? '释放鼠标上传文件' : '拖拽图片到此处，或'}
								{#if !isDragOver}
									<button 
										on:click={() => fileInput?.click()} 
										class="text-[var(--primary)] hover:underline font-semibold"
									>
										点击选择文件
									</button>
								{/if}
							</p>
							<p class="text-sm text-black/40 dark:text-white/40 mt-1">
								支持 JPG、PNG、GIF、WebP、BMP、SVG、AVIF 格式，单文件最大 10MB
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Upload Items List -->
			{#if uploadItems.length > 0}
				<div class="flex-1 overflow-y-auto px-6 pb-2 min-h-0">
					<div class="flex items-center justify-between mb-3">
						<span class="text-sm text-black/50 dark:text-white/50">
							{uploadItems.length} 个文件
							{#if uploadItems.filter(i => i.status === 'success').length > 0}
								，{uploadItems.filter(i => i.status === 'success').length} 个已完成
							{/if}
						</span>
						{#if uploadItems.some(i => i.status === 'success' || i.status === 'error')}
							<button 
								on:click={clearCompletedItems}
								class="text-sm text-[var(--primary)] hover:underline"
							>
								清除已完成
							</button>
						{/if}
					</div>
					
					<div class="space-y-3">
						{#each uploadItems as item (item.id)}
							<div class="flex items-center gap-3 p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] group/item">
								<!-- Preview -->
								<div class="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 flex-shrink-0">
									{#if item.previewUrl}
										<img src={item.previewUrl} alt={item.name} class="w-full h-full object-cover" />
									{:else}
										<div class="w-full h-full flex items-center justify-center">
											<Icon icon="material-symbols:image" class="w-6 h-6 text-black/20 dark:text-white/20" />
										</div>
									{/if}
								</div>

								<!-- Info -->
								<div class="flex-1 min-w-0">
									<p class="text-sm font-medium text-black/70 dark:text-white/70 truncate">{item.name}</p>
									<div class="flex items-center gap-2 mt-1">
										<span class="text-xs text-black/40 dark:text-white/40">{formatFileSize(item.size)}</span>
										
										{#if item.status === 'uploading'}
											<div class="flex-1 h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
												<div 
													class="h-full bg-[var(--primary)] rounded-full transition-all duration-300"
													style="width: {item.progress}%"
												></div>
											</div>
											<span class="text-xs text-[var(--primary)] font-medium">{item.progress}%</span>
										{:else if item.status === 'success'}
											<span class="text-xs text-green-500 flex items-center gap-1">
												<Icon icon="material-symbols:check-circle" class="w-3.5 h-3.5" />
												上传成功
											</span>
										{:else if item.status === 'error'}
											<span class="text-xs text-red-500 flex items-center gap-1" title={item.errorMsg}>
												<Icon icon="material-symbols:error" class="w-3.5 h-3.5" />
												{item.errorMsg || '上传失败'}
											</span>
										{:else}
											<span class="text-xs text-black/30 dark:text-white/30">等待上传</span>
										{/if}
									</div>
								</div>

								<!-- Actions -->
								<div class="flex items-center gap-1 flex-shrink-0">
									{#if item.status === 'success' && item.url}
										<button
											on:click={() => item.url && copyToClipboard(item.url)}
											class="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
											title="复制链接"
										>
											<Icon icon="material-symbols:content-copy" class="w-4 h-4 text-[var(--primary)]" />
										</button>
									{/if}
									{#if item.status !== 'uploading'}
										<button
											on:click={() => removeUploadItem(item.id)}
											class="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover/item:opacity-100"
											title="移除"
										>
											<Icon icon="material-symbols:delete-outline" class="w-4 h-4 text-red-500" />
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Panel Footer -->
			<div class="px-6 py-4 border-t border-black/10 dark:border-white/10 flex items-center justify-between">
				<button
					on:click={() => fileInput?.click()}
					class="btn-regular h-9 text-sm px-4 rounded-lg"
				>
					<div class="flex items-center gap-2">
						<Icon icon="material-symbols:add" class="w-4 h-4" />
						<span>添加文件</span>
					</div>
				</button>
				
				<button
					on:click={startUpload}
					disabled={isUploading || uploadItems.filter(i => i.status === 'pending').length === 0}
					class="h-9 text-sm px-6 rounded-lg font-medium text-white bg-[var(--primary)] hover:opacity-90 
						disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200
						flex items-center gap-2"
				>
					{#if isUploading}
						<div class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
						<span>上传中...</span>
					{:else}
						<Icon icon="material-symbols:cloud-upload" class="w-4 h-4" />
						<span>开始上传 ({uploadItems.filter(i => i.status === 'pending').length})</span>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
	
	/* Banner 图片加载优化 */
	.gallery-header img {
		will-change: opacity, transform;
	}
	
	/* 渐进式加载动画 */
	@keyframes fadeInScale {
		from {
			opacity: 0;
			transform: scale(1.05);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}
	
	.banner-image-loaded {
		animation: fadeInScale 0.7s ease-out forwards;
	}
	
	/* 占位符动画优化 */
	.animate-pulse {
		animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.5;
		}
	}
	
	/* 上传面板滚动条美化 */
	.overflow-y-auto::-webkit-scrollbar {
		width: 4px;
	}
	.overflow-y-auto::-webkit-scrollbar-track {
		background: transparent;
	}
	.overflow-y-auto::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.15);
		border-radius: 2px;
	}
	:global(.dark) .overflow-y-auto::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.15);
	}
</style>
