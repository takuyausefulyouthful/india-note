// content/ のデータから docs/ に静的サイトを生成する。実行: node build.js
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const OUT = path.join(ROOT, "docs");
const catalog = JSON.parse(fs.readFileSync(path.join(ROOT, "content/catalog.json"), "utf8"));
const { site, categories, articles } = catalog;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

const loaded = {};
for (const a of articles) {
  const file = path.join(ROOT, "content/articles", a.slug + ".json");
  if (fs.existsSync(file)) loaded[a.slug] = JSON.parse(fs.readFileSync(file, "utf8"));
}
const isReady = (a) => Boolean(loaded[a.slug]);
const course = articles.filter((a) => a.course);

const svgFig = (h, label, inner) => `<svg viewBox="0 0 360 ${h}" role="img" aria-label="${esc(label)}">${inner}</svg>`;
const txt = (x, y, s, opt = "") => `<text x="${x}" y="${y}" text-anchor="middle" fill="var(--ink)" font-size="12" ${opt}>${s}</text>`;
const person = (x, y, stroke, dash = "") =>
  `<g fill="none" stroke="${stroke}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ""}><circle cx="${x}" cy="${y}" r="11"/><path d="M${x - 18} ${y + 38}c0-18 8-25 18-25s18 7 18 25"/></g>`;
const palette = ["var(--accent)", "var(--indigo)", "var(--ok)", "var(--sub)"];
const dots = (cols, rows, x0, y0, step, r) => {
  let out = "";
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const v = (x * 7 + y * 13 + x * y) % 11;
      out += `<circle cx="${x0 + x * step}" cy="${y0 + y * step}" r="${r * (0.7 + (v % 3) * 0.2)}" fill="${palette[v % 4]}" opacity="${0.55 + (v % 4) * 0.13}"/>`;
    }
  return out;
};

const timeline = (rows, label) => {
  const h = 20 + rows.length * 38;
  return svgFig(h, label, `<line x1="66" y1="18" x2="66" y2="${h - 22}" stroke="var(--line)" stroke-width="2"/>${rows.map(([y, t], i) => {
    const cy = 20 + i * 38;
    return `<text x="54" y="${cy + 5}" text-anchor="end" fill="var(--sub)" font-size="13">${y}</text><circle cx="66" cy="${cy}" r="5" fill="var(--accent)"/><text x="82" y="${cy + 4}" fill="var(--ink)" font-size="12">${t}</text>`;
  }).join("")}`);
};
const box = (x, y, w, h, lines, opt = {}) => {
  const fill = opt.fill || "var(--tint)", color = opt.color || "var(--ink)";
  const start = y + h / 2 + 4 - ((lines.length - 1) * 17) / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}" stroke="${opt.stroke || "var(--line)"}" ${opt.dash ? 'stroke-dasharray="4 3"' : ""}/>${lines.map((l, i) => `<text x="${x + w / 2}" y="${start + i * 17}" text-anchor="middle" fill="${color}" font-size="12">${l}</text>`).join("")}`;
};
const arrowDown = (x, y1, y2) => `<path d="M${x} ${y1}V${y2}m-4-5l4 5 4-5" fill="none" stroke="var(--sub)" stroke-width="1.5"/>`;
const arrowRight = (x1, x2, y) => `<path d="M${x1} ${y}H${x2}m-5-4l5 4-5 4" fill="none" stroke="var(--sub)" stroke-width="1.5"/>`;

const cardRows = (rows, label) => {
  const stroke = ["var(--accent)", "var(--indigo)", "var(--ok)", "var(--sub)"];
  return svgFig(8 + rows.length * 54, label, rows.map((l, i) => box(6, 8 + i * 54, 348, 46, l, { stroke: stroke[i % 4] })).join(""));
};
const bg = '<rect width="720" height="180" fill="var(--tint)"/>';

