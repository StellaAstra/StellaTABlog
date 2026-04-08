// Cloudflare Pages Function: Self-hosted Meting API
// Path: /api/meting
// Supports: NetEase Cloud Music (netease)

type Env = {};

// Cloudflare Workers type declarations
declare type PagesFunction<E = unknown> = (context: {
	request: Request;
	env: E;
	params: Record<string, string>;
	waitUntil: (promise: Promise<unknown>) => void;
	next: () => Promise<Response>;
}) => Promise<Response> | Response;

// CORS headers
const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Methods": "GET, OPTIONS",
	"Access-Control-Allow-Headers": "Content-Type",
	"Content-Type": "application/json; charset=utf-8",
};

// NetEase Cloud Music API endpoints
const NETEASE_API = {
	playlist: "https://music.163.com/api/v6/playlist/detail",
	song: "https://music.163.com/api/song/detail",
	album: "https://music.163.com/api/album",
	artist: "https://music.163.com/api/artist",
	search: "https://music.163.com/api/search/get",
	lyric: "https://music.163.com/api/song/lyric",
};

// Common headers for NetEase requests
const neteaseHeaders: Record<string, string> = {
	"User-Agent":
		"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
	Referer: "https://music.163.com/",
	"Content-Type": "application/x-www-form-urlencoded",
	Cookie: "appver=2.7.1.198277; os=pc;",
};

// ── NetEase Cloud Music handlers ──

async function neteasePlaylist(id: string): Promise<MetingSong[]> {
	const body = `id=${id}&n=1000&s=0`;
	const res = await fetch(NETEASE_API.playlist, {
		method: "POST",
		headers: neteaseHeaders,
		body,
	});

	if (!res.ok) throw new Error(`NetEase API error: ${res.status}`);
	const data = (await res.json()) as any;

	if (!data.playlist?.tracks) {
		throw new Error("No tracks found in playlist");
	}

	const tracks = data.playlist.tracks;
	const songs: MetingSong[] = [];

	for (const track of tracks) {
		songs.push({
			name: track.name || "Unknown",
			artist:
				(track.ar || track.artists || []).map((a: any) => a.name).join(", ") ||
				"Unknown",
			url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
			pic: track.al?.picUrl ? `${track.al.picUrl}?param=300x300` : "",
			lrc: track.id
				? `https://music.163.com/api/song/lyric?id=${track.id}&lv=1&tv=1`
				: "",
			id: track.id,
		});
	}

	return songs;
}

async function neteaseSong(id: string): Promise<MetingSong[]> {
	const ids = id.split(",").map((i) => i.trim());
	const body = `ids=[${ids.join(",")}]&c=${JSON.stringify(ids.map((i) => ({ id: i })))}`;
	const res = await fetch(NETEASE_API.song, {
		method: "POST",
		headers: neteaseHeaders,
		body,
	});

	if (!res.ok) throw new Error(`NetEase API error: ${res.status}`);
	const data = (await res.json()) as any;

	if (!data.songs) throw new Error("No songs found");

	return data.songs.map((track: any) => ({
		name: track.name || "Unknown",
		artist:
			(track.ar || track.artists || []).map((a: any) => a.name).join(", ") ||
			"Unknown",
		url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
		pic: track.al?.picUrl ? `${track.al.picUrl}?param=300x300` : "",
		lrc: `https://music.163.com/api/song/lyric?id=${track.id}&lv=1&tv=1`,
		id: track.id,
	}));
}

async function neteaseAlbum(id: string): Promise<MetingSong[]> {
	const res = await fetch(`${NETEASE_API.album}/${id}`, {
		method: "GET",
		headers: neteaseHeaders,
	});

	if (!res.ok) throw new Error(`NetEase API error: ${res.status}`);
	const data = (await res.json()) as any;

	if (!data.songs) throw new Error("No songs found in album");

	return data.songs.map((track: any) => ({
		name: track.name || "Unknown",
		artist:
			(track.ar || track.artists || []).map((a: any) => a.name).join(", ") ||
			"Unknown",
		url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
		pic: data.album?.picUrl ? `${data.album.picUrl}?param=300x300` : "",
		lrc: `https://music.163.com/api/song/lyric?id=${track.id}&lv=1&tv=1`,
		id: track.id,
	}));
}

async function neteaseArtist(id: string): Promise<MetingSong[]> {
	const res = await fetch(`${NETEASE_API.artist}/${id}`, {
		method: "GET",
		headers: neteaseHeaders,
	});

	if (!res.ok) throw new Error(`NetEase API error: ${res.status}`);
	const data = (await res.json()) as any;

	if (!data.hotSongs) throw new Error("No songs found for artist");

	return data.hotSongs.map((track: any) => ({
		name: track.name || "Unknown",
		artist:
			(track.ar || track.artists || []).map((a: any) => a.name).join(", ") ||
			"Unknown",
		url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
		pic: track.al?.picUrl ? `${track.al.picUrl}?param=300x300` : "",
		lrc: `https://music.163.com/api/song/lyric?id=${track.id}&lv=1&tv=1`,
		id: track.id,
	}));
}

