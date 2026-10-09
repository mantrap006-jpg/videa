export function extractYouTubeId(input) {
  try {
    const url = new URL(input);
    const host = url.hostname.replace("www.", "");

    if (host === "youtu.be") {
      return url.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (url.pathname === "/watch") return url.searchParams.get("v");
      if (url.pathname.startsWith("/shorts/")) return url.pathname.split("/")[2];
      if (url.pathname.startsWith("/embed/")) return url.pathname.split("/")[2];
    }
  } catch {}

  return null;
}

function parseYouTubeDuration(isoDuration) {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(isoDuration || "");
  if (!match) return 0;

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  return hours * 3600 + minutes * 60 + seconds;
}

export async function getYouTubeDurationSeconds(videoId) {
  const apiKey = process.env.YOUTUBE_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    throw new Error("YouTube duration verification requires YOUTUBE_API_KEY (or GOOGLE_API_KEY) in the server environment.");
  }

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "contentDetails");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({}));
    throw new Error(details.error?.message || "YouTube duration lookup failed.");
  }

  const data = await response.json();
  const item = data.items?.[0];

  if (!item?.contentDetails?.duration) {
    throw new Error("YouTube video was not found or has no duration.");
  }

  const durationSeconds = parseYouTubeDuration(item.contentDetails.duration);

  if (!durationSeconds) {
    throw new Error("YouTube returned an invalid video duration.");
  }

  return durationSeconds;
}