const BANNERS = {
  ancient: `${bg}<g fill="var(--accent)">${Array.from({ length: 6 }, (_, r) => Array.from({ length: 22 - r * 3 }, (_, c) => `<rect x="${40 + r * 45 + c * 30 + (r % 2) * 15}" y="${146 - r * 22}" width="26" height="18" opacity="${0.5 + (c % 3) * 0.2}"/>`).join("")).join("")}</g>`,
  mughal: `${bg}<g fill="var(--indigo)"><rect x="250" y="96" width="220" height="84"/><path d="M280 96c0-52 52-60 80-76 28 16 80 24 80 76z"/><rect x="170" y="44" width="16" height="136"/><rect x="534" y="44" width="16" height="136"/></g><path d="M326 180v-46c0-20 34-34 34-34s34 14 34 34v46z" fill="var(--paper)"/><rect y="170" width="720" height="10" fill="var(--accent)"/>`,
  languages: `${bg}${Array.from({ length: 16 }, (_, i) => { const x = 28 + (i % 8) * 86, y = 22 + Math.floor(i / 8) * 76, c = palette[i % 4]; return `<path d="M${x} ${y}h66a6 6 0 0 1 6 6v36a6 6 0 0 1-6 6h-40l-14 14v-14h-12a6 6 0 0 1-6-6v-36a6 6 0 0 1 6-6z" fill="${c}" opacity="${0.5 + (i % 3) * 0.2}"/>`; }).join("")}`,
  geography: `${bg}<polygon points="0,88 90,24 170,74 270,16 370,76 470,28 570,78 660,34 720,70 720,104 0,104" fill="var(--indigo)"/><rect y="104" width="720" height="34" fill="var(--ok)" opacity=".55"/><path d="M0 121c120-14 240 14 360 0s240-14 360 0" fill="none" stroke="var(--paper)" stroke-width="5"/><rect y="138" width="720" height="42" fill="var(--accent)" opacity=".65"/>`,
  islam: `${bg}<g fill="none" stroke="var(--ok)" stroke-width="2.5">${Array.from({ length: 12 }, (_, c) => Array.from({ length: 3 }, (_, r) => { const x = 40 + c * 58, y = 34 + r * 56; return `<rect x="${x - 16}" y="${y - 16}" width="32" height="32"/><rect x="${x - 16}" y="${y - 16}" width="32" height="32" transform="rotate(45 ${x} ${y})"/>`; }).join("")).join("")}</g>`,
  "other-religions": `${bg}<circle cx="120" cy="90" r="46" fill="var(--accent)"/><rect x="264" y="44" width="92" height="92" fill="var(--indigo)"/><polygon points="500,40 548,136 452,136" fill="var(--ok)"/><path d="M640 42v96M606 72h68" stroke="var(--sub)" stroke-width="12"/>`,
  festivals: `${bg}${Array.from({ length: 12 }, (_, i) => { const x = 40 + i * 58; return `<path d="M${x} 62c-11 14-11 26 0 32 11-6 11-18 0-32z" fill="var(--accent)"/><path d="M${x - 24} 100h48c-3 22-14 30-24 30s-21-8-24-30z" fill="var(--indigo)"/>`; }).join("")}<rect y="146" width="720" height="10" fill="var(--ok)" opacity=".6"/>`,
  food: `${bg}<circle cx="360" cy="90" r="82" fill="var(--paper)" stroke="var(--line)" stroke-width="3"/>${Array.from({ length: 7 }, (_, i) => { const t = (i / 7) * 2 * Math.PI; return `<circle cx="${(360 + 54 * Math.cos(t)).toFixed(1)}" cy="${(90 + 54 * Math.sin(t)).toFixed(1)}" r="20" fill="${palette[i % 4]}" opacity=".8"/>`; }).join("")}<circle cx="360" cy="90" r="24" fill="var(--sub)" opacity=".5"/>`,
  conglomerates: `${bg}<g fill="var(--indigo)">${[[60, 80], [130, 120], [200, 60], [270, 140], [340, 90], [410, 130], [480, 70], [550, 110], [620, 76]].map(([x, h]) => `<rect x="${x}" y="${170 - h}" width="52" height="${h}"/>`).join("")}</g><path d="M86 90L296 30 506 100 646 94" fill="none" stroke="var(--accent)" stroke-width="3"/><rect y="170" width="720" height="10" fill="var(--ink)"/>`,
  digital: `${bg}<g stroke="var(--indigo)" stroke-width="2">${[[120, 50, 240, 120], [240, 120, 360, 50], [360, 50, 480, 120], [480, 120, 600, 50], [240, 120, 480, 120]].map(([a, b, c, d]) => `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}"/>`).join("")}</g>${[[120, 50], [240, 120], [360, 50], [480, 120], [600, 50]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="20" fill="${i % 2 ? "var(--accent)" : "var(--indigo)"}"/>`).join("")}`,
  etiquette: `${bg}<g fill="var(--accent)"><path d="M352 170V68c0-20-4-40-16-48-10 12-26 54-26 80l12 70z"/><path d="M368 170V68c0-20 4-40 16-48 10 12 26 54 26 80l-12 70z" opacity=".75"/></g>`,
  "japan-india": `${bg}<circle cx="210" cy="90" r="54" fill="var(--accent)"/><circle cx="510" cy="90" r="54" fill="var(--indigo)"/><path d="M264 90C330 34 390 34 456 90" fill="none" stroke="var(--ink)" stroke-width="4"/><path d="M264 90C330 146 390 146 456 90" fill="none" stroke="var(--ink)" stroke-width="4" stroke-dasharray="9 7"/>`,
  "british-raj": `<rect width="720" height="180" fill="var(--tint)"/><path d="M0 142H720" stroke="var(--ink)" stroke-width="4"/>${Array.from({ length: 24 }, (_, i) => `<rect x="${8 + i * 30}" y="146" width="12" height="12" fill="var(--sub)"/>`).join("")}<g fill="var(--indigo)"><rect x="220" y="88" width="120" height="46"/><rect x="350" y="88" width="120" height="46"/><rect x="480" y="72" width="110" height="62"/><rect x="520" y="50" width="20" height="24"/></g><g fill="var(--paper)">${[236, 276, 366, 406].map((x) => `<rect x="${x}" y="98" width="24" height="16"/>`).join("")}</g><g fill="var(--accent)">${[250, 310, 380, 440, 510, 565].map((x) => `<circle cx="${x}" cy="136" r="9"/>`).join("")}</g>`,
  partition: `<rect width="360" height="180" fill="var(--tint)"/><rect x="360" width="360" height="180" fill="var(--indigo)" opacity=".55"/>${dots(13, 7, 24, 18, 25, 7)}<g transform="translate(378)">${dots(13, 7, 12, 18, 25, 7)}</g><path d="M360 0l-16 40 24 42-20 44 12 54" fill="none" stroke="var(--accent)" stroke-width="4" stroke-dasharray="10 7"/>`,
  democracy: `<rect width="720" height="180" fill="var(--tint)"/>${[50, 76, 102, 128, 154].map((r, ring) => {
    const n = 12 + ring * 5;
    return Array.from({ length: n }, (_, i) => {
      const t = Math.PI * (i / (n - 1));
      return `<circle cx="${(360 - r * Math.cos(t)).toFixed(1)}" cy="${(168 - r * Math.sin(t)).toFixed(1)}" r="7" fill="${i / n < 0.54 ? "var(--accent)" : i / n < 0.94 ? "var(--indigo)" : "var(--sub)"}"/>`;
    }).join("");
  }).join("")}`,
  hinduism: `<rect width="720" height="180" fill="var(--tint)"/><g transform="translate(360 150)" fill="var(--accent)">${[-70, -46, -23, 0, 23, 46, 70].map((a, i) => `<path transform="rotate(${a})" d="M0 0C-26 -42 -18 -92 0 -122C18 -92 26 -42 0 0z" opacity="${0.55 + (i % 3) * 0.15}"/>`).join("")}</g><path d="M0 150c60-18 120 18 180 0s120-18 180 0 120 18 180 0 120-18 180 0v30H0z" fill="var(--indigo)"/>`,
  economy: `<rect width="720" height="180" fill="var(--tint)"/><g fill="var(--indigo)">${Array.from({ length: 14 }, (_, i) => `<rect x="${50 + i * 45}" y="${150 - 12 - i * 9}" width="30" height="${12 + i * 9}" opacity="${0.4 + i * 0.04}"/>`).join("")}</g><path d="M40 136C200 124 390 92 680 18" fill="none" stroke="var(--accent)" stroke-width="4"/><circle cx="680" cy="18" r="8" fill="var(--accent)"/><path d="M0 150H720" stroke="var(--ink)" stroke-width="3"/>`,
  overview: `<rect width="720" height="180" fill="var(--tint)"/><circle cx="560" cy="72" r="40" fill="var(--accent)"/><polygon points="0,180 120,72 200,128 300,40 420,138 500,92 720,180" fill="var(--indigo)"/><path d="M0 160c90-26 150 18 240 0s150-26 240 0 150 16 240-4v24H0z" fill="var(--paper)" opacity=".75"/>`,
  caste: `<rect width="720" height="180" fill="var(--tint)"/>${dots(30, 7, 24, 18, 23.5, 8)}`,
  "business-customs": `<rect width="720" height="180" fill="var(--tint)"/><g fill="var(--indigo)" opacity=".35"><rect x="40" y="60" width="50" height="120"/><rect x="100" y="30" width="40" height="150"/><rect x="580" y="44" width="46" height="136"/><rect x="636" y="80" width="44" height="100"/></g>${person(290, 66, "var(--accent)")}${person(430, 66, "var(--indigo)")}<rect x="220" y="124" width="280" height="10" fill="var(--ink)"/><rect x="340" y="104" width="40" height="20" fill="var(--paper)" stroke="var(--ink)"/>`,
};