async function neteaseSearch(keyword: string): Promise<MetingSong[]> {
	const body = `s=${encodeURIComponent(keyword)}&type=1&limit=30&offset=0`;
	const res = await fetch(NETEASE_API.search, {
		method: "POST",
		headers: neteaseHeaders,
		body,
	});

	if (!res.ok) throw new Error(`NetEase API error: ${res.status}`);
	const data = (await res.json()) as any;

	if (!data.result?.songs) throw new Error("No search results");

	return data.result.songs.map((track: any) => ({
		name: track.name || "Unknown",
		artist:
			(track.artists || []).map((a: any) => a.name).join(", ") || "Unknown",
		url: `https://music.163.com/song/media/outer/url?id=${track.id}.mp3`,
		pic: track.album?.artist?.img1v1Url
			? `${track.album.artist.img1v1Url}?param=300x300`
			: "",
		lrc: `https://music.163.com/api/song/lyric?id=${track.id}&lv=1&tv=1`,
		id: track.id,
	}));
}

// ── Lyric fetcher (resolves lyric URLs to actual LRC text) ──

async function fetchNeteaseLyric(songId: string): Promise<string> {
	const url = `${NETEASE_API.lyric}?id=${songId}&lv=1&tv=1`;
	const res = await fetch(url, {
		method: "GET",
		headers: neteaseHeaders,
	});

	if (!res.ok) return "";
	const data = (await res.json()) as any;
	return data.lrc?.lyric || "";
}

// ── Types ──

interface MetingSong {
	name: string;
	artist: string;
	url: string;
	pic: string;
	lrc: string;
	id?: number;
}

// ── Main handler ──

export const onRequestGet: PagesFunction<Env> = async (context) => {
	const url = new URL(context.request.url);
	const params = url.searchParams;

	// Handle CORS preflight
	if (context.request.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders });
	}

	const server = params.get("server") || "netease";
	const type = params.get("type") || "playlist";
	const id = params.get("id") || "";

	if (!id) {
		return new Response(
			JSON.stringify({ error: "Missing required parameter: id" }),
			{ status: 400, headers: corsHeaders },
		);
	}

	try {
		let songs: MetingSong[] = [];

		if (server === "netease") {
			switch (type) {
				case "playlist":
					songs = await neteasePlaylist(id);
					break;
				case "song":
					songs = await neteaseSong(id);
					break;
				case "album":
					songs = await neteaseAlbum(id);
					break;
				case "artist":
					songs = await neteaseArtist(id);
					break;
				case "search":
					songs = await neteaseSearch(id);
					break;
				default:
					return new Response(
						JSON.stringify({ error: `Unsupported type: ${type}` }),
						{ status: 400, headers: corsHeaders },
					);
			}
		} else {
			return new Response(
				JSON.stringify({
					error: `Server "${server}" is not yet supported. Currently only "netease" is supported.`,
				}),
				{ status: 400, headers: corsHeaders },
			);
		}

		// Resolve lyrics: fetch actual LRC text for each song
		const withLyrics = params.get("lrc") !== "0";
		if (withLyrics && songs.length > 0) {
			// Batch fetch lyrics (limit concurrency to avoid rate limiting)
			const batchSize = 5;
			for (let i = 0; i < songs.length; i += batchSize) {
				const batch = songs.slice(i, i + batchSize);
				const lrcPromises = batch.map(async (song) => {
					if (song.id) {
						try {
							song.lrc = await fetchNeteaseLyric(String(song.id));
						} catch {
							song.lrc = "";
						}
					}
				});
				await Promise.all(lrcPromises);
			}
		}

		// Format output to match standard Meting API format
		const result = songs.map((song) => ({
			name: song.name,
			title: song.name,
			artist: song.artist,
			author: song.artist,
			url: song.url,
			pic: song.pic,
			cover: song.pic,
			lrc: song.lrc,
		}));

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: {
				...corsHeaders,
				"Cache-Control": "public, max-age=3600", // Cache for 1 hour
			},
		});
	} catch (error: any) {
		console.error("Meting API error:", error);
		return new Response(
			JSON.stringify({
				error: error.message || "Internal server error",
				server,
				type,
				id,
			}),
			{ status: 500, headers: corsHeaders },
		);
	}
};

// Handle OPTIONS for CORS
export const onRequestOptions: PagesFunction<Env> = async () => {
	return new Response(null, { headers: corsHeaders });
};
