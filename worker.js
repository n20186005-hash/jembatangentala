// Cloudflare Worker: serves static assets and proxies Open-Meteo weather
// with server-side caching so visitors never see API details.

const COORDS = {
  lat: -1.5866286,
  lon: 103.6157117,
  tz: "Asia/Jakarta",
};

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=" + COORDS.lat +
  "&longitude=" + COORDS.lon +
  "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,uv_index_max,sunrise,sunset" +
  "&timezone=" + COORDS.tz +
  "&forecast_days=7";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/weather") {
      return handleWeather(ctx);
    }

    // Everything else is served as a static asset.
    return env.ASSETS.fetch(request);
  },
};

async function handleWeather(ctx) {
  const cache = caches.default;
  const cacheKey = new Request(WEATHER_URL, { method: "GET" });

  let response = await cache.match(cacheKey);
  let cached = false;

  if (!response) {
    try {
      const upstream = await fetch(WEATHER_URL, { cf: { cacheTtl: 600 } });
      if (!upstream.ok) {
        return new Response(
          JSON.stringify({ error: "weather_unavailable" }),
          { status: 502, headers: { "content-type": "application/json" } }
        );
      }
      const body = await upstream.arrayBuffer();
      const headers = { "content-type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=600" };
      const toStore = new Response(body, { status: 200, headers });
      ctx.waitUntil(cache.put(cacheKey, toStore.clone()));
      response = new Response(body, { status: 200, headers });
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "weather_unavailable" }),
        { status: 502, headers: { "content-type": "application/json" } }
      );
    }
  } else {
    cached = true;
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "weather_unavailable" }),
      { status: 502, headers: { "content-type": "application/json" } }
    );
  }

  const out = {
    current: data.current,
    daily: data.daily,
    timezone: data.timezone,
    cached,
  };

  return new Response(JSON.stringify(out), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