const FIGURES = {
  "ancient-timeline": timeline([["前2500", "インダス文明が栄える（〜前1700）"], ["前321", "マウリヤ朝が興る（〜前185）"], ["前260", "アショーカ王のカリンガ征服"], ["320", "グプタ朝が興る（〜6世紀半ば）"]], "紀元前2500年から西暦6世紀までの年表"),
  "mughal-timeline": timeline([["1206", "デリー・スルターン朝が始まる"], ["1526", "バーブルがパーニーパットで勝利"], ["1556", "アクバルの時代へ"], ["1707", "アウラングゼーブ死去、衰退へ"], ["1739", "ナーディル・シャーのデリー侵攻"], ["1803", "デリーが英国の支配下に"], ["1857", "大反乱、最後の皇帝は追放へ"]], "1206年から1857年までの年表"),
  "language-layers": cardRows([["連邦の公用語", "ヒンディー語（英語も継続して使用）"], ["憲法第8附則の言語", "22言語"], ["2011年国勢調査で集計された言語", "121言語、270の母語"]], "公用語、第8附則の22言語、国勢調査の121言語の関係"),
  landforms: cardRows([["北部", "ヒマラヤ山脈"], ["中央の平原", "インダス・ガンジス平原、農業と人口の中心"], ["南部", "デカン高原と沿岸部の港町"]], "北から南へ、ヒマラヤ、平原、デカン高原が並ぶ"),
  cities: cardRows([["デリー", "首都圏、政治の中心"], ["ムンバイ", "金融の中心、インド準備銀行の本店"], ["ベンガルール、ハイデラバード", "ITとハイテク産業の集積地"], ["チェンナイ", "ITと自動車産業"], ["コルカタ", "1911年までの首都、東部の商業の中心"]], "主要都市の主な役割"),
  "islam-timeline": timeline([["1947", "分離独立"], ["1992", "バーブリー・モスクの破壊"], ["2006", "サッチャル委員会の報告"], ["2019", "最高裁のアヨーディヤー判決、市民権法"], ["2024", "アヨーディヤーの寺院が開かれる"]], "1947年から2024年までの年表"),
  religions: cardRows([["シク教（1.7%）", "開祖グル・ナーナク、聖地は黄金寺院"], ["ジャイナ教", "マハーヴィーラ、不殺生を徹底"], ["仏教（0.7%）", "1956年のアンベードカルの改宗が転機"], ["キリスト教（2.3%）", "ケーララムに古い共同体"]], "シク教、ジャイナ教、仏教、キリスト教の概要"),
  "festival-calendar": timeline([["1月", "ポンガル、共和国記念日（26日）"], ["春ごろ", "ホーリー"], ["8月", "独立記念日（15日）"], ["8〜9月", "オーナム"], ["9〜10月", "ドゥルガー女神の祭り、ガンディー生誕日"], ["秋ごろ", "ディワリ（年により10月か11月）"], ["毎年移動", "イードの日付は毎年ずれていく"]], "1年の主な祝祭の時期"),
  "food-rules": cardRows([["ヒンドゥー教徒", "牛肉を避ける人が多い。菜食は地域差が大きい"], ["イスラム教徒", "豚と酒を避ける。ハラールの肉を求める人が多い"], ["シク教徒", "牛肉を避ける人が多く、59%が菜食と回答"], ["ジャイナ教徒", "92%が菜食と回答。根菜も避ける人が多い"]], "宗教別の食の傾向"),
  groups: cardRows([["タタ", "1800年代創業、鉄鋼、自動車、IT、消費財など"], ["ビルラ", "1857年に綿花取引で開始、繊維素材、金属など"], ["リライアンス", "石油化学から通信、小売へ"], ["アダニ", "港湾、エネルギーなどのインフラ"]], "タタ、ビルラ、リライアンス、アダニの概要"),
  "digital-stack": cardRows([["アプリとサービス", "決済アプリ、銀行、行政サービス"], ["決済の基盤 UPI", "銀行口座の間で即時に送金"], ["本人確認の基盤 Aadhaar", "生体情報に結びつく12桁の番号"]], "Aadhaarの上にUPI、その上にアプリが載る三層の構造"),
  etiquette: cardRows([["あいさつ", "握手かナマステ。相手に合わせる"], ["順番", "最も上位の人に先にあいさつする"], ["手", "食事や物の受け渡しは右手が無難"], ["話題", "カーストや印パ関係は自分から踏み込まない"]], "あいさつ、順番、手、話題についてのポイント"),
  "japan-india-timeline": timeline([["752", "東大寺の大仏開眼（菩提僊那が導師）"], ["1952", "日印平和条約"], ["1982", "スズキが合弁契約"], ["2014", "特別戦略的グローバル関係に格上げ"], ["2015", "高速鉄道の協力の覚書"], ["2026", "高市総理がインド訪問（7月）"]], "752年から2026年までの年表"),
  "raj-timeline": timeline([["1757", "プラッシーの戦い"], ["1857", "大反乱が北インドに広がる"], ["1858", "統治権が会社から英国王へ"], ["1885", "インド国民会議の結成"], ["1919", "アムリットサルの虐殺"], ["1930", "ガンディーの塩の行進"], ["1942", "「インドから出て行け」運動"], ["1947", "インドとパキスタンが独立"]], "1757年から1947年までの主な出来事の年表"),
  kashmir: svgFig(216, "カシミール地域のインド、パキスタン、中国による統治の模式図", `
    ${box(6, 8, 348, 46, ["インドが統治", "ジャンムー・カシミール、ラダック（連邦直轄領）"], { stroke: "var(--indigo)" })}
    ${box(6, 62, 348, 46, ["パキスタンが統治", "アーザード・カシミール、ギルギット・バルティスタン"], { stroke: "var(--ok)" })}
    ${box(6, 116, 348, 46, ["中国が統治", "アクサイチン（インドが領有を主張）"], { stroke: "var(--sub)" })}
    ${txt(180, 184, "インドとパキスタンの間は実効支配線（LoC）で区切られ、")}${txt(180, 204, "確定した国境はない")}`),
  government: svgFig(176, "国民が下院を、州議会などが上院を、議員の選挙人団が大統領を選び、下院の信任で首相と内閣が決まる", `
    ${box(6, 8, 90, 42, ["国民"], { fill: "var(--accent)", color: "var(--paper)" })}
    ${box(135, 8, 90, 42, ["州議会など"])}
    ${box(264, 8, 90, 42, ["両院と州議会", "の選挙人団"])}
    ${arrowDown(51, 50, 78)}${arrowDown(180, 50, 78)}${arrowDown(309, 50, 78)}
    ${box(6, 78, 90, 42, ["下院", "543選挙区"])}
    ${box(135, 78, 90, 42, ["上院", "定数245"])}
    ${box(264, 78, 90, 42, ["大統領", "国家元首"])}
    ${arrowDown(51, 120, 136)}
    ${box(6, 136, 348, 34, ["下院の信任を基盤に、首相と内閣が政治を担う"], { stroke: "var(--accent)" })}`),
  scriptures: svgFig(138, "ヴェーダとウパニシャッド、叙事詩とバガヴァッド・ギーターの位置づけ", `
    ${box(6, 10, 168, 118, ["啓示された聖典", "（シュルティ）", "", "ヴェーダ", "ウパニシャッドを含む"], { stroke: "var(--accent)" })}
    ${box(186, 10, 168, 118, ["伝承された聖典", "（スムリティ）", "", "ラーマーヤナ", "マハーバーラタ", "バガヴァッド・ギーター"], { stroke: "var(--indigo)" })}`),
  samsara: svgFig(156, "行いであるカルマが次の生に影響する輪廻と、そこから解放される解脱", `
    <circle cx="112" cy="78" r="56" fill="none" stroke="var(--indigo)" stroke-width="2.5" stroke-dasharray="7 5"/>
    ${box(62, 8, 100, 32, ["生きる"])}${box(5, 62, 86, 32, ["カルマ（行い）"])}${box(133, 62, 86, 32, ["死"])}${box(62, 118, 100, 32, ["次の生へ"])}
    ${arrowRight(226, 262, 78)}
    ${box(266, 50, 88, 56, ["解脱", "（モークシャ）"], { fill: "var(--accent)", color: "var(--paper)" })}`),
  reform: svgFig(112, "1991年の危機からIMF支援、改革、現在の成長につながる流れ", `
    ${[["国際収支危機", "外貨準備が", "2週間分に"], ["IMFの支援", "通貨の", "切り下げ"], ["自由化", "許認可の撤廃", "関税の引下げ"], ["現在", "高成長", "雇用が課題"]].map((l, i) => box(6 + i * 89, 12, 75, 90, l, i === 2 ? { fill: "var(--accent)", color: "var(--paper)" } : {}) + (i < 3 ? arrowRight(82 + i * 89, 94 + i * 89, 57) : "")).join("")}`),
  viewpoints: svgFig(96, "都市と農村、北部と南部、宗教とカースト、世代という4つの視点", `
    <g fill="none" stroke="var(--accent)" stroke-width="2">
      <path d="M28 58V24h14v34M42 58V34h14v24M22 58h40"/>
      <circle cx="135" cy="38" r="21"/><path d="M135 22l6 16-6 16-6-16z" fill="var(--accent)"/>
      <circle cx="216" cy="38" r="16"/><circle cx="234" cy="38" r="16"/>
      <circle cx="303" cy="24" r="8"/><path d="M290 58c0-15 5-23 13-23s13 8 13 23"/><circle cx="331" cy="40" r="5"/><path d="M323 58c0-8 3-12 8-12s8 4 8 12"/>
    </g>${txt(45, 86, "都市と農村")}${txt(135, 86, "北部と南部")}${txt(225, 86, "宗教とカースト")}${txt(315, 86, "世代")}`),
  caste: svgFig(214, "4区分のヴァルナと、その枠の外に置かれた人々、数千に及ぶジャーティの関係", `
    ${txt(180, 14, "ヴァルナ（古代の文献の4区分）", 'font-weight="700"')}
    ${[["ブラーフマナ", "司祭"], ["クシャトリヤ", "王侯・武人"], ["ヴァイシャ", "商人など"], ["シュードラ", "奉仕"]].map(([a, b], i) => {
      const x = 10 + i * 88;
      return `<rect x="${x}" y="24" width="76" height="46" fill="var(--tint)" stroke="var(--line)"/><text x="${x + 38}" y="44" text-anchor="middle" fill="var(--ink)" font-size="11">${a}</text><text x="${x + 38}" y="61" text-anchor="middle" fill="var(--sub)" font-size="11">${b}</text>`;
    }).join("")}
    <rect x="10" y="78" width="340" height="28" fill="none" stroke="var(--accent)" stroke-dasharray="4 3"/>${txt(180, 96, "枠の外に置かれた人々（不可触民、ダリト）")}
    ${txt(180, 132, "ジャーティ（実際の社会集団、数千に及ぶとされる）", 'font-weight="700"')}
    ${dots(30, 5, 18, 146, 11, 3.6)}`),
  "caste-timeline": svgFig(232, "1950年から2027年までの主な出来事の年表", `
    <line x1="66" y1="18" x2="66" y2="214" stroke="var(--line)" stroke-width="2"/>
    ${[["1950", "憲法施行、不可触民制を廃止"], ["1992", "最高裁が留保の上限を原則50%に"], ["2019", "経済的弱者層（EWS）の枠を導入"], ["2022", "最高裁がEWS枠を合憲と判断"], ["2025", "国勢調査でのカースト調査を決定"], ["2027", "次回国勢調査の基準日（3月1日）"]].map(([y, t], i) => {
      const cy = 20 + i * 38.5;
      return `<text x="54" y="${cy + 5}" text-anchor="end" fill="var(--sub)" font-size="13">${y}</text><circle cx="66" cy="${cy}" r="5" fill="var(--accent)"/><text x="82" y="${cy + 4}" fill="var(--ink)" font-size="12">${t}</text>`;
    }).join("")}`),
  decision: svgFig(150, "肩書の高い人だけでなく、表に出ない顧問が最終判断をしている場合もある", `
    ${person(60, 16, "var(--accent)")}${person(180, 16, "var(--sub)", "4 3")}${person(300, 16, "var(--indigo)")}
    ${txt(60, 84, "社長・オーナー")}${txt(180, 84, "表に出ない顧問")}${txt(300, 84, "役職者")}
    <g fill="none" stroke="var(--sub)" stroke-width="1.5"><path d="M70 92l60 18"/><path d="M180 92v18" stroke-dasharray="4 3"/><path d="M290 92l-60 18"/></g>
    <rect x="110" y="112" width="140" height="30" fill="var(--tint)" stroke="var(--line)"/>${txt(180, 132, "最終判断は誰が？", 'font-weight="700"')}`),
  agreement: svgFig(96, "トップの合意、担当者の決定、期限と手順の決定、文書への記録という4段階", `
    ${[["トップの", "合意"], ["担当者を", "決める"], ["期限と手順", "を決める"], ["文書に", "記録する"]].map(([a, b], i) => {
      const x = 6 + i * 88;
      const fill = i === 3 ? "var(--accent)" : "var(--tint)";
      const color = i === 3 ? "var(--paper)" : "var(--ink)";
      return `<rect x="${x}" y="14" width="72" height="66" fill="${fill}" stroke="var(--line)"/><text x="${x + 36}" y="43" text-anchor="middle" fill="${color}" font-size="12">${a}</text><text x="${x + 36}" y="61" text-anchor="middle" fill="${color}" font-size="12">${b}</text>${i < 3 ? `<path d="M${x + 75} 47h10m-4-4l4 4-4 4" fill="none" stroke="var(--sub)" stroke-width="1.5"/>` : ""}`;
    }).join("")}`),
  area: `<svg viewBox="0 0 360 170" role="img" aria-label="日本を1としたとき、インドの面積は約8.8倍">
    <rect x="20" y="10" width="150" height="150" fill="var(--accent)" opacity=".85"/>
    <text x="95" y="82" text-anchor="middle" fill="#fff" font-size="16">インド</text>
    <text x="95" y="104" text-anchor="middle" fill="#fff" font-size="13">約8.8倍</text>
    <rect x="200" y="109.4" width="50.6" height="50.6" fill="var(--indigo)"/>
    <text x="225" y="139" text-anchor="middle" fill="#fff" font-size="14">日本</text>
  </svg>`,
};

