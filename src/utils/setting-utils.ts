import {
	AUTO_MODE,
	DARK_MODE,
	DEFAULT_THEME,
	LIGHT_MODE,
} from "@constants/constants.ts";
import { expressiveCodeConfig } from "@/config";
import type { LIGHT_DARK_MODE } from "@/types/config";

export function getDefaultHue(): number {
	const fallback = "250";
	const configCarrier = document.getElementById("config-carrier");
	return Number.parseInt(configCarrier?.dataset.hue || fallback, 10);
}

export function getHue(): number {
	const stored = localStorage.getItem("hue");
	return stored ? Number.parseInt(stored, 10) : getDefaultHue();
}

export function setHue(hue: number): void {
	localStorage.setItem("hue", String(hue));
	const r = document.querySelector(":root") as HTMLElement;
	if (!r) {
		return;
	}
	r.style.setProperty("--hue", String(hue));
}

export function applyThemeToDocument(theme: LIGHT_DARK_MODE) {
	switch (theme) {
		case LIGHT_MODE:
			document.documentElement.classList.remove("dark");
			break;
		case DARK_MODE:
			document.documentElement.classList.add("dark");
			break;
		case AUTO_MODE:
			if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
			break;
	}

	// Set the theme for Expressive Code
	document.documentElement.setAttribute(
		"data-theme",
		expressiveCodeConfig.theme,
	);
}

export function setTheme(theme: LIGHT_DARK_MODE): void {
	localStorage.setItem("theme", theme);
	applyThemeToDocument(theme);
}

export function getStoredTheme(): LIGHT_DARK_MODE {
	return (localStorage.getItem("theme") as LIGHT_DARK_MODE) || DEFAULT_THEME;
}

// ==================== 水波纹动画开关 ====================

export function getDefaultWavesEnabled(): boolean {
	return true;
}

export function getStoredWavesEnabled(): boolean {
	const stored = localStorage.getItem("wavesEnabled");
	if (stored === null) return getDefaultWavesEnabled();
	return stored === "true";
}

export function setWavesEnabled(enabled: boolean): void {
	localStorage.setItem("wavesEnabled", String(enabled));
	applyWavesState(enabled);
}

export function applyWavesState(enabled: boolean): void {
	const wavesContainer = document.getElementById("header-waves");
	if (!wavesContainer) return;

	if (enabled) {
		wavesContainer.style.display = "";
		wavesContainer.style.opacity = "1";
	} else {
		wavesContainer.style.opacity = "0";
		// 等待过渡动画结束后隐藏
		setTimeout(() => {
			if (!getStoredWavesEnabled()) {
				wavesContainer.style.display = "none";
			}
		}, 300);
	}
}

// ==================== 顶部高光开关 ====================

export function getDefaultHighlightEnabled(): boolean {
	return true;
}

export function getStoredHighlightEnabled(): boolean {
	const stored = localStorage.getItem("highlightEnabled");
	if (stored === null) return getDefaultHighlightEnabled();
	return stored === "true";
}

export function setHighlightEnabled(enabled: boolean): void {
	localStorage.setItem("highlightEnabled", String(enabled));
	applyHighlightState(enabled);
}

export function applyHighlightState(enabled: boolean): void {
	const highlight = document.querySelector(".top-gradient-highlight") as HTMLElement;
	if (!highlight) return;

	if (enabled) {
		highlight.style.display = "";
		highlight.style.opacity = "1";
	} else {
		highlight.style.opacity = "0";
		setTimeout(() => {
			if (!getStoredHighlightEnabled()) {
				highlight.style.display = "none";
			}
		}, 300);
	}
}
