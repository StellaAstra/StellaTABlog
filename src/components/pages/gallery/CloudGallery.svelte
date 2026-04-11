<script lang="ts">
import Icon from "@iconify/svelte";
import { onMount } from "svelte";

// Props: i18n 翻译文本通过 props 传入（因为 Svelte 组件无法直接调用 Astro 的 i18n）
export let defaultSpace: string = "stella1028";
export let columnWidth: number = 240;
export let texts: Record<string, string> = {};

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
	status: "pending" | "uploading" | "success" | "error";
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

// Fancybox
let fancyboxLoaded = false;

// 允许的文件类型
const ALLOWED_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/bmp",
	"image/svg+xml",
	"image/avif",
	"image/x-icon",
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// ========== API 请求 ==========

async function fetchSpaces() {
	try {
		const response = await fetch("/api/stardots-spaces");
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}
		const data: StardotsResponse<Space[]> = await response.json();
		if (data.success && data.code === 200) {
			spaces = data.data;
			if (spaces.length > 0) {
				const ds =
					spaces.find((s) => s.name === defaultSpace) || spaces[0];
				currentSpace = ds;
				await fetchImages(1, ds.name);
			}
		} else {
			error = data.message || texts.cloudGalleryError || "获取空间列表失败";
		}
	} catch (err) {
		error = err instanceof Error ? err.message : texts.cloudGalleryError || "网络请求失败";
	}
}

async function fetchImages(page = 1, spaceName?: string) {
	loading = true;
	error = "";
	const targetSpace = spaceName || currentSpace?.name || defaultSpace;
	try {
		const response = await fetch(
			`/api/stardots-files?space=${encodeURIComponent(targetSpace)}&page=${page}&pageSize=${pageSize}`,
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
			if (spaceName && page === 1) {
				bannerImage = images[0] || null;
				resetBannerImageState();
			}
		} else {
			error = data.message || texts.cloudGalleryError || "获取图片失败";
		}
	} catch (err) {
		error = err instanceof Error ? err.message : texts.cloudGalleryError || "网络请求失败";
	} finally {
		loading = false;
	}
}

// ========== 工具函数 ==========