function layout({ title, description, depth, draft, main }) {
  const r = "../".repeat(depth);
  const report = site.reportUrl
    ? `<a href="${esc(site.reportUrl)}" rel="noopener">誤りを報告する</a>`
    : `<span>誤りの報告フォーム（準備中）</span>`;
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${draft || site.noindex ? '<meta name="robots" content="noindex">\n' : ""}<link rel="stylesheet" href="${r}assets/style.css">
</head>
<body>
<header class="site-head"><div class="wrap">
  <a class="brand" href="${r}index.html">${esc(site.name)}</a>
  <nav><a href="${r}index.html#course">入門コース</a><a href="${r}holidays.html">祝日</a><a href="${r}review.html">復習</a><a href="${r}about.html">このサイトについて</a></nav>
</div></header>
<main class="wrap">
${main}
</main>
<footer class="site-foot"><div class="wrap">
  <p>本サイトの記事とクイズは、生成AIが下書きと出典の確認を行い、運営者が公開しています。誤りが含まれる可能性があります。</p>
  <p>${report} ・ <a href="${r}about.html">このサイトについて</a> ・ 運営: ${esc(site.operator)}</p>
</div></footer>
<script src="${r}assets/quizzes.js"></script>
<script src="${r}assets/site.js"></script>
</body>
</html>
`;
}

function renderBlock(b) {
  if (b.h) return `<h2>${esc(b.h)}</h2>`;
  if (b.p) return `<p>${esc(b.p)}</p>`;
  if (b.note) return `<aside class="note">${esc(b.note)}</aside>`;
  if (b.figure) return `<figure>${FIGURES[b.figure]}<figcaption>${esc(b.caption)}</figcaption></figure>`;
  if (b.views)
    return `<div class="views">${b.views.map((v) => `<section><h3>${esc(v.who)}</h3><p>${esc(v.text)}</p></section>`).join("")}</div>`;
  throw new Error("未知のブロック: " + JSON.stringify(b));
}

function articleLink(a, depth) {
  const r = "../".repeat(depth);
  const num = String(a.n).padStart(2, "0");
  const inner = `<span class="num">${num}</span><span class="txt"><strong>${esc(a.title)}</strong><small>${esc(a.desc)}</small></span>`;
  if (!isReady(a)) return `<li class="item soon" data-search="${esc(a.title + a.desc)}"><div>${inner}<em>準備中</em></div></li>`;
  return `<li class="item" data-slug="${a.slug}" data-search="${esc(a.title + a.desc)}"><a href="${r}articles/${a.slug}.html">${inner}<em class="state"></em></a></li>`;
}

function renderArticle(a) {
  const d = loaded[a.slug];
  const cat = categories.find((c) => c.id === a.cat);
  const i = course.findIndex((c) => c.slug === a.slug);
  const next = i >= 0 ? course.slice(i + 1).find(isReady) : null;
  const main = `<article class="article" data-slug="${a.slug}">
  ${BANNERS[a.slug] ? `<svg class="banner" viewBox="0 0 720 180" aria-hidden="true">${BANNERS[a.slug]}</svg>` : ""}
  <p class="kicker">${esc(cat.name)} ・ 約${d.minutes}分</p>
  <h1>${esc(a.title)}</h1>
  ${d.draft ? '<p class="draft">この記事は下書きです。運営者による確認が済むまで、内容に誤りが含まれる可能性があります。</p>' : ""}
  <section class="points"><h2>この記事の要点</h2><ul>${d.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul></section>
  ${d.body.map(renderBlock).join("\n  ")}
  ${a.slug === "festivals" ? '<p class="next">時期と意味、州による違い: <a href="../holidays.html">インドの祝日と祝祭</a></p>' : ""}
  <section class="quiz-box"><h2>確認クイズ</h2><div id="quiz" data-slug="${a.slug}"></div></section>
  <section class="sources"><h2>出典</h2><ol>${d.sources.map((s) => `<li><a href="${esc(s.u)}" rel="noopener">${esc(s.t)}</a></li>`).join("")}</ol><p>出典の確認日: ${esc(d.checked)}</p></section>
  ${next ? `<p class="next">入門コースの次の記事: <a href="${next.slug}.html">${esc(next.title)}</a></p>` : ""}
</article>`;
  return layout({ title: `${a.title} | ${site.name}`, description: d.points[0], depth: 1, draft: d.draft, main });
}

function renderIndex() {
  const main = `<section class="hero">
  <h1>インドを、教養として。</h1>
  <p>歴史、宗教、ビジネス。短い解説を読んで、クイズで確かめながら、インドを読み解く土台をつくります。</p>
  <div class="progress" hidden><div class="bar"><span></span></div><p></p></div>
</section>
<section id="course"><h2>入門コース</h2><p class="lead">初めての方は、この8本を順番に読むのがおすすめです。</p>
<ol class="list">${course.map((a) => articleLink(a, 0)).join("")}</ol></section>
<section><h2>資料</h2><p class="lead"><a href="holidays.html">インドの祝日と祝祭</a>: ディワリなどの時期、意味、過ごし方と、州による違いをまとめました。</p></section>
<section id="all"><h2>分野から選ぶ</h2>
<label class="search"><span>記事を絞り込む</span><input id="filter" type="search" placeholder="例: 憲法、財閥、祝祭"></label>
${categories.map((c) => `<div class="cat"><h3>${esc(c.name)}</h3><ol class="list">${articles.filter((a) => a.cat === c.id).map((a) => articleLink(a, 0)).join("")}</ol></div>`).join("\n")}
<p id="no-hit" hidden>該当する記事はありません。</p></section>`;
  return layout({ title: `${site.name} | インドの一般常識を学ぶ`, description: "インドの歴史、宗教、ビジネスを、短い解説とクイズで学べる日本語の教養サイトです。", depth: 0, draft: false, main });
}

function renderAbout() {
  const main = `<article class="article"><h1>このサイトについて</h1>
  <p>${esc(site.name)}は、インドをよく知らない日本語の読者が、歴史、社会、ビジネスを教養として学ぶためのサイトです。</p>
  <h2>作成方法とAIの利用</h2>
  <p>記事とクイズは、生成AIが下書きの作成と出典の確認を行い、運営者が内容を確認して公開しています。専門家の監修は受けていません。誤りが含まれる可能性があるため、重要な判断には出典や公的機関の情報をご確認ください。</p>
  <h2>編集の方針</h2>
  <ul><li>政府、国際機関、公的機関、学術書、主要報道を優先して出典とします。</li><li>議論のある話題は、複数の立場をそれぞれの主張として紹介します。</li><li>クイズは事実を確認する内容に限ります。</li><li>統計には基準年を示し、記事ごとに出典の確認日を記載します。</li><li>図は模式図であり、国境や領有権についての見解を示すものではありません。</li></ul>
  <h2>学習記録について</h2>
  <p>既読やクイズの結果はお使いの端末のブラウザ内にのみ保存され、運営者には送信されません。個人情報の収集やアクセス解析は行っていません。</p>
  <p><button id="reset" type="button">この端末の学習記録を消去する</button></p>
  <h2>誤りのご報告</h2>
  <p>${site.reportUrl ? `<a href="${esc(site.reportUrl)}" rel="noopener">報告フォーム</a>からお知らせください。` : "報告フォームは準備中です。"}</p>
  <p>運営: ${esc(site.operator)}</p></article>`;
  return layout({ title: `このサイトについて | ${site.name}`, description: `${site.name}の作成方法、AIの利用、編集方針について。`, depth: 0, draft: false, main });
}

function renderReview() {
  const main = `<article class="article"><h1>間違えた問題の復習</h1>
  <p>クイズで間違えた問題を解き直せます。正解すると一覧から外れます。</p>
  <div id="review"></div></article>`;
  return layout({ title: `復習 | ${site.name}`, description: "間違えたクイズを解き直すページです。", depth: 0, draft: false, main });
}

const HOLIDAY_TYPES = { national: "全国の祝日", gazetted: "全国の官公庁の休日", option: "州や職場で異なる" };

function renderHolidays() {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, "content/holidays.json"), "utf8"));
  const groups = [...new Set(d.items.map((h) => h.group).filter((g) => g !== "islam"))];
  const card = (h) => `<section class="hd"><p class="hd-date">${esc(h.when)}<span class="hd-tag ${h.type}">${HOLIDAY_TYPES[h.type]}</span></p>
    <h3>${esc(h.name)} <small>${esc(h.en)}</small></h3>
    <p class="hd-where">${esc(h.where)}</p>
    <dl><dt>意味</dt><dd>${esc(h.mean)}</dd><dt>何をする</dt><dd>${esc(h.do)}</dd></dl></section>`;
  const list = (g) => d.items.filter((h) => h.group === g).map(card).join("\n  ");
  const main = `<article class="article">
  <p class="kicker">資料</p>
  <h1>インドの祝日と祝祭</h1>
  ${d.draft ? '<p class="draft">このページは下書きです。運営者による確認が済むまで、内容に誤りが含まれる可能性があります。</p>' : ""}
  <section class="points"><h2>見方のポイント</h2><ul>
    <li>全国共通の祝日は、1月26日、8月15日、10月2日の三つです。</li>
    <li>多くの祝祭は太陰暦やイスラム暦によるため、毎年時期が動きます。ここでは、おおよその時期を示します。</li>
    <li>どの祝祭が休みになるかは、州や職場によって異なります。</li>
  </ul></section>
  <nav class="hd-months" aria-label="項目へ移動"><a href="#states">州による違い</a>${groups.map((g, i) => `<a href="#g${i}">${esc(g)}</a>`).join("")}<a href="#islam">イスラム暦の祝祭</a></nav>
  <h2 id="states">州によって祝日は違う</h2>
  <p>インドの休日は、全国で一律には決まっていません。州政府はそれぞれ祝日を定めており、銀行の休日も地域ごとに異なります。</p>
  <p>州にある中央政府の官公庁も同じです。全国で必ず休むのは14日で、残りの3日は、ホーリーやオーナムなど12の候補から州都の委員会が選びます。地域で大切な行事を選択休日に加えることもできます。</p>
  <dl class="hd-states">${d.states.map(([s, t]) => `<dt>${esc(s)}</dt><dd>${esc(t)}</dd>`).join("")}</dl>
  <aside class="note">同じ祝祭でも休む日がずれます: 2026年のディワリは、中央政府の一覧では11月8日でしたが、銀行の休日はグワーハーティーが11月9日、ムンバイが11月10日でした。出張や納期の前には、相手の州の休日一覧を確認しましょう。</aside>
  ${groups.map((g, i) => `<h2 id="g${i}">${esc(g)}</h2>\n  ${list(g)}`).join("\n  ")}
  <h2 id="islam">イスラム暦の祝祭</h2>
  <p>イスラム暦は1年が太陽暦より約11日短いため、時期は毎年早まっていきます。正確な日は月の観測で決まり、直前まで確定しないことがあります。</p>
  ${list("islam")}
  <aside class="note">地域の祝祭はほかにも数多くあります。ここでは、日本の読者が仕事やニュースで出会いやすいものを選びました。</aside>
  <section class="sources"><h2>出典</h2><ol>${d.sources.map((s) => `<li><a href="${esc(s.u)}" rel="noopener">${esc(s.t)}</a></li>`).join("")}</ol><p>休日の分類は中央政府官公庁向けの一覧に基づきます。出典の確認日: ${esc(d.checked)}</p></section>
</article>`;
  return layout({ title: `インドの祝日と祝祭 | ${site.name}`, description: "ディワリ、ホーリー、アーユダ・プージャーなど、インドの祝日と祝祭の時期、意味、過ごし方、州による違いをまとめました。", depth: 0, draft: d.draft, main });
}

const NOTE_DIR = path.join(ROOT, "export/note");
const NOTE_FOOTER = "本記事は、生成AIが下書きの作成と出典の確認を行いました。誤りが含まれる可能性があります。";

function noteBlock(b) {
  if (b.h) return "## " + b.h;
  if (b.p) return b.p;
  if (b.note) return "> " + b.note;
  if (b.figure) return "[図を挿入: " + b.caption + "]";
  if (b.views) return b.views.map((v) => "**" + v.who + "**\n" + v.text).join("\n\n");
  throw new Error("未知のブロック: " + JSON.stringify(b));
}

function noteSources(sources) {
  return "## 出典\n\n" + sources.map((s) => "- " + s.t + "\n  " + s.u).join("\n");
}

function noteArticle(a) {
  const d = loaded[a.slug];
  return [
    "# " + a.title,
    "## この記事の要点\n\n" + d.points.map((p) => "- " + p).join("\n"),
    ...d.body.map(noteBlock),
    "## 確認クイズ\n\n" + d.quiz.map((q, i) => "**Q" + (i + 1) + ". " + q.q + "**\n" + q.choices.map((c, j) => (j + 1) + ". " + c).join("\n")).join("\n\n"),
    "## クイズの答え\n\n" + d.quiz.map((q, i) => "Q" + (i + 1) + ": " + q.choices[q.answer] + "。" + q.why).join("\n"),
    noteSources(d.sources),
    "出典の確認日: " + d.checked + "\n\n" + NOTE_FOOTER,
  ].join("\n\n") + "\n";
}

function noteHolidays() {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, "content/holidays.json"), "utf8"));
  const items = d.items.map((h) => "## " + h.name + "（" + h.en + "）\n\n時期: " + h.when + "\n地域: " + h.where + "\n\n**意味**\n" + h.mean + "\n\n**何をする**\n" + h.do);
  const states = "## 州によって祝日は違う\n\n" + d.states.map(([s, t]) => "- " + s + ": " + t).join("\n");
  return ["# インドの祝日と祝祭", states, ...items, noteSources(d.sources), "出典の確認日: " + d.checked + "\n\n" + NOTE_FOOTER].join("\n\n") + "\n";
}

function writeNoteExports() {
  fs.rmSync(NOTE_DIR, { recursive: true, force: true });
  fs.mkdirSync(NOTE_DIR, { recursive: true });
  for (const a of articles.filter(isReady)) fs.writeFileSync(path.join(NOTE_DIR, String(a.n).padStart(2, "0") + "-" + a.slug + ".md"), noteArticle(a));
  fs.writeFileSync(path.join(NOTE_DIR, "holidays.md"), noteHolidays());
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, "articles"), { recursive: true });
fs.cpSync(path.join(ROOT, "assets"), path.join(OUT, "assets"), { recursive: true });
fs.writeFileSync(path.join(OUT, ".nojekyll"), "");

const quizzes = {};
for (const a of articles.filter(isReady)) {
  quizzes[a.slug] = { title: a.title, items: loaded[a.slug].quiz };
  fs.writeFileSync(path.join(OUT, "articles", a.slug + ".html"), renderArticle(a));
}
const ready = articles.filter(isReady).map((a) => a.slug);
fs.writeFileSync(path.join(OUT, "assets/quizzes.js"), `window.QUIZZES=${JSON.stringify(quizzes)};window.READY=${JSON.stringify(ready)};\n`);
fs.writeFileSync(path.join(OUT, "index.html"), renderIndex());
fs.writeFileSync(path.join(OUT, "about.html"), renderAbout());
fs.writeFileSync(path.join(OUT, "review.html"), renderReview());
fs.writeFileSync(path.join(OUT, "holidays.html"), renderHolidays());
writeNoteExports();
console.log(`生成完了: ${ready.length}/${articles.length} 記事`);
