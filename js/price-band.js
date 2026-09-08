/* PeptideClear price context band
   ------------------------------------------------------------------
   Populates any  <div class="pc-price-band" data-compound="SLUG"></div>
   from  /glossary/data/prices.json.

   Design goals:
   - Progressive enhancement. If the data is missing, malformed, or JS
     fails, the empty div renders nothing and the page is unaffected.
   - Single source of truth. Update prices by editing prices.json only.
     A compound's band appears only once low, high, and median are all
     real numbers; otherwise the div is removed cleanly.
   - Theme-native. Uses the page's existing CSS variables, so light and
     dark mode work automatically with zero extra config.
   ------------------------------------------------------------------ */
(function () {
  "use strict";

  // Path is relative to the PAGE (/glossary/compare/*.html), not this file.
  // All compare pages sit at the same depth, so this is stable.
  var DATA_URL = "../data/prices.json";

  var CSS = [
    ".pc-price-band{display:none;}",
    ".pc-price-band.pcpb-ready{display:block;background:var(--bg-alt);border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:0 6px 6px 0;padding:14px 18px;margin-bottom:32px;font-family:'Helvetica Neue',Arial,sans-serif;}",
    ".pcpb-head{display:flex;justify-content:space-between;align-items:baseline;gap:12px;flex-wrap:wrap;margin-bottom:12px;}",
    ".pcpb-label{font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--accent-dark);}",
    ".pcpb-date{font-size:11px;color:var(--text-faint);letter-spacing:0.02em;}",
    ".pcpb-scale{display:flex;align-items:center;gap:14px;margin-bottom:12px;}",
    ".pcpb-end{display:flex;flex-direction:column;align-items:flex-start;white-space:nowrap;}",
    ".pcpb-end-hi{align-items:flex-end;}",
    ".pcpb-val{font-size:18px;font-weight:700;color:var(--text-primary);line-height:1.1;}",
    ".pcpb-tag{font-size:10px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:var(--text-faint);margin-top:2px;}",
    ".pcpb-track{position:relative;flex:1;height:2px;background:var(--border);border-radius:2px;}",
    ".pcpb-dot{position:absolute;top:50%;width:10px;height:10px;border-radius:50%;background:var(--accent);border:2px solid var(--bg);transform:translate(-50%,-50%);box-shadow:0 0 0 1px var(--accent);}",
    ".pcpb-median{font-size:13px;color:var(--text-body);line-height:1.5;margin-bottom:8px;}",
    ".pcpb-median strong{color:var(--text-primary);}",
    ".pcpb-note{font-size:12px;color:var(--text-muted);line-height:1.55;}"
  ].join("");

  function injectCSS() {
    if (document.getElementById("pc-price-band-css")) return;
    var s = document.createElement("style");
    s.id = "pc-price-band-css";
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(v) {
    return String(v).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  // Whole numbers show as-is ("18"); fractional show 2 decimals ("1.05", "1.80").
  function fmt(n) {
    return Number.isInteger(n) ? String(n) : n.toFixed(2);
  }

  function valid(d) {
    return d &&
      typeof d.low === "number" &&
      typeof d.high === "number" &&
      typeof d.median === "number" &&
      d.high >= d.low;
  }

  function render(el, d) {
    var unit = d.unit ? esc(d.unit) : "mg";
    var asof = d.as_of ? esc(d.as_of) : "";
    var pos = (d.high === d.low) ? 50 : ((d.median - d.low) / (d.high - d.low)) * 100;
    pos = Math.max(0, Math.min(100, pos));

    var nText = "";
    if (typeof d.n === "number") {
      nText = " across " + d.n + " scored vendor" + (d.n === 1 ? "" : "s") + " publicly listing this compound";
    }

    el.innerHTML =
      '<div class="pcpb-head">' +
        '<span class="pcpb-label">Market price context</span>' +
        (asof ? '<span class="pcpb-date">public listings &middot; as of ' + asof + '</span>' : '') +
      '</div>' +
      '<div class="pcpb-scale">' +
        '<div class="pcpb-end"><span class="pcpb-val">$' + fmt(d.low) + '</span><span class="pcpb-tag">floor</span></div>' +
        '<div class="pcpb-track"><span class="pcpb-dot" style="left:' + pos.toFixed(1) + '%"></span></div>' +
        '<div class="pcpb-end pcpb-end-hi"><span class="pcpb-val">$' + fmt(d.high) + '</span><span class="pcpb-tag">ceiling</span></div>' +
      '</div>' +
      '<div class="pcpb-median">Median <strong>$' + fmt(d.median) + '</strong> per ' + unit + nText + '.</div>' +
      '<div class="pcpb-note">Prices well below this floor are a reason for more scrutiny on identity and purity testing, not a bargain signal. PeptideClear takes no affiliate revenue and does not link to purchase. Figures come from public vendor listings captured during VTS scoring passes.</div>';

    el.classList.add("pcpb-ready");
  }

  function removeAll(bands) {
    bands.forEach(function (el) { el.remove(); });
  }

  function init() {
    var bands = [].slice.call(document.querySelectorAll(".pc-price-band[data-compound]"));
    if (!bands.length) return;
    injectCSS();

    fetch(DATA_URL, { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) { removeAll(bands); return; }
        bands.forEach(function (el) {
          var d = data[el.getAttribute("data-compound")];
          if (valid(d)) render(el, d);
          else el.remove();
        });
      })
      .catch(function () { removeAll(bands); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