function formatFileSize(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

function getExtension(filename: string): string {
	const parts = filename.split(".");
	return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function formatTimestamp(ts: number): string {
	const date = new Date(ts * 1000);
	return date.toLocaleDateString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
}

function isImageFile(filename: string): boolean {
	const ext = getExtension(filename);
	return ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg", "ico", "avif"].includes(ext);
}

function handlePageClick(page: number) {
	if (page >= 1 && page <= totalPages && page !== currentPage) {
		fetchImages(page, currentSpace?.name);
		const grid = document.querySelector(".cloud-gallery-grid");
		if (grid) {
			grid.scrollIntoView({ behavior: "smooth", block: "start" });
		}
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
	const pages: number[] = [];
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

// ========== Fancybox ==========

async function initFancybox() {
	try {
		const { Fancybox } = await import("@fancyapps/ui");
		Fancybox.bind('[data-fancybox="cloud-gallery"]', {
			animated: true,
			showClass: "fancybox-zoomInUp",
			hideClass: "fancybox-fadeOut",
			Toolbar: {
				display: {
					left: ["infobar"],
					middle: [
						"zoomIn",
						"zoomOut",
						"toggle1to1",
						"rotateCCW",
						"rotateCW",
						"flipX",
						"flipY",
					],
					right: ["slideshow", "thumbs", "close"],
				},
			},
			Thumbs: {
				autoStart: true,
				showOnStart: "yes",
			},
			fitToView: true,
			preload: 3,
			infinite: true,
			Panzoom: {
				maxScale: 3,
				minScale: 1,
			},
			caption: false,
		});
		fancyboxLoaded = true;
	} catch (e) {
		console.warn("[CloudGallery] Fancybox load failed", e);
	}
}

function destroyFancybox() {
	try {
		import("@fancyapps/ui").then(({ Fancybox }) => {
			Fancybox.unbind('[data-fancybox="cloud-gallery"]');
			Fancybox.close();
		});
	} catch (_) {}
}

// ========== 上传功能 ==========

function generateUploadId(): string {
	return `upload_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function toggleUploadPanel() {
	showUploadPanel = !showUploadPanel;
	if (!showUploadPanel) {
		uploadItems = uploadItems.filter((item) => item.status === "uploading");
	}
}

function validateFile(file: File): string | null {
	if (!ALLOWED_TYPES.includes(file.type)) {
		return `不支持的文件格式: ${file.type || "未知"}`;
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
			status: validationError ? "error" : "pending",
			errorMsg: validationError || undefined,
			previewUrl,
		});
	}
	uploadItems = [...uploadItems, ...newItems];
}

function removeUploadItem(id: string) {
	const item = uploadItems.find((i) => i.id === id);
	if (item?.previewUrl) {
		URL.revokeObjectURL(item.previewUrl);
	}
	uploadItems = uploadItems.filter((i) => i.id !== id);
}

function clearCompletedItems() {
	uploadItems = uploadItems.filter((item) => {
		if (item.status === "success" || item.status === "error") {
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
		input.value = "";
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
	const targetSpace = currentSpace?.name || defaultSpace;
	uploadItems = uploadItems.map((i) =>
		i.id === item.id ? { ...i, status: "uploading" as const, progress: 0 } : i,
	);
	try {
		const formData = new FormData();
		formData.append("file", item.file);
		formData.append("space", targetSpace);
		const xhr = new XMLHttpRequest();
		await new Promise<void>((resolve, reject) => {
			xhr.upload.addEventListener("progress", (e) => {
				if (e.lengthComputable) {
					const progress = Math.round((e.loaded / e.total) * 100);
					uploadItems = uploadItems.map((i) =>
						i.id === item.id ? { ...i, progress } : i,
					);
				}
			});
			xhr.addEventListener("load", () => {
				if (xhr.status >= 200 && xhr.status < 300) {
					try {
						const response = JSON.parse(xhr.responseText);
						if (response.success && response.code === 200) {
							uploadItems = uploadItems.map((i) =>
								i.id === item.id
									? { ...i, status: "success" as const, progress: 100, url: response.data?.url }
									: i,
							);
							resolve();
						} else {
							uploadItems = uploadItems.map((i) =>
								i.id === item.id
									? { ...i, status: "error" as const, errorMsg: response.message || "上传失败" }
									: i,
							);
							reject(new Error(response.message));
						}
					} catch {
						uploadItems = uploadItems.map((i) =>
							i.id === item.id
								? { ...i, status: "error" as const, errorMsg: "响应解析失败" }
								: i,
						);
						reject(new Error("响应解析失败"));
					}
				} else {
					uploadItems = uploadItems.map((i) =>
						i.id === item.id
							? { ...i, status: "error" as const, errorMsg: `HTTP 错误 ${xhr.status}` }
							: i,
					);
					reject(new Error(`HTTP error: ${xhr.status}`));
				}
			});
			xhr.addEventListener("error", () => {
				uploadItems = uploadItems.map((i) =>
					i.id === item.id
						? { ...i, status: "error" as const, errorMsg: "网络错误" }
						: i,
				);
				reject(new Error("Network error"));
			});
			xhr.open("POST", "/api/stardots-upload");
			xhr.send(formData);
		});
	} catch (err) {
		// 错误已在 Promise 内部处理
	}
}

async function startUpload() {
	if (isUploading) return;
	const pendingItems = uploadItems.filter((item) => item.status === "pending");
	if (pendingItems.length === 0) return;
	isUploading = true;
	for (const item of pendingItems) {
		await uploadSingleFile(item);
	}
	isUploading = false;
	const hasSuccess = uploadItems.some((item) => item.status === "success");
	if (hasSuccess && currentSpace) {
		await fetchImages(1, currentSpace.name);
	}
}

function copyToClipboard(text: string) {
	navigator.clipboard.writeText(text).catch(() => {
		const textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.select();
		document.execCommand("copy");
		document.body.removeChild(textArea);
	});
}

onMount(() => {
	fetchSpaces();
	initFancybox();
	return () => {
		for (const item of uploadItems) {
			if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
		}
		destroyFancybox();
	};
});

// 响应式地在 images 变化后重新绑定 Fancybox
$: if (images.length > 0 && fancyboxLoaded) {
	// 延迟确保 DOM 已更新
	setTimeout(() => {
		destroyFancybox();
		initFancybox();
	}, 100);
}
</script>

<!-- ============ Space Tabs + Upload Button ============ -->
{#if spaces.length > 0}
	<div class="flex flex-wrap items-center gap-2 mb-6">
		{#each spaces as space}
			<button
				on:click={() => handleSpaceSwitch(space)}
				class="cg-space-tab"
				class:cg-space-tab-active={currentSpace?.name === space.name}
			>
				<Icon
					icon={currentSpace?.name === space.name
						? "material-symbols:folder-open-rounded"
						: "material-symbols:folder-rounded"}
					class="w-4 h-4"
				/>
				<span>{space.name}</span>
				<span class="cg-space-tab-count">{space.fileCount}</span>
			</button>
		{/each}

		<button
			on:click={toggleUploadPanel}
			class="cg-upload-btn ml-auto"
			title={texts.cloudGalleryUpload || "上传"}
		>
			<Icon icon="material-symbols:cloud-upload-rounded" class="w-4 h-4" />
			<span>{texts.cloudGalleryUpload || "上传"}</span>
		</button>
	</div>
{/if}

<!-- ============ Banner ============ -->
{#if loading && !bannerImage}
	<div class="cg-banner mb-6">
		<div class="cg-banner-inner">
			<div
				class="w-full h-full bg-gradient-to-br from-gray-200 via-gray-300 to-gray-200 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 animate-pulse"
			></div>
			<div class="cg-banner-overlay"></div>
			<div class="cg-banner-content">
				<div class="h-7 w-40 bg-white/20 rounded-lg animate-pulse mb-2"></div>
				<div class="h-4 w-24 bg-white/15 rounded animate-pulse"></div>
			</div>
		</div>
	</div>
{:else if bannerImage}
	<div class="cg-banner mb-6">
		<div class="cg-banner-inner">
			<div
				class="absolute inset-0 bg-gradient-to-br from-gray-300 via-gray-200 to-gray-400 dark:from-gray-800 dark:via-gray-700 dark:to-gray-600"
				class:hidden={bannerImageLoaded}
			></div>
			<img
				src={bannerImage.url}
				alt={bannerImage.name}
				class="cg-banner-img"
				class:cg-banner-img-loaded={bannerImageLoaded}
				loading="eager"
				decoding="async"
				on:load={handleBannerImageLoad}
				on:error={handleBannerImageError}
			/>
			{#if !bannerImageLoaded && !bannerImageError}
				<div class="absolute inset-0 flex items-center justify-center z-[2]">
					<div
						class="animate-spin rounded-full h-8 w-8 border-2 border-white/60 border-t-transparent"
					></div>
				</div>
			{/if}
			{#if bannerImageError}
				<div class="absolute inset-0 flex items-center justify-center bg-black/30 z-[2]">
					<div class="text-center text-white/80">
						<Icon
							icon="material-symbols:broken-image-rounded"
							class="w-10 h-10 mx-auto mb-2 opacity-60"
						/>
						<div class="text-sm">{texts.cloudGalleryError || "加载失败"}</div>
					</div>
				</div>
			{/if}
			<div class="cg-banner-overlay"></div>
			<div class="cg-banner-content">
				<h2 class="text-2xl md:text-3xl font-bold text-white mb-1 drop-shadow-lg">
					{currentSpace?.name || texts.cloudGallery || "图库"}
				</h2>
				<p class="text-white/80 text-sm flex items-center gap-2">
					<Icon icon="material-symbols:photo-camera-rounded" class="w-4 h-4" />
					<span>{totalImages} {texts.cloudGalleryImages || "张图片"}</span>
					<span class="text-white/40">·</span>
					<span
						>{texts.cloudGalleryPage || "第"} {currentPage}/{totalPages}</span
					>
				</p>
			</div>
			<div class="cg-banner-date">
				<Icon icon="material-symbols:calendar-today-rounded" class="w-3.5 h-3.5" />
				<span>{bannerImage ? formatTimestamp(bannerImage.uploadedAt) : ""}</span>
			</div>
		</div>
	</div>
{/if}

<!-- ============ Loading State ============ -->
{#if loading}
	<div class="cg-loading-grid">
		{#each Array(8) as _}
			<div class="cg-skeleton-card">
				<div class="cg-skeleton-img"></div>
			</div>
		{/each}
	</div>
{:else if error}
	<!-- ============ Error State ============ -->
	<div class="cg-empty-state">
		<div class="cg-empty-icon cg-empty-icon-error">
			<Icon icon="material-symbols:error-rounded" class="w-12 h-12" />
		</div>
		<h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-4 mb-2">
			{texts.cloudGalleryError || "加载失败"}
		</h3>
		<p class="text-sm text-neutral-400 dark:text-neutral-500 mb-4 max-w-sm">{error}</p>
		<button
			on:click={() =>
				currentSpace
					? fetchImages(currentPage, currentSpace.name)
					: fetchImages(currentPage)}
			class="cg-action-btn"
		>
			<Icon icon="material-symbols:refresh-rounded" class="w-4 h-4" />
			<span>{texts.cloudGalleryRetry || "重新加载"}</span>
		</button>
	</div>
{:else if images.filter((img) => isImageFile(img.name)).length === 0}
	<!-- ============ Empty State ============ -->
	<div class="cg-empty-state">
		<div class="cg-empty-icon">
			<Icon icon="material-symbols:image-not-supported-rounded" class="w-12 h-12" />
		</div>
		<h3 class="text-lg font-semibold text-neutral-700 dark:text-neutral-300 mt-4 mb-2">
			{texts.cloudGalleryEmpty || "暂无图片"}
		</h3>
		<p class="text-sm text-neutral-400 dark:text-neutral-500 mb-4">
			{texts.cloudGalleryDescription || "当前空间还没有上传任何图片"}
		</p>
		<button on:click={toggleUploadPanel} class="cg-action-btn">
			<Icon icon="material-symbols:cloud-upload-rounded" class="w-4 h-4" />
			<span>{texts.cloudGalleryUpload || "上传"}</span>
		</button>
	</div>
{:else}
	<!-- ============ Gallery Grid (Masonry) ============ -->
	<div
		class="cloud-gallery-grid cg-masonry-grid mb-8"
		style="--cg-col-width: {columnWidth}px;"
	>
		{#each images as image}
			{#if isImageFile(image.name)}
				<div class="cg-photo-card break-inside-avoid mb-3">
					<a
						href={image.url}
						data-fancybox="cloud-gallery"
						data-caption={image.name}
						class="block rounded-xl overflow-hidden group cursor-pointer cg-photo-inner"
					>
						<img
							src={image.url}
							alt={image.name}
							title={image.name}
							loading="lazy"
							decoding="async"
							class="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
						/>
						{#if getExtension(image.name) === "gif"}
							<div class="cg-format-badge">GIF</div>
						{/if}
						<div class="cg-photo-hover">
							<div class="cg-photo-hover-icon">
								<Icon
									icon="material-symbols:zoom-in-rounded"
									class="w-8 h-8 text-white drop-shadow-lg"
								/>
							</div>
						</div>
						<div class="cg-photo-info">
							<span class="cg-photo-name">{image.name}</span>
							<span class="cg-photo-meta"
								>{image.size || formatFileSize(image.byteSize)}</span
							>
						</div>
					</a>
				</div>
			{/if}
		{/each}
	</div>

	<!-- ============ Pagination ============ -->
	{#if totalPages > 1}
		<div class="cg-pagination-wrapper">
			<div class="cg-pagination">
				<button
					on:click={() => handlePageClick(currentPage - 1)}
					disabled={currentPage <= 1}
					class="cg-page-btn cg-page-nav"
					aria-label="上一页"
				>
					<Icon icon="material-symbols:chevron-left-rounded" class="text-xl" />
				</button>
				{#if currentPage > 3}
					<button
						on:click={() => handlePageClick(1)}
						class="cg-page-btn"
						aria-label="第 1 页"
					>
						1
					</button>
					{#if currentPage > 4}
						<span class="cg-page-ellipsis">…</span>
					{/if}
				{/if}
				{#each getPageNumbers() as pageNum}
					{#if pageNum === currentPage}
						<div class="cg-page-btn cg-page-active">{pageNum}</div>
					{:else}
						<button
							on:click={() => handlePageClick(pageNum)}
							class="cg-page-btn"
							aria-label="第 {pageNum} 页"
						>
							{pageNum}
						</button>
					{/if}
				{/each}
				{#if currentPage < totalPages - 2}
					{#if currentPage < totalPages - 3}
						<span class="cg-page-ellipsis">…</span>
					{/if}
					<button
						on:click={() => handlePageClick(totalPages)}
						class="cg-page-btn"
						aria-label="第 {totalPages} 页"
					>
						{totalPages}
					</button>
				{/if}
				<button
					on:click={() => handlePageClick(currentPage + 1)}
					disabled={currentPage >= totalPages}
					class="cg-page-btn cg-page-nav"
					aria-label="下一页"
				>
					<Icon icon="material-symbols:chevron-right-rounded" class="text-xl" />
				</button>
			</div>
			<p class="text-xs text-neutral-400 dark:text-neutral-500 mt-3 text-center">
				共 {totalImages} {texts.cloudGalleryImages || "张图片"}
			</p>
		</div>
	{/if}
{/if}

<!-- ============ Upload Panel Modal ============ -->
{#if showUploadPanel}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="cg-modal-backdrop" on:click|self={toggleUploadPanel}>
		<div class="cg-modal">
			<!-- Header -->
			<div class="cg-modal-header">
				<div class="flex items-center gap-3">
					<div
						class="w-9 h-9 rounded-xl bg-(--primary)/10 flex items-center justify-center"
					>
						<Icon
							icon="material-symbols:cloud-upload-rounded"
							class="w-5 h-5 text-(--primary)"
						/>
					</div>
					<div>
						<h2 class="text-base font-bold text-neutral-800 dark:text-neutral-200">
							{texts.cloudGalleryUploadTitle || "上传图片"}
						</h2>
						{#if currentSpace}
							<p class="text-xs text-neutral-400 dark:text-neutral-500">
								目标空间：{currentSpace.name}
							</p>
						{/if}
					</div>
				</div>
				<button
					on:click={toggleUploadPanel}
					class="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
				>
					<Icon
						icon="material-symbols:close-rounded"
						class="w-5 h-5 text-neutral-400 dark:text-neutral-500"
					/>
				</button>
			</div>

			<!-- Drop Zone -->
			<div class="px-6 py-4">
				<!-- svelte-ignore a11y-no-static-element-interactions -->
				<div
					class="cg-drop-zone"
					class:cg-drop-zone-active={isDragOver}
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
						<div
							class="w-14 h-14 rounded-2xl bg-(--primary)/10 flex items-center justify-center"
						>
							<Icon
								icon={isDragOver
									? "material-symbols:file-download-rounded"
									: "material-symbols:add-photo-alternate-outline-rounded"}
								class="w-7 h-7 text-(--primary)"
							/>
						</div>
						<div class="text-center">
							<p class="text-neutral-500 dark:text-neutral-400 text-sm">
								{isDragOver
									? "释放鼠标上传文件"
									: texts.cloudGalleryUploadDrop || "拖拽图片到此处"}
							</p>
							{#if !isDragOver}
								<button
									on:click={() => fileInput?.click()}
									class="text-(--primary) hover:underline text-sm font-medium mt-1"
								>
									{texts.cloudGalleryUploadSelect || "或点击选择文件"}
								</button>
							{/if}
							<p class="text-xs text-neutral-400 dark:text-neutral-500 mt-2">
								{texts.cloudGalleryUploadHint ||
									"JPG / PNG / GIF / WebP / SVG / AVIF · 最大 10MB"}
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- Upload Items List -->
			{#if uploadItems.length > 0}
				<div class="cg-upload-items-wrapper">
					<div class="flex items-center justify-between mb-3 px-6">
						<span class="text-xs text-neutral-400 dark:text-neutral-500">
							{uploadItems.length} 个文件
							{#if uploadItems.filter((i) => i.status === "success").length > 0}
								· {uploadItems.filter((i) => i.status === "success").length} 个完成
							{/if}
						</span>
						{#if uploadItems.some((i) => i.status === "success" || i.status === "error")}
							<button
								on:click={clearCompletedItems}
								class="text-xs text-(--primary) hover:underline"
							>
								{texts.cloudGalleryUploadClearDone || "清除已完成"}
							</button>
						{/if}
					</div>
					<div class="space-y-2 px-6">
						{#each uploadItems as item (item.id)}
							<div class="cg-upload-item group/item">
								<div class="cg-upload-preview">
									{#if item.previewUrl}
										<img
											src={item.previewUrl}
											alt={item.name}
											class="w-full h-full object-cover"
										/>
									{:else}
										<Icon
											icon="material-symbols:image-rounded"
											class="w-5 h-5 text-neutral-300 dark:text-neutral-600"
										/>
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<p
										class="text-sm font-medium text-neutral-700 dark:text-neutral-300 truncate"
									>
										{item.name}
									</p>
									<div class="flex items-center gap-2 mt-0.5">
										<span class="text-xs text-neutral-400"
											>{formatFileSize(item.size)}</span
										>
										{#if item.status === "uploading"}
											<div
												class="flex-1 h-1 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden"
											>
												<div
													class="h-full bg-(--primary) rounded-full transition-all duration-300"
													style="width: {item.progress}%"
												></div>
											</div>
											<span class="text-xs text-(--primary) font-medium"
												>{item.progress}%</span
											>
										{:else if item.status === "success"}
											<span
												class="text-xs text-emerald-500 flex items-center gap-0.5"
											>
												<Icon
													icon="material-symbols:check-circle-rounded"
													class="w-3 h-3"
												/>
												{texts.cloudGalleryUploadDone || "完成"}
											</span>
										{:else if item.status === "error"}
											<span
												class="text-xs text-red-400 flex items-center gap-0.5 truncate"
												title={item.errorMsg}
											>
												<Icon
													icon="material-symbols:error-rounded"
													class="w-3 h-3 flex-shrink-0"
												/>
												<span class="truncate"
													>{item.errorMsg ||
														texts.cloudGalleryUploadFailed ||
														"失败"}</span
												>
											</span>
										{:else}
											<span class="text-xs text-neutral-400"
												>{texts.cloudGalleryUploadPending || "等待中"}</span
											>
										{/if}
									</div>
								</div>
								<div class="flex items-center gap-1 flex-shrink-0">
									{#if item.status === "success" && item.url}
										<button
											on:click={() => item.url && copyToClipboard(item.url)}
											class="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
											title="复制链接"
										>
											<Icon
												icon="material-symbols:content-copy-rounded"
												class="w-3.5 h-3.5 text-(--primary)"
											/>
										</button>
									{/if}
									{#if item.status !== "uploading"}
										<button
											on:click={() => removeUploadItem(item.id)}
											class="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors opacity-0 group-hover/item:opacity-100"
											title="移除"
										>
											<Icon
												icon="material-symbols:close-rounded"
												class="w-3.5 h-3.5 text-red-400"
											/>
										</button>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Footer -->
			<div class="cg-modal-footer">
				<button on:click={() => fileInput?.click()} class="cg-footer-add-btn">
					<Icon icon="material-symbols:add-rounded" class="w-4 h-4" />
					<span>{texts.cloudGalleryUploadAdd || "添加"}</span>
				</button>
				<button
					on:click={startUpload}
					disabled={isUploading ||
						uploadItems.filter((i) => i.status === "pending").length === 0}
					class="cg-footer-upload-btn"
				>
					{#if isUploading}
						<div
							class="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
						></div>
						<span>{texts.cloudGalleryUploadUploading || "上传中..."}</span>
					{:else}
						<Icon icon="material-symbols:cloud-upload-rounded" class="w-4 h-4" />
						<span
							>{texts.cloudGalleryUploadStart || "上传"} ({uploadItems.filter(
								(i) => i.status === "pending",
							).length})</span
						>
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	/* ====== Space Tabs ====== */
	.cg-space-tab {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		height: 2.125rem;
		padding: 0 0.875rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--btn-content, rgba(0, 0, 0, 0.55));
		background: var(--btn-regular-bg, rgba(0, 0, 0, 0.04));
		border: 1px solid transparent;
		transition: all 0.2s ease;
		cursor: pointer;
	}
	.cg-space-tab:hover {
		color: var(--primary);
		background: color-mix(in srgb, var(--primary) 8%, transparent);
	}
	.cg-space-tab-active {
		color: var(--primary) !important;
		background: color-mix(in srgb, var(--primary) 12%, transparent) !important;
		border-color: color-mix(in srgb, var(--primary) 25%, transparent);
	}
	.cg-space-tab-count {
		font-size: 0.6875rem;
		opacity: 0.6;
		font-weight: 400;
	}
	.cg-upload-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		height: 2.125rem;
		padding: 0 0.875rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--primary);
		background: color-mix(in srgb, var(--primary) 8%, transparent);
		border: 1px solid color-mix(in srgb, var(--primary) 20%, transparent);
		transition: all 0.2s ease;
		cursor: pointer;
	}
	.cg-upload-btn:hover {
		background: color-mix(in srgb, var(--primary) 15%, transparent);
		border-color: color-mix(in srgb, var(--primary) 35%, transparent);
	}

	/* ====== Banner ====== */
	.cg-banner {
		border-radius: var(--radius-large, 1rem);
		overflow: hidden;
		box-shadow: 0 4px 24px -4px rgba(0, 0, 0, 0.1);
		transition: box-shadow 0.3s ease;
	}
	.cg-banner:hover {
		box-shadow: 0 8px 32px -4px rgba(0, 0, 0, 0.15);
	}
	.cg-banner-inner {
		position: relative;
		height: 14rem;
		overflow: hidden;
	}
	@media (min-width: 768px) {
		.cg-banner-inner {
			height: 18rem;
		}
	}
	.cg-banner-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0;
		transition: opacity 0.6s ease, transform 8s ease;
		position: relative;
		z-index: 1;
	}
	.cg-banner-img-loaded {
		opacity: 1;
	}
	.cg-banner:hover .cg-banner-img-loaded {
		transform: scale(1.03);
	}
	.cg-banner-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(
			to top,
			rgba(0, 0, 0, 0.65) 0%,
			rgba(0, 0, 0, 0.2) 40%,
			transparent 100%
		);
		z-index: 2;
	}
	.cg-banner-content {
		position: absolute;
		bottom: 1.25rem;
		left: 1.5rem;
		z-index: 3;
	}
	@media (min-width: 768px) {
		.cg-banner-content {
			bottom: 1.75rem;
			left: 2rem;
		}
	}
	.cg-banner-date {
		position: absolute;
		top: 1rem;
		right: 1rem;
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.25rem 0.625rem;
		border-radius: 9999px;
		background: rgba(0, 0, 0, 0.4);
		backdrop-filter: blur(8px);
		color: rgba(255, 255, 255, 0.85);
		font-size: 0.75rem;
		z-index: 3;
	}

	/* ====== Loading Skeleton ====== */
	.cg-loading-grid {
		columns: 2;
		gap: 0.75rem;
	}
	@media (min-width: 640px) {
		.cg-loading-grid {
			column-width: var(--cg-col-width, 240px);
			column-count: auto;
		}
	}
	.cg-skeleton-card {
		break-inside: avoid;
		margin-bottom: 0.75rem;
		border-radius: 0.75rem;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.03);
	}
	:global(.dark) .cg-skeleton-card {
		background: rgba(255, 255, 255, 0.04);
	}
	.cg-skeleton-img {
		width: 100%;
		padding-top: 75%;
		background: linear-gradient(
			110deg,
			transparent 30%,
			rgba(0, 0, 0, 0.04) 50%,
			transparent 70%
		);
		background-size: 200% 100%;
		animation: cg-shimmer 1.5s infinite;
	}
	:global(.dark) .cg-skeleton-img {
		background: linear-gradient(
			110deg,
			transparent 30%,
			rgba(255, 255, 255, 0.04) 50%,
			transparent 70%
		);
		background-size: 200% 100%;
	}
	@keyframes cg-shimmer {
		to {
			background-position: -200% 0;
		}
	}

	/* ====== Empty / Error State ====== */
	.cg-empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 4rem 1rem;
		text-align: center;
	}
	.cg-empty-icon {
		width: 5rem;
		height: 5rem;
		border-radius: 50%;
		background: rgba(0, 0, 0, 0.04);
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(0, 0, 0, 0.2);
	}
	:global(.dark) .cg-empty-icon {
		background: rgba(255, 255, 255, 0.04);
		color: rgba(255, 255, 255, 0.2);
	}
	.cg-empty-icon-error {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
	}
	.cg-action-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1.25rem;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: white;
		background: var(--primary);
		transition: all 0.2s ease;
		cursor: pointer;
	}
	.cg-action-btn:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}

	/* ====== Gallery Masonry Grid ====== */
	.cg-masonry-grid {
		column-count: 2;
		column-gap: 0.75rem;
	}
	@media (min-width: 640px) {
		.cg-masonry-grid {
			column-width: var(--cg-col-width, 240px);
			column-count: auto;
		}
	}

	/* ====== Photo Cards ====== */
	.cg-photo-inner {
		position: relative;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.cg-photo-inner:hover {
		box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.12);
		transform: translateY(-3px);
	}
	:global(.dark) .cg-photo-inner:hover {
		box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.3);
	}
	.cg-format-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		padding: 0.125rem 0.5rem;
		border-radius: 9999px;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		color: white;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.03em;
		z-index: 2;
	}
	.cg-photo-hover {
		position: absolute;
		inset: 0;
		background: rgba(0, 0, 0, 0);
		transition: background 0.3s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 2;
	}
	.cg-photo-inner:hover .cg-photo-hover {
		background: rgba(0, 0, 0, 0.25);
	}
	.cg-photo-hover-icon {
		opacity: 0;
		transform: scale(0.8);
		transition: all 0.3s ease;
	}
	.cg-photo-inner:hover .cg-photo-hover-icon {
		opacity: 1;
		transform: scale(1);
	}
	.cg-photo-info {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 2rem 0.625rem 0.5rem;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		z-index: 2;
		opacity: 0;
		transform: translateY(4px);
		transition: all 0.3s ease;
	}
	.cg-photo-inner:hover .cg-photo-info {
		opacity: 1;
		transform: translateY(0);
	}
	.cg-photo-name {
		font-size: 0.6875rem;
		color: rgba(255, 255, 255, 0.9);
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 65%;
	}
	.cg-photo-meta {
		font-size: 0.625rem;
		color: rgba(255, 255, 255, 0.6);
		flex-shrink: 0;
	}

	/* ====== Pagination ====== */
	.cg-pagination-wrapper {
		padding: 1rem 0 0.5rem;
	}
	.cg-pagination {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.375rem;
	}
	.cg-page-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		min-width: 2.25rem;
		height: 2.25rem;
		padding: 0 0.25rem;
		border-radius: 0.5rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: rgba(0, 0, 0, 0.5);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.2s ease;
	}
	:global(.dark) .cg-page-btn {
		color: rgba(255, 255, 255, 0.5);
	}
	.cg-page-btn:hover:not(:disabled):not(.cg-page-active) {
		background: rgba(0, 0, 0, 0.05);
		color: var(--primary);
	}
	:global(.dark) .cg-page-btn:hover:not(:disabled):not(.cg-page-active) {
		background: rgba(255, 255, 255, 0.05);
	}
	.cg-page-btn:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}
	.cg-page-active {
		background: var(--primary) !important;
		color: white !important;
		font-weight: 700;
		cursor: default;
	}
	:global(.dark) .cg-page-active {
		color: rgba(0, 0, 0, 0.7) !important;
	}
	.cg-page-nav {
		color: var(--primary);
	}
	.cg-page-ellipsis {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 2rem;
		color: rgba(0, 0, 0, 0.25);
		font-size: 0.875rem;
	}
	:global(.dark) .cg-page-ellipsis {
		color: rgba(255, 255, 255, 0.25);
	}

	/* ====== Upload Modal ====== */
	.cg-modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(8px);
		z-index: 50;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1rem;
	}
	.cg-modal {
		background: var(--card-bg, #fff);
		border-radius: var(--radius-large, 1.25rem);
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
		width: 100%;
		max-width: 36rem;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.cg-modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .cg-modal-header {
		border-bottom-color: rgba(255, 255, 255, 0.06);
	}
	.cg-drop-zone {
		border: 2px dashed rgba(0, 0, 0, 0.12);
		border-radius: var(--radius-large, 1rem);
		padding: 2rem 1rem;
		text-align: center;
		transition: all 0.3s ease;
		cursor: pointer;
	}
	:global(.dark) .cg-drop-zone {
		border-color: rgba(255, 255, 255, 0.1);
	}
	.cg-drop-zone:hover {
		border-color: color-mix(in srgb, var(--primary) 40%, transparent);
		background: color-mix(in srgb, var(--primary) 3%, transparent);
	}
	.cg-drop-zone-active {
		border-color: var(--primary) !important;
		background: color-mix(in srgb, var(--primary) 6%, transparent) !important;
		transform: scale(1.01);
	}
	.cg-upload-items-wrapper {
		flex: 1;
		overflow-y: auto;
		min-height: 0;
		padding-bottom: 0.5rem;
	}
	.cg-upload-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.625rem;
		border-radius: 0.75rem;
		background: rgba(0, 0, 0, 0.02);
		transition: background 0.2s ease;
	}
	:global(.dark) .cg-upload-item {
		background: rgba(255, 255, 255, 0.02);
	}
	.cg-upload-item:hover {
		background: rgba(0, 0, 0, 0.04);
	}
	:global(.dark) .cg-upload-item:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.cg-upload-preview {
		width: 2.75rem;
		height: 2.75rem;
		border-radius: 0.5rem;
		overflow: hidden;
		background: rgba(0, 0, 0, 0.04);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}
	:global(.dark) .cg-upload-preview {
		background: rgba(255, 255, 255, 0.04);
	}
	.cg-modal-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-top: 1px solid rgba(0, 0, 0, 0.06);
	}
	:global(.dark) .cg-modal-footer {
		border-top-color: rgba(255, 255, 255, 0.06);
	}
	.cg-footer-add-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1rem;
		border-radius: 0.625rem;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--btn-content, rgba(0, 0, 0, 0.55));
		background: var(--btn-regular-bg, rgba(0, 0, 0, 0.04));
		border: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}
	.cg-footer-add-btn:hover {
		background: var(--btn-regular-bg-hover, rgba(0, 0, 0, 0.08));
	}
	.cg-footer-upload-btn {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		padding: 0.5rem 1.25rem;
		border-radius: 0.625rem;
		font-size: 0.8125rem;
		font-weight: 600;
		color: white;
		background: var(--primary);
		border: none;
		transition: all 0.2s ease;
		cursor: pointer;
	}
	.cg-footer-upload-btn:hover:not(:disabled) {
		opacity: 0.9;
	}
	.cg-footer-upload-btn:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* ====== Scrollbar ====== */
	.cg-upload-items-wrapper::-webkit-scrollbar {
		width: 4px;
	}
	.cg-upload-items-wrapper::-webkit-scrollbar-track {
		background: transparent;
	}
	.cg-upload-items-wrapper::-webkit-scrollbar-thumb {
		background-color: rgba(0, 0, 0, 0.1);
		border-radius: 2px;
	}
	:global(.dark) .cg-upload-items-wrapper::-webkit-scrollbar-thumb {
		background-color: rgba(255, 255, 255, 0.1);
	}
</style>
