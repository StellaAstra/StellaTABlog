<script lang="ts">
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import Icon from "@iconify/svelte";
import {
	getDefaultHighlightEnabled,
	getDefaultHue,
	getDefaultWavesEnabled,
	getHue,
	getStoredHighlightEnabled,
	getStoredWavesEnabled,
	setHighlightEnabled,
	setHue,
	setWavesEnabled,
} from "@utils/setting-utils.ts";
import { onMount } from "svelte";
import { siteConfig } from "@/config";

// ==================== Theme Color ====================
let hue = $state(getHue());
const defaultHue = getDefaultHue();
const showThemeColor = !siteConfig.themeColor.fixed;

// ==================== Waves Animation ====================
let wavesEnabled = $state(true);
const defaultWavesEnabled = getDefaultWavesEnabled();

// ==================== Top Highlight ====================
let highlightEnabled = $state(true);
const defaultHighlightEnabled = getDefaultHighlightEnabled();

// ==================== Banner Settings Logic ====================
const hasBannerSettings = siteConfig.banner.enable;
let bannerSettingsIsDefault = $derived(
	wavesEnabled === defaultWavesEnabled && highlightEnabled === defaultHighlightEnabled
);

// ==================== Panel Visibility ====================
const hasAnyContent = showThemeColor || hasBannerSettings;

// ==================== Functions ====================
function resetHue() {
	hue = getDefaultHue();
}

function resetBannerSettings() {
	if (wavesEnabled !== defaultWavesEnabled) {
		wavesEnabled = defaultWavesEnabled;
		setWavesEnabled(defaultWavesEnabled);
	}
	if (highlightEnabled !== defaultHighlightEnabled) {
		highlightEnabled = defaultHighlightEnabled;
		setHighlightEnabled(defaultHighlightEnabled);
	}
}

function toggleWavesEnabled() {
	wavesEnabled = !wavesEnabled;
	setWavesEnabled(wavesEnabled);
}

function toggleHighlightEnabled() {
	highlightEnabled = !highlightEnabled;
	setHighlightEnabled(highlightEnabled);
}

// ==================== Lifecycle ====================
onMount(() => {
	wavesEnabled = getStoredWavesEnabled();
	highlightEnabled = getStoredHighlightEnabled();
});

// ==================== Effects ====================
$effect(() => {
	if (hue || hue === 0) {
		setHue(hue);
	}
});
</script>

{#if hasAnyContent}
<div id="display-setting" class="float-panel float-panel-closed absolute transition-all w-80 right-4 px-4 py-2">

    <!-- Theme Color Section -->
    {#if showThemeColor}
    <div class="mt-2 mb-2">
        <div class="flex flex-row gap-2 mb-2 items-center justify-between">
            <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3
                before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
                before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2"
            >
                {i18n(I18nKey.themeColor)}
                <button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md active:scale-90 will-change-transform"
                        class:opacity-0={hue === defaultHue} class:pointer-events-none={hue === defaultHue} onclick={resetHue}>
                    <div class="text-[var(--btn-content)]">
                        <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                    </div>
                </button>
            </div>
            <div class="flex gap-1">
                <div id="hueValue" class="transition bg-[var(--btn-regular-bg)] w-10 h-7 rounded-md flex justify-center
                font-bold text-sm items-center text-[var(--btn-content)]">
                    {hue}
                </div>
            </div>
        </div>
        <div class="w-full h-6 px-1 bg-[oklch(0.80_0.10_0)] dark:bg-[oklch(0.70_0.10_0)] rounded select-none">
            <input aria-label={i18n(I18nKey.themeColor)} type="range" min="0" max="360" bind:value={hue}
                   class="slider" id="colorSlider" step="5" style="width: 100%">
        </div>
    </div>
    {/if}

    <!-- Banner Settings Section -->
    {#if hasBannerSettings}
    <div class="mt-2 mb-2">
        <div class="flex gap-2 font-bold text-lg text-neutral-900 dark:text-neutral-100 transition relative ml-3 mb-2
            before:w-1 before:h-4 before:rounded-md before:bg-[var(--primary)]
            before:absolute before:-left-3 before:top-1/2 before:-translate-y-1/2"
        >
            {i18n(I18nKey.bannerSettings)}
            <button aria-label="Reset to Default" class="btn-regular w-7 h-7 rounded-md active:scale-90 will-change-transform"
                    class:opacity-0={bannerSettingsIsDefault} class:pointer-events-none={bannerSettingsIsDefault} onclick={resetBannerSettings}>
                <div class="text-[var(--btn-content)]">
                    <Icon icon="fa6-solid:arrow-rotate-left" class="text-[0.875rem]"></Icon>
                </div>
            </button>
        </div>
        <div class="space-y-1">
            <!-- Waves Animation Switch -->
            <button
                class="w-full btn-regular rounded-md py-2 px-3 flex items-center gap-3 text-left active:scale-95 transition-all relative overflow-hidden"
                class:bg-[var(--btn-regular-bg-hover)]={wavesEnabled}
                onclick={toggleWavesEnabled}
            >
                <Icon icon="material-symbols:airwave-rounded" class="text-[1.25rem] shrink-0"></Icon>
                <span class="text-sm flex-1">{i18n(I18nKey.wavesAnimation)}</span>
                <div class="w-10 h-5 rounded-full transition-all duration-200 relative"
                     class:bg-[var(--primary)]={wavesEnabled}
                     class:bg-[var(--btn-regular-bg-active)]={!wavesEnabled}>
                    <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                         class:left-0.5={!wavesEnabled}
                         class:left-5={wavesEnabled}></div>
                </div>
            </button>

            <!-- Top Highlight Switch -->
            <button
                class="w-full btn-regular rounded-md py-2 px-3 flex items-center gap-3 text-left active:scale-95 transition-all relative overflow-hidden"
                class:bg-[var(--btn-regular-bg-hover)]={highlightEnabled}
                onclick={toggleHighlightEnabled}
            >
                <Icon icon="material-symbols:gradient" class="text-[1.25rem] shrink-0"></Icon>
                <span class="text-sm flex-1">{i18n(I18nKey.topHighlight)}</span>
                <div class="w-10 h-5 rounded-full transition-all duration-200 relative"
                     class:bg-[var(--primary)]={highlightEnabled}
                     class:bg-[var(--btn-regular-bg-active)]={!highlightEnabled}>
                    <div class="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-200"
                         class:left-0.5={!highlightEnabled}
                         class:left-5={highlightEnabled}></div>
                </div>
            </button>
        </div>
    </div>
    {/if}

</div>
{/if}


<style lang="stylus">
    #display-setting
      input[type="range"]
        -webkit-appearance none
        height 1.5rem
        background-image var(--color-selection-bar)
        transition background-image 0.15s ease-in-out

        /* Input Thumb */
        &::-webkit-slider-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-moz-range-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          border-width 0
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

        &::-ms-thumb
          -webkit-appearance none
          height 1rem
          width 0.5rem
          border-radius 0.125rem
          background rgba(255, 255, 255, 0.7)
          box-shadow none
          &:hover
            background rgba(255, 255, 255, 0.8)
          &:active
            background rgba(255, 255, 255, 0.6)

</style>
