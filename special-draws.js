(function (root) {
  "use strict";

  const SPECIAL_CATEGORIES = {
    megasena: {
      key: "virada",
      name: "Mega da Virada",
      shortName: "Mega da Virada",
      startYear: 2009,
      ruleNote: "Realizada anualmente na virada de ano desde 2009 (#1140); o prêmio principal não acumula.",
      contests: {
        1140: 2009,
        1245: 2010,
        1350: 2011,
        1455: 2012,
        1560: 2013,
        1665: 2014,
        1775: 2015,
        1890: 2016,
        2000: 2017,
        2110: 2018,
        2220: 2019,
        2330: 2020,
        2440: 2021,
        2550: 2022,
        2670: 2023,
        2810: 2024,
        2955: 2025,
        3100: 2026
      }
    },
    lotofacil: {
      key: "independencia",
      name: "Lotofácil da Independência",
      shortName: "Independência",
      startYear: 2012,
      ruleNote: "Realizada anualmente em setembro (semana da Independência); o prêmio principal não acumula.",
      contests: {
        800: 2012,
        952: 2013,
        1102: 2014,
        1255: 2015,
        1408: 2016,
        1557: 2017,
        1708: 2018,
        1861: 2019,
        2030: 2020,
        2320: 2021,
        2610: 2022,
        2900: 2023,
        3190: 2024,
        3480: 2025,
        3780: 2026
      }
    },
    quina: {
      key: "sao-joao",
      name: "Quina de São João",
      shortName: "São João",
      startYear: 2011,
      ruleNote: "Realizada anualmente em junho (semana de São João); o prêmio principal não acumula.",
      contests: {
        2627: 2011,
        2925: 2012,
        3221: 2013,
        3517: 2014,
        3814: 2015,
        4114: 2016,
        4412: 2017,
        4706: 2018,
        5002: 2019,
        5299: 2020,
        5590: 2021,
        5881: 2022,
        6172: 2023,
        6462: 2024,
        6760: 2025,
        7051: 2026
      }
    },
    lotomania: {
      key: "pascoa",
      name: "Lotomania de Páscoa",
      shortName: "Páscoa",
      startYear: 2013,
      ruleNote: "Concurso especial realizado entre 2013 e 2016 (substituído pela Dupla de Páscoa em 2017).",
      contests: {
        1335: 2013,
        1444: 2014,
        1543: 2015,
        1644: 2016
      }
    }
  };

  const MAIN_TIER_KEYS = {
    megasena: { main: "6", fallback: "5" },
    lotofacil: { main: "15", fallback: "14" },
    quina: { main: "5", fallback: "4" },
    lotomania: { main: "20", fallback: "19" }
  };

  function parseDateParts(dateStr) {
    if (!dateStr || typeof dateStr !== "string") return null;
    const parts = dateStr.trim().split("/");
    if (parts.length !== 3) return null;
    const day = Number(parts[0]);
    const month = Number(parts[1]);
    const year = Number(parts[2]);
    if (!day || !month || !year) return null;
    return { day, month, year };
  }

  function getSpecialMeta(lotteryId) {
    return SPECIAL_CATEGORIES[lotteryId] || null;
  }

  function getTierTotal(draw, key) {
    const p = draw && draw.p ? draw.p : null;
    if (!p || !p[key]) return 0;
    const g = Number(p[key].g || 0);
    const v = Number(p[key].v || 0);
    return g > 0 ? g * v : 0;
  }

  function detectFutureSpecialYear(lotteryId, draw) {
    if (!draw || !draw.c) return null;
    const c = Number(draw.c);
    const dt = parseDateParts(draw.d);
    if (!dt) return null;

    if (lotteryId === "megasena" && c > 2955 && c !== 3100) {
      const isDec31 = dt.day === 31 && dt.month === 12;
      const isJan01 = dt.day === 1 && dt.month === 1;
      if (isDec31 || isJan01) {
        const tot6 = getTierTotal(draw, "6");
        const tot5 = getTierTotal(draw, "5");
        const mainVal = tot6 > 0 ? tot6 : (!draw.a ? tot5 : 0);
        if (mainVal >= 200000000) {
          return isDec31 ? dt.year : dt.year - 1;
        }
      }
    } else if (lotteryId === "lotofacil" && c > 3780) {
      if (dt.month === 9 && dt.day >= 1 && dt.day <= 18 && !draw.a) {
        const tot15 = getTierTotal(draw, "15");
        if (tot15 >= 100000000) {
          return dt.year;
        }
      }
    } else if (lotteryId === "quina" && c > 7051) {
      if (dt.month === 6 && dt.day >= 20 && dt.day <= 30 && !draw.a) {
        const tot5 = getTierTotal(draw, "5");
        const tot4 = getTierTotal(draw, "4");
        const mainVal = tot5 > 0 ? tot5 : tot4;
        if (mainVal >= 100000000) {
          return dt.year;
        }
      }
    }

    return null;
  }

  function getSpecialDrawInfo(lotteryId, draw) {
    const meta = getSpecialMeta(lotteryId);
    if (!meta || !draw || !draw.c) return null;

    const c = Number(draw.c);
    let year = meta.contests[c] || null;
    if (!year) {
      year = detectFutureSpecialYear(lotteryId, draw);
    }
    if (!year) return null;

    const edition = Math.max(1, year - meta.startYear + 1);
    return {
      key: meta.key,
      name: meta.name,
      shortName: meta.shortName,
      year,
      edition,
      label: `${meta.name} ${year}`,
      ruleNote: meta.ruleNote
    };
  }

  function isSpecialDraw(lotteryId, draw) {
    return getSpecialDrawInfo(lotteryId, draw) !== null;
  }

  function getSpecialDraws(lotteryId, drawsList) {
    if (!Array.isArray(drawsList)) return [];
    return drawsList.filter((d) => isSpecialDraw(lotteryId, d));
  }

  function computeTotalMainPrize(lotteryId, draw) {
    if (!draw || !draw.p) return 0;
    const keys = MAIN_TIER_KEYS[lotteryId];
    if (!keys) return 0;

    const mainP = draw.p[keys.main];
    if (mainP && Number(mainP.g) > 0) {
      return Number(mainP.g) * Number(mainP.v || 0);
    }

    const isSpecial = isSpecialDraw(lotteryId, draw);
    if (mainP && Number(mainP.g) === 0 && (isSpecial || !draw.a)) {
      const subP = draw.p[keys.fallback];
      if (subP && Number(subP.g) > 0) {
        return Number(subP.g) * Number(subP.v || 0);
      }
    }

    return mainP ? Number(mainP.v || 0) : 0;
  }

  const api = {
    SPECIAL_CATEGORIES,
    getSpecialMeta,
    getSpecialDrawInfo,
    isSpecialDraw,
    getSpecialDraws,
    computeTotalMainPrize
  };

  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.AtlasSpecials = api;
})(typeof window !== "undefined" ? window : globalThis);
