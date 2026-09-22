// Weather widget: fetches /api/weather (already cached server-side) and renders
// a visitor-facing summary plus automatic, condition-triggered advice.
// No API provider details are surfaced to visitors.
(function () {
  "use strict";

  var LANG = (document.documentElement.lang || "id").slice(0, 2);
  var T =
    LANG === "en"
      ? {
          loading: "Loading weather…",
          err: "Weather is unavailable right now. Please try again later.",
          note: "Forecasts can change; recheck before you leave.",
          today: "Today",
          feels: "feels like",
          wind: "Wind",
          humidity: "Humidity",
          precip: "Rain",
          uv: "UV",
          alertLabel: "⚠️ Alert",
          blockOutfit: "👕 What to wear",
          blockActivity: "🗺️ Plan your visit",
          blockItems: "🎒 What to bring",
          a_pProb: "High chance of rain—prefer covered riverfront walkways or indoor spaces; delay open-air plans.",
          i_pProb: "Umbrella / raincoat",
          a_drizzle: "Light rain; paths and decks are slippery, walk carefully.",
          i_drizzle: "Folding umbrella",
          r_rain: "Heavy rain; avoid low spots & slippery river edges; boat tours may stop.",
          i_rain: "Raincoat (long umbrella awkward in wind)",
          r_storm: "Watch for lightning; don't shelter under trees or play at the river edge; water rides likely closed.",
          i_storm: "Raincoat",
          o_hot: "High temperature; wear light, breathable clothing.",
          a_hot: "Avoid going out in the midday heat (roughly 11–15).",
          i_hot: "Enough drinking water, heat protection",
          a_uv: "UV is fairly strong; protect your skin.",
          i_uv: "Sunscreen, sunglasses, hat",
          o_diff: "Big day–night temperature swing; bring a light jacket to add or remove.",
          o_cold: "Low temperature; keep warm.",
          i_cold: "Thick jacket, scarf",
          a_windStrong: "Quite windy at the riverfront and open areas; boats & open rides may stop; hats blow away easily.",
          r_windGale: "Strong wind; stay away from signs, riverbank rocks & beyond railings; open water rides likely closed.",
          a_clear: "Clear; great for riverside walks and open sightseeing, plus sunrise/sunset views.",
          i_clear: "Don't forget sunscreen",
          a_overcast: "Soft light; great for photos and long outdoor strolls without the glare.",
          r_fog: "Rare here, but if foggy: short visibility, ferries & flights easily delayed; poor for distant views.",
          i_fog: "Mask",
          r_alert: function (n) {
            return "Weather alert: " + n + " has been issued. Adjust your plans, avoid river-edge & low areas, and watch the forecast.";
          },
        }
      : {
          loading: "Memuat cuaca…",
          err: "Cuaca tidak dapat dimuat saat ini. Coba lagi nanti.",
          note: "Prakiraan dapat berubah; verifikasi menjelang keberangkatan.",
          today: "Hari ini",
          feels: "terasa",
          wind: "Angin",
          humidity: "Lembap",
          precip: "Hujan",
          uv: "UV",
          alertLabel: "⚠️ Perhatian",
          blockOutfit: "👕 Tips berpakaian",
          blockActivity: "🗺️ Rencana kunjungan",
          blockItems: "🎒 Barang bawaan",
          a_pProb: "Peluang hujan tinggi, utamakan jalur tepi sungai beratap atau ruang tertutup; tunda aktivitas terbuka.",
          i_pProb: "Payung / jas hujan",
          a_drizzle: "Hujan rintik; jalan dan dek licin, berjalan hati-hati.",
          i_drizzle: "Payung lipat",
          r_rain: "Hujan cukup deras; hindari bagian rendah & tepi sungai yang licin; perahu wisata mungkin berhenti.",
          i_rain: "Jas hujan (tiang panjang kurang cocok saat berangin)",
          r_storm: "Waspada petir; jangan berteduh di bawah pohon atau bermain air tepi sungai; wahana air kemungkinan ditutup.",
          i_storm: "Jas hujan",
          o_hot: "Suhu tinggi; kenakan pakaian tipis & bernapas.",
          a_hot: "Hindari keluar saat siang terik (sekitar 11–15).",
          i_hot: "Air minum cukup, perlengkapan anti-panas",
          a_uv: "UV cukup kuat, lindungi kulit dari sinar matahari.",
          i_uv: "Sunblock, kacamata hitam, topi",
          o_diff: "Suhu berbeda jauh antara siang & malam; bawa jaket tipis untuk ganti.",
          o_cold: "Suhu rendah; jaga kehangatan tubuh.",
          i_cold: "Jaket tebal, syal",
          a_windStrong: "Angin cukup kencang di tepi & tempat terbuka; perahu & wahana terbuka mungkin berhenti; topi mudah tertiup.",
          r_windGale: "Angin kencang; jauhi papan reklame, batu karang tepi sungai & luar pagar; wahana air terbuka kemungkinan ditutup.",
          a_clear: "Cerah; cocok untuk jalan kaki tepi sungai & wisata terbuka, juga menikmati matahari terbit/terbenam.",
          i_clear: "Jangan lupa sunblock",
          a_overcast: "Cahaya lembut; sangat cocok untuk foto & jalan lama di luar tanpa terik.",
          r_fog: "Jarang di sini, tapi jika berkabut: jarak pandang pendek, kapal feri & penerbangan mudah tertunda; kurang cocok memandang jauh.",
          i_fog: "Masker",
          r_alert: function (n) {
            return "Peringatan cuaca: " + n + " telah dikeluarkan. Sesuaikan rencana, hindari tepi sungai & area rendah, dan pantau perkembangan cuaca.";
          },
        };

  function wmo(code, isDay) {
    var map = {
      0: ["☀️", "Cerah", "Clear"],
      1: ["🌤️", "Cerah berawan", "Mainly clear"],
      2: ["⛅", "Berawan sebagian", "Partly cloudy"],
      3: ["☁️", "Mendung", "Overcast"],
      45: ["🌫️", "Berkabut", "Fog"],
      48: ["🌫️", "Berkabut embun", "Rime fog"],
      51: ["🌦️", "Rintik", "Drizzle"],
      53: ["🌦️", "Rintik sedang", "Drizzle"],
      55: ["🌧️", "Rintik lebat", "Drizzle"],
      56: ["🌧️", "Rintik beku", "Freezing drizzle"],
      57: ["🌧️", "Rintik beku", "Freezing drizzle"],
      61: ["🌧️", "Hujan ringan", "Light rain"],
      63: ["🌧️", "Hujan sedang", "Rain"],
      65: ["🌧️", "Hujan lebat", "Heavy rain"],
      66: ["🌧️", "Hujan beku", "Freezing rain"],
      67: ["🌧️", "Hujan beku", "Freezing rain"],
      71: ["🌨️", "Salju", "Snow"],
      73: ["🌨️", "Salju", "Snow"],
      75: ["🌨️", "Salju lebat", "Snow"],
      77: ["🌨️", "Butir salju", "Snow grains"],
      80: ["🌦️", "Hujan singkat", "Rain showers"],
      81: ["🌧️", "Hujan deras", "Showers"],
      82: ["⛈️", "Hujan sangat deras", "Violent showers"],
      85: ["🌨️", "Hujan salju", "Snow showers"],
      86: ["🌨️", "Hujan salju", "Snow showers"],
      95: ["⛈️", "Badai petir", "Thunderstorm"],
      96: ["⛈️", "Badai petir hujan es", "Thunderstorm w/ hail"],
      99: ["⛈️", "Badai petir hujan es", "Thunderstorm w/ hail"],
    };
    var e = map[code] || ["🌡️", "—", "—"];
    if (!isDay && (code === 0 || code === 1)) e = ["🌙", "Cerah malam", "Clear night"];
    return { emoji: e[0], label: LANG === "en" ? e[2] : e[1] };
  }

  function uvWord(uv) {
    if (uv == null || isNaN(uv)) return LANG === "en" ? "—" : "—";
    if (uv < 3) return LANG === "en" ? "Low" : "Lemah";
    if (uv < 6) return LANG === "en" ? "Moderate" : "Sedang";
    if (uv < 8) return LANG === "en" ? "High" : "Kuat";
    if (uv < 11) return LANG === "en" ? "Very high" : "Sangat kuat";
    return LANG === "en" ? "Extreme" : "Ekstrem";
  }

  function windWord(kmh) {
    if (kmh == null || isNaN(kmh)) return LANG === "en" ? "—" : "—";
    if (kmh < 12) return LANG === "en" ? "Calm" : "Tenang";
    if (kmh < 29) return LANG === "en" ? "Breezy" : "Sejuk";
    if (kmh < 40) return LANG === "en" ? "Windy" : "Kencang";
    return LANG === "en" ? "Very windy" : "Sangat kencang";
  }

  function round(n) {
    return Math.round(Number(n) || 0);
  }

  // Build condition-triggered advice. Only matching entries are returned.
  function buildAdvice(today, alerts) {
    var outfit = [],
      activity = [],
      items = [],
      risks = [];
    var tmax = today.tmax,
      tmin = today.tmin,
      diff = tmax - tmin,
      precip = today.precip,
      wind = today.windMax,
      uv = today.uv,
      code = today.code;

    (alerts || []).forEach(function (a) {
      risks.push(T.r_alert(a));
    });

    if (precip >= 60) {
      activity.push(T.a_pProb);
      items.push(T.i_pProb);
    }

    var isDrizzle = [51, 53, 55, 56, 57, 80].indexOf(code) >= 0;
    var isRain = [61, 63, 65, 81, 82].indexOf(code) >= 0;
    var isStorm = [95, 96, 99].indexOf(code) >= 0;
    if (isDrizzle) {
      activity.push(T.a_drizzle);
      items.push(T.i_drizzle);
    }
    if (isRain) {
      risks.push(T.r_rain);
      items.push(T.i_rain);
    }
    if (isStorm) {
      risks.push(T.r_storm);
      items.push(T.i_storm);
    }

    if (tmax >= 32) {
      outfit.push(T.o_hot);
      activity.push(T.a_hot);
      items.push(T.i_hot);
    }
    if (uv >= 5) {
      activity.push(T.a_uv);
      items.push(T.i_uv);
    }
    if (diff > 8) outfit.push(T.o_diff);
    if (tmax <= 10) {
      outfit.push(T.o_cold);
      items.push(T.i_cold);
    }

    if (wind >= 40) {
      risks.push(T.r_windGale);
    } else if (wind >= 29) {
      activity.push(T.a_windStrong);
    }

    if (code === 0 || code === 1) {
      activity.push(T.a_clear);
      if (uv < 5) items.push(T.i_clear);
    }
    if (code === 3) activity.push(T.a_overcast);

    if (code === 45 || code === 48) {
      risks.push(T.r_fog);
      items.push(T.i_fog);
    }

    // Deduplicate items.
    var seen = {};
    items = items.filter(function (i) {
      if (seen[i]) return false;
      seen[i] = true;
      return true;
    });

    return { outfit: outfit, activity: activity, items: items, risks: risks };
  }

  function block(title, items) {
    if (!items.length) return "";
    var lis = items
      .map(function (i) {
        return "<li>" + i + "</li>";
      })
      .join("");
    return '<div class="advice-block"><h4>' + title + "</h4><ul>" + lis + "</ul></div>";
  }

  function renderNow(today, current) {
    var w = wmo(current.code, current.isDay);
    return (
      '<div class="weather-now__main">' +
      '<span class="weather-now__emoji">' + w.emoji + "</span>" +
      "<div>" +
      '<div class="weather-now__temp">' + round(current.temperature) + "°</div>" +
      '<div class="weather-now__desc">' + w.label + " · " + T.feels + " " + round(current.apparent) + "°</div>" +
      "</div>" +
      '<div class="weather-now__today">' + T.today + " " + round(today.tmin) + "–" + round(today.tmax) + "°</div>" +
      "</div>" +
      '<ul class="weather-now__meta">' +
      "<li>" + T.wind + "<strong>" + round(current.wind) + " km/h</strong></li>" +
      "<li>" + T.humidity + "<strong>" + round(current.humidity) + "%</strong></li>" +
      "<li>" + T.precip + "<strong>" + round(today.precip) + "%</strong></li>" +
      "</ul>" +
      '<div class="weather-badges">' +
      '<span class="badge badge--uv">' + T.uv + " " + uvWord(today.uv) + "</span>" +
      '<span class="badge badge--wind">' + windWord(today.windMax) + "</span>" +
      "</div>"
    );
  }

  function renderAdvice(advice) {
    var alertHtml = "";
    if (advice.risks.length) {
      var lis = advice.risks
        .map(function (r) {
          return "<li>" + r + "</li>";
        })
        .join("");
      alertHtml =
        '<div class="weather-alert" role="alert"><strong>' +
        T.alertLabel +
        "</strong><ul>" +
        lis +
        "</ul></div>";
    }
    var blocks =
      '<div class="weather-advice">' +
      block(T.blockOutfit, advice.outfit) +
      block(T.blockActivity, advice.activity) +
      block(T.blockItems, advice.items) +
      "</div>";
    return alertHtml + blocks;
  }

  function renderDays(daily) {
    if (!daily || !daily.time) return "";
    var html = "";
    for (var i = 0; i < daily.time.length; i++) {
      var w = wmo(daily.weather_code[i], true);
      var d = new Date(daily.time[i] + "T00:00:00");
      var dayName =
        LANG === "en"
          ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()]
          : ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"][d.getDay()];
      html +=
        "<li>" +
        '<span class="wd__day">' + dayName + "</span>" +
        '<span class="wd__emoji">' + w.emoji + "</span>" +
        "<span>" + round(daily.temperature_2m_min[i]) + "°/" + round(daily.temperature_2m_max[i]) + "°</span>" +
        '<span class="wd__rain">' + round(daily.precipitation_probability_max[i]) + "%</span>" +
        "</li>";
    }
    return html;
  }

  function init() {
    var widget = document.getElementById("weather-widget");
    var nowEl = document.getElementById("weather-now");
    var daysEl = document.getElementById("weather-days");
    var noteEl = document.getElementById("weather-note");
    if (!widget || !nowEl) return;

    nowEl.innerHTML = '<p class="weather-loading">' + T.loading + "</p>";

    fetch("/api/weather")
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (!data || !data.current || !data.daily || !data.daily.time) {
          throw new Error("bad shape");
        }
        var c = data.current;
        var d = data.daily;
        var today = {
          code: d.weather_code[0],
          tmax: d.temperature_2m_max[0],
          tmin: d.temperature_2m_min[0],
          precip: d.precipitation_probability_max[0],
          windMax: d.wind_speed_10m_max ? d.wind_speed_10m_max[0] : c.wind_speed_10m,
          uv: d.uv_index_max ? d.uv_index_max[0] : null,
        };
        var current = {
          code: c.weather_code,
          isDay: c.is_day === 1,
          temperature: c.temperature_2m,
          apparent: c.apparent_temperature,
          humidity: c.relative_humidity_2m,
          wind: c.wind_speed_10m,
        };

        var advice = buildAdvice(today, data.alerts);

        nowEl.innerHTML = renderNow(today, current) + renderAdvice(advice);
        if (daysEl) daysEl.innerHTML = renderDays(d);
        if (noteEl) noteEl.textContent = T.note;
        widget.removeAttribute("data-loading");
      })
      .catch(function () {
        nowEl.innerHTML = '<p class="weather-loading">' + T.err + "</p>";
        if (daysEl) daysEl.innerHTML = "";
        if (noteEl) noteEl.textContent = T.note;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
