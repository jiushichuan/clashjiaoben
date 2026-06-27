// ============================================================================
// bgpeer 覆写脚本，版本3.1 (Mihomo 系通用: Mihomo Party / ClashMi / Clash Verge Rev / FlClash)
// 用法: 在客户端"覆写"处粘贴链接导入,或复制导入，或做文件导入
//       ClashMi把链接添加到➜核心设置➜复写➜右上➕里面去，类型选js，然后选择这个复写。
// 入口约定: 客户端会调用 main(config), config 为订阅解析后的对象, 返回修改后的 config。

// ----------------------------- 可调参数 -----------------------------
const ICON = "https://gh-proxy.com/https://raw.githubusercontent.com/bgpeer/icons/main/color/";
const RULES = "https://gh-proxy.com/https://raw.githubusercontent.com/bgpeer/rules/main/";
const threshold = 2;     // 某国节点数 < 该值则不生成该组 (1=有就生成, 2=至少2个才显示)
const fixUSFlag = true;  // 🇺🇲(U+1F1FA U+1F1F2) -> 🇺🇸(U+1F1FA U+1F1F8)
const setDNS = true;     // 裸订阅无 DNS, 由本脚本提供
const setSniffer = true;  // 裸订阅无嗅探, 由本脚本提供
const setTun = true;     // 裸订阅无 tun, 由本脚本提供 (没 tun 抓不到流量=没网)
const setPanel = true;   // 浏览器面板开关: 开=开放控制器API(9092), 可用 zashboard 在线面板控制; 关=不开放
const otherGroup = true;  // 把未归入任何国家组的节点收进「🎲其他随机」(仅在确有漏网节点时生成)
const FETCH_VIA = "fallback";       // 规则集下载通道: ""=DIRECT直连; "fallback"=DIRECT优先,连不上自动切代理; "🌍全球加速"=强制走代理。path 缓存始终保留
const setClientOpts = true; // 入站端口/局域网/认证等客户端私有项。移动端若与 FlClash/ClashMi 自身设置冲突(典型: GUI连不上内核)就设 false
const TUN_STACK = "mixed";  // tun 栈: "mixed"(与原配一致,带 auto-redirect/gso) 或 "gvisor"(FlClash 实测兼容)
const SMUX_FILL = true;     // 给 ss/vmess/vless/trojan(非Vision、未自带)补 smux h2mux。注意: 服务端没开mux会连不上, 节点连不上就设 false
const ADBLOCK = true;       // 广告规则集是否加载开关，true=加载，false=不加载，Clashmi在iOS端内存吃紧时设 false 就会少加载18万行规则
// 协议白名单(将来有新协议要纳入, 只需在这里加协议名; 不在名单的一律不碰, 保持订阅原样)
const FP_OK   = ["vless", "vmess", "trojan"];        // 吃 uTLS 指纹(client-fingerprint)的协议
const SMUX_OK = ["ss", "vmess", "vless", "trojan"];  // 支持 smux 多路复用的协议

// 机场订阅 (proxy-providers)。节点由订阅或机场提供, 经各组 include-all 自动并入, 无需改组。
const useProviders = true;           // 常开稳定: 没填/占位的槽位自动跳过, 且与软件已有 provider 合并
const PROVIDER_URLS = {              // 机场名: 链接。前缀 ¹²³… 按顺序自动加, 加多少个都行; 保留两边引号
  "机场1": "#机场订阅",   // 添加更多机场链接，此处链接节点不会被收集到动态国家随机分组，原因：有软件壁垒
  "机场2": "#机场订阅",
  "机场3": "#机场订阅",
};
const PROVIDER_PROXY = "📥订阅下载"; // 拉机场订阅的通道: 默认 DIRECT优先, 直连不通自动切🌍全球加速。也可直接填 "DIRECT" 或 "🌍全球加速"

// 国家组: [组名, 匹配正则]。顺序即面板展示顺序; 只输出命中的。美国旗一律 🇺🇸。
const COUNTRY = [
  ["🇭🇰香港随机",   /🇭🇰|HK|Hong|hong|香港|深港|沪港|京港/],
  ["🇹🇼台湾随机",   /🇹🇼|TW|TWN|Taiwan|Taipei|台湾|台灣|台北/],
  ["🇯🇵日本随机",   /🇯🇵|JP|Japan|japan|Tokyo|东京|大阪|日本/],
  ["🇸🇬新加坡随机", /🇸🇬|SG|Singapore|singapore|新加坡|狮城/],
  ["🇰🇷韩国随机",   /🇰🇷|KR|Korea|korea|韩国|首尔/],
  ["🇺🇸美国随机",   /🇺🇸|US|USA|America|美国|洛杉矶|纽约|西雅图|圣何塞|硅谷/],
  ["🇬🇧英国随机",   /🇬🇧|UK|GB|England|Britain|London|英国|伦敦/],
  ["🇩🇪德国随机",   /🇩🇪|DE|Germany|German|Frankfurt|德国|法兰克福/],
  ["🇳🇱荷兰随机",   /🇳🇱|NL|Netherlands|Holland|Amsterdam|荷兰|阿姆斯特丹/],
  ["🇫🇷法国随机",   /🇫🇷|FR|France|Paris|法国|巴黎/],
  ["🇨🇦加拿大随机",  /🇨🇦|CA|Canada|加拿大|多伦多/],
  ["🇦🇺澳洲随机",    /🇦🇺|AU|Australia|Sydney|澳大利亚|悉尼/],
  ["🇷🇺俄罗斯随机",  /🇷🇺|RU|Russia|Moscow|俄罗斯|莫斯科/],
  ["🇮🇳印度随机",    /🇮🇳|India|india|Mumbai|Bombay|Delhi|Bangalore|Bengaluru|Chennai|印度|孟买|新德里|班加罗尔/],
  ["🇻🇳越南随机",    /🇻🇳|Vietnam|vietnam|Hanoi|Saigon|越南|河内|胡志明|西贡/],
  ["🇲🇾马来西亚随机", /🇲🇾|Malaysia|malaysia|KualaLumpur|Kuala|马来|吉隆坡/],
  ["🇹🇭泰国随机",    /🇹🇭|TH|Thailand|thailand|Bangkok|泰国|曼谷/],
  ["🇮🇩印尼随机",    /🇮🇩|Indonesia|indonesia|Jakarta|印尼|印度尼西亚|雅加达/],
  ["🇵🇭菲律宾随机",  /🇵🇭|PH|Philippines|philippines|Manila|菲律宾|马尼拉/],
  ["🇹🇷土耳其随机",  /🇹🇷|Turkey|turkey|Türkiye|Istanbul|土耳其|伊斯坦布尔/],
  ["🇦🇪阿联酋随机",  /🇦🇪|UAE|Emirates|Dubai|阿联酋|迪拜|阿布扎比/],
  ["🇧🇷巴西随机",    /🇧🇷|BR|Brazil|brazil|Brasil|SaoPaulo|巴西|圣保罗/],
  ["🇦🇷阿根廷随机",  /🇦🇷|AR|Argentina|argentina|阿根廷|布宜诺斯艾利斯/],
];

// 规则集锚点。FETCH_VIA 决定下载通道(见上); path: 下成功后本地缓存, 之后冷启动直接读缓存
const FETCH_GROUP = "📥规则下载";   // FETCH_VIA="fallback" 时, 规则集走这个"DIRECT优先回落"组下载
const P = (u) => {
  const o = {};
  if (FETCH_VIA === "fallback") o.proxy = FETCH_GROUP;
  else if (FETCH_VIA) o.proxy = FETCH_VIA;
  o.path = "./bgpeer/" + u.replace(/[\/!]/g, "_");
  return o;
};
const D = (u) => Object.assign({ type: "http", behavior: "domain",    interval: 86400, format: "mrs",  url: RULES + u }, P(u));
const I = (u) => Object.assign({ type: "http", behavior: "ipcidr",    interval: 86400, format: "mrs",  url: RULES + u }, P(u));
const C = (u) => Object.assign({ type: "http", behavior: "classical", interval: 86400, format: "yaml", url: RULES + u }, P(u));

const CN_DNS = ["https://dns.alidns.com/dns-query", "https://doh.pub/dns-query"];
const G_DNS  = ["https://1.1.1.1/dns-query", "https://dns.google/dns-query", "https://dns.quad9.net/dns-query", "tls://cloudflare-dns.com:853", "tls://dns.google:853"];
// 主表: [规则集名, 类型, 文件基名, 目标组, no-resolve?, DNS归属?] —— providers / rules / DNS分流 全从这里生成
//   类型: d=域名mrs/geosite  c=域名yaml/geosite  i=IP mrs/geoip
//   no-resolve: IP规则(i)填1, 其余填0占位解析;  DNS归属: g=走国外DNS, z=走国内DNS(中国) (reject 与 IP类 留空)
const META = { d: ["geosite", "domain", "mrs"], c: ["geosite", "classical", "yaml"], i: ["geoip", "ipcidr", "mrs"] };
const T = [
  ["reject", "d", "category-ads-all", "REJECT"],
  ["TikTok-zj", "c", "tiktok", "🎬TikTok", 0, "g"],
  ["douyin-zj", "c", "bytedance", "🎷抖音", 0, "z"],
  ["OpenAI-zj", "c", "openai", "🧠OpenAI", 0, "g"],
  ["PayPal", "d", "paypal", "💳PayPal", 0, "g"],
  ["games-!cn", "c", "category-games-!cn", "🎮国际游戏", 0, "g"],
  ["Telegram-zj", "c", "telegram", "💻Telegram", 0, "g"],
  ["Google-zj", "c", "google", "🌐Google服务", 0, "g"],
  ["google-ip", "i", "google", "🌐Google服务", 1],
  ["Facebook-zj", "d", "meta", "📱Meta", 0, "g"],
  ["GitHub-zj", "d", "github", "😈GitHub", 0, "g"],
  ["Microsoft", "d", "microsoft", "😊微软服务", 0, "g"],
  ["icloud", "d", "icloud", "🍎苹果服务", 0, "g"],
  ["Apple", "d", "apple", "🍎苹果服务", 0, "g"],
  ["twitter", "d", "twitter", "🐦X", 0, "g"],
  ["cloudflare-ip", "i", "cloudflare", "🌍全球加速", 1],
  ["cloudfront-ip", "i", "cloudfront", "🌍全球加速", 1],
  ["fastly-ip", "i", "fastly", "🌍全球加速", 1],
  ["greatfire", "d", "greatfire", "🌍全球加速", 0, "g"],
  ["gfw", "d", "gfw", "🌍全球加速", 0, "g"],
  ["geolocation-!cn", "d", "geolocation-!cn", "🌍全球加速", 0, "g"],
  ["games-cn", "d", "category-games-cn", "🎯直连", 0, "z"],
  ["bilibili", "d", "bilibili", "📺哔哩哔哩", 0, "z"],
  ["xiaohongshu", "d", "xiaohongshu", "📕小红书", 0, "z"],
  ["Alibaba", "c", "alibaba", "⛩️阿里腾讯", 0, "z"],
  ["Tencent", "c", "tencent", "⛩️阿里腾讯", 0, "z"],
  ["private", "d", "private", "🎯直连", 0, "z"],
  ["cn-domain", "d", "cn", "🎯直连", 0, "z"],
  ["private-ip", "i", "private", "🎯直连", 1],
  ["cn-ip", "i", "cn", "🎯直连", 1],
];
// G_SETS / CN_SETS 从 T 第6位(g/z)自动分出, 不再手写 (增减只在 T 行尾改 g/z)
const G_SETS  = T.filter(r => r[5] === "g").map(r => r[0]);
const CN_SETS = T.filter(r => r[5] === "z").map(r => r[0]);

// 服务组表: [组名, 图标, 默认直连?]  —— 1=默认🎯直连(微软/苹果系), 省略=默认🌍全球加速
const SVC = [
  ["🎷抖音", "douyin_1.png"], ["🎬TikTok", "tiktok_1.png"], ["🎮国际游戏", "game_2.png"],
  ["💻Telegram", "telegram.png"], ["🧠OpenAI", "chatgpt.png"],
  ["💳PayPal", "paypal.png"], ["🌐Google服务", "google_1.png"], ["📱Meta", "meta.png"],
  ["🐦X", "x.png"],  ["😈GitHub", "github.png"],
  ["😊微软服务", "microsoft.png", 1], ["🍎苹果服务", "apple.png", 1], 
  ["📺哔哩哔哩", "bilibili_2.png", 1], ["📕小红书", "xiaohongshu_1.png", 1],
];

function main(config) {
  // 空 config / 没传 config 兜底: 即使客户端给空壳(proxies: [])甚至什么都不给, 也能输出完整配置。
  // 注: 这只保证 js 自身不崩; 客户端是否允许"无订阅启动"由客户端决定, 多数仍需一个空壳订阅当载体。
  if (!config || typeof config !== "object") config = {};
  if (!Array.isArray(config.proxies)) config.proxies = [];
  const proxies = config.proxies;
  // 合并而非覆盖: 保留软件 yaml 里已有的 proxy-providers; 机场节点经 include-all 自动并入各组
  if (useProviders) config["proxy-providers"] = Object.assign({}, config["proxy-providers"], buildProviders());

  // 1) 美国旗规范
  if (fixUSFlag) {
    for (const p of proxies) {
      if (p && p.name) p.name = p.name.replace(/\u{1F1FA}\u{1F1F2}/gu, "\u{1F1FA}\u{1F1F8}");
    }
  }

  // 2) 检测实际存在的国家 (节点数 >= threshold)
  const present = COUNTRY.filter(function (c) {
    let n = 0;
    for (const p of proxies) if (p && p.name && c[1].test(p.name)) n++;
    return n >= threshold;
  });
  const countryNames = present.map(function (c) { return c[0]; });

  // 2.5) 检测是否有"未归入任何国家组"的漏网节点
  const ALL_PAT = COUNTRY.map(function (c) { return c[1].source; }).join("|");
  const ALL_RE = new RegExp(ALL_PAT);
  let hasOther = false;
  for (const p of proxies) { if (p && p.name && !ALL_RE.test(p.name)) { hasOther = true; break; } }
  const useOther = otherGroup && hasOther;
  const OTHER = "🎲其他随机";
  const tail = countryNames.concat(useOther ? [OTHER] : []);  // 国家组 + (可选)其他随机

  // 3) 公共片段
  const URLTEST = {
    type: "url-test", lazy: true, icon: ICON + "bypass.png",
    "include-all": true, "exclude-type": "direct",
    url: "https://www.gstatic.com/generate_204", interval: 120, tolerance: 30, timeout: 5000, hidden: true,
  };
  const AUTO = { "include-all": true, "exclude-type": "direct", filter: ".*" };

  // 4) 三处列表 (随国家动态变化)
  const ACCEL   = ["♻️全部随机", "🔗链式出口"].concat(tail);
  const GLOBAL  = ["🌍全球加速", "🔗链式出口", "♻️全部随机"].concat(tail, ["🎯直连"]);
  const GLOBAL_D = ["🎯直连", "🌍全球加速", "🔗链式出口", "♻️全部随机"].concat(tail);

  // 5) select 服务组辅助
  const sel = function (name, icon, list) {
    return Object.assign({ name: name, type: "select", icon: ICON + icon, proxies: list }, AUTO);
  };

  // 6) 国家 url-test 组 (只含命中的) + (可选)其他随机 + 全部随机兜底
  const countryGroups = present.map(function (c) {
    return Object.assign({}, URLTEST, { name: c[0], filter: c[1].source });
  });
  if (useOther) {
    // include-all 收全部, 再用 exclude-filter 排除所有国家关键字 = 只剩没归类的
    countryGroups.push(Object.assign({}, URLTEST, { name: OTHER, "exclude-filter": ALL_PAT }));
  }
  countryGroups.push(Object.assign({}, URLTEST, { name: "♻️全部随机", filter: ".*" }));

  // 7) 组装 proxy-groups
  config["proxy-groups"] = [
    Object.assign({ name: "🌍全球加速", type: "select", icon: ICON + "global.png", proxies: ACCEL },
                  AUTO, { url: "https://www.gstatic.com/generate_204", interval: 120, timeout: 5000 }),
    ...SVC.map(function (s) { return sel(s[0], s[1], s[2] ? GLOBAL_D : GLOBAL); }),
    { name: "⛩️阿里腾讯", type: "select", icon: ICON + "alibaba_tencent.png", proxies: ["🎯直连", "🌍全球加速"] },
    { name: "🎯直连",   type: "select", icon: ICON + "china.png", proxies: ["DIRECT", "🌍全球加速"], url: "http://connect.rom.miui.com/generate_204" },
    { name: "🤡漏网之鱼", type: "select", icon: ICON + "match_1.png", proxies: ["🌍全球加速", "🎯直连"] },
    // ── 链式 出口/中转 (可见卡片, 放漏网之鱼后面; 直接点卡片进组选节点) ──
    // 出口(落地): override.dialer-proxy 给 include-all 单节点注入前置=中转; 选"单节点"才成链, 不含🌍全球加速(否则成环)
    Object.assign({ name: "🔗链式出口", type: "select", icon: ICON + "bypass.png",
      override: { "dialer-proxy": "🔗链式中转" },
      proxies: ["♻️全部随机"].concat(tail) }, AUTO),
    // 中转(前置跳板): 🌍全球加速 + 国家动态组 + ♻️全部随机 + 单节点
    Object.assign({ name: "🔗链式中转", type: "select", icon: ICON + "bypass.png",
      proxies: ["🌍全球加速", "♻️全部随机"].concat(tail) }, AUTO),
  ].concat(
    // FETCH_VIA="fallback": 规则集下载走 DIRECT优先, 健康检查指向真实下载源(gh-proxy),
    // 直连连得上就用直连, 连不上才自动切到 🌍全球加速。冷启动默认用列表第一个(DIRECT)。
    FETCH_VIA === "fallback" ? [{
      name: FETCH_GROUP, type: "fallback", icon: ICON + "bypass.png",
      proxies: ["DIRECT", "🌍全球加速"],
      url: RULES + "geo/geoip/private.mrs",
      interval: 300, lazy: false, hidden: true,
    }] : []
  ).concat(
    // 📥订阅下载: 机场订阅下载通道。DIRECT优先(健康检查直连能过就用直连), 不通自动切🌍全球加速。
    // 也解决纯机场冷启动: 首启组里还没节点时, 先用 DIRECT 拉订阅把节点引导起来。
    (useProviders && PROVIDER_PROXY === "📥订阅下载") ? [{
      name: "📥订阅下载", type: "fallback", icon: ICON + "bypass.png",
      proxies: ["DIRECT", "🌍全球加速"],
      url: "https://www.gstatic.com/generate_204",
      interval: 300, lazy: false, hidden: true,
    }] : []
  ).concat(countryGroups);

  // 8.5) 自定义内置 GLOBAL 组。
  const orderedGroups = config["proxy-groups"].filter(g => !g.hidden && g.name !== "GLOBAL").map(g => g.name);
  config["proxy-groups"].push({
    name: "GLOBAL",
    type: "select",
    icon: ICON + "match.png",
    "include-all": true,                          
    proxies: [...new Set(orderedGroups.concat(ACCEL, ["DIRECT"]))],  // 去重: 🔗链式出口在orderedGroups和ACCEL里各一次
  });

  // 8+9) rule-providers 与 rules 由主表 T 一次生成
  //      provider 是 map (顺序无所谓); rules 是数组 (顺序=T 的顺序, 即匹配优先级)
  config["rule-providers"] = {};
  config.rules = [];
  for (const [name, t, file, group, nr] of T) {
    if (!ADBLOCK && name === "reject") continue;   // 关广告: provider 与规则一起跳过
    const [dir, behavior, ext] = META[t];          // d/c/i -> [目录, behavior, 扩展名(也是format)]
    const u = "geo/" + dir + "/" + file + "." + ext;
    config["rule-providers"][name] = Object.assign(
      { type: "http", behavior: behavior, format: ext, interval: 86400, url: RULES + u }, P(u)
    );
    config.rules.push("RULE-SET," + name + "," + group + (nr ? ",no-resolve" : ""));
  }
  config.rules.push("MATCH,🤡漏网之鱼");

  // 10) DNS (可选)
  if (setDNS) {
    // 由 G_SETS/CN_SETS 自动生成 nameserver-policy (增减只改顶部那两个数组)
    const nsPolicy = ADBLOCK ? { "rule-set:reject": ["https://dns.adguard.com/dns-query"] } : {};
    for (const s of G_SETS)  nsPolicy["rule-set:" + s] = G_DNS;
    for (const s of CN_SETS) nsPolicy["rule-set:" + s] = CN_DNS;
    config.dns = {
      enable: true, listen: "0.0.0.0:1053", ipv6: true,
      "enhanced-mode": "fake-ip", "cache-algorithm": "arc",
      "fake-ip-range": "198.18.0.0/16", "prefer-h3": true,
      "use-hosts": true, "use-system-hosts": true, "respect-rules": true,
      "fake-ip-filter-mode": "blacklist", "fake-ip-ttl": 60,
      "fake-ip-filter": ["localhost", "+.lan", "+.local", "+.arpa", "+.ntp.org", "captive.apple.com", "connectivitycheck.gstatic.com", "msftconnecttest.com", "msftncsi.com", "openai.*", "+.openai.*", "report-v2.samsung.japps.cn", "rule-set:private"],
      "direct-nameserver": ["system"],
      "default-nameserver": ["223.5.5.5", "119.29.29.29", "114.114.114.114", "180.76.76.76"],
      nameserver: ["https://dns.alidns.com/dns-query", "https://1.1.1.1/dns-query", "https://doh.pub/dns-query", "https://dns.google/dns-query", "https://dns.quad9.net/dns-query", "https://dns.adguard.com/dns-query", "tls://cloudflare-dns.com:853", "tls://dns.google:853"],
      "proxy-server-nameserver": ["https://1.1.1.1/dns-query", "https://dns.google/dns-query", "https://cloudflare-dns.com/dns-query", "https://dns.quad9.net/dns-query", "https://dns.adguard.com/dns-query", "https://public.dns.iij.jp/dns-query", "tls://cloudflare-dns.com:853", "tls://dns.google:853"],
      "direct-nameserver-follow-policy": true,
      "nameserver-policy": nsPolicy,
    };
  }

  // 11) 域名嗅探 (可选)
  if (setSniffer) {
    config.sniffer = {
      enable: true, "force-dns-mapping": true, "parse-pure-ip": true, "override-destination": true,
      sniff: { HTTP: { ports: [80, "8080-8880"], "override-destination": true }, TLS: { ports: [443, 8443] }, QUIC: { ports: [443, 8443] } },
      "force-domain": ["+.cloudflare.net", "+.akamaized.net", "+.akamai.net", "+.fastly.net", "+.cloudfront.net", "+.googlevideo.com", "+.ytimg.com", "+.youtube.com", "+.netflix.com", "+.instagram.com", "+.tiktokcdn.com", "+.tiktokv.com", "+.douyin.com", "+.douyincdn.com", "+.telegram.org", "+.t.me", "+.tdesktop.com", "+.cdn-telegram.org", "+.telegram-cdn.org"],
      "skip-domain": ["localhost", "+.lan", "+.local", "+.arpa", "+.invalid", "+.test", "+.push.apple.com", "+.pvp.net", "+.riotgames.com", "+.openai.com", "+.oaistatic.com", "+.oaiusercontent.com", "+.chatgpt.com"],
      "skip-src-address": ["127.0.0.0/8", "::1/128"],
      "skip-dst-address": ["17.0.0.0/8", "149.154.160.0/20", "91.108.0.0/16"],
    };
  }

  // —— 顶层配置 (与 Clashmi-fx 一致; setClientOpts 见顶部参数区) ——
  Object.assign(config, {
    "mode": "rule",
    "find-process-mode": "always",
    "unified-delay": true,
    "tcp-concurrent": true,
    "ipv6": true,
    ...(setClientOpts ? {
      "port": 7896, "socks-port": 7891, "redir-port": 7892, "tproxy-port": 7894, "mixed-port": 7893,
      "log-level": "warning",
      "etag-support": true,
      "disable-keep-alive": false,
      "inbound-tfo": true,
      "inbound-mptcp": false,
      "allow-lan": true,
      "bind-address": "*",
      "keep-alive-idle": 300,
      "keep-alive-interval": 30,
      "authentication": ["meta:88888888"],
      "skip-auth-prefixes": ["127.0.0.1/8", "::1/128"],
      "lan-allowed-ips": ["0.0.0.0/0", "::/0"],
      "lan-disallowed-ips": [],
      "global-ua": "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36",
      "ntp": { "enable": true, "server": "time.apple.com", "port": 123, "interval": 30, "dialer-proxy": "", "write-to-system": false },
      "experimental": { "quic-go-disable-ecn": true },
    } : {}),
  });

  // —— 浏览器面板 (控制器 API) —— 由 setPanel 独立控制, 与 setClientOpts 解耦
  if (setPanel) {
    config["external-controller"] = "0.0.0.0:9092";   // 0.0.0.0=本机+局域网可连; 只要本机改 127.0.0.1:9092
    config["secret"] = "88888888";                    // 访问口令, 局域网内靠它保护
    config["external-controller-cors"] = { "allow-origins": ["*"], "allow-private-network": true };
    config["external-ui"] = "./ui";
    config["external-ui-name"] = "zashboard";
    config["external-ui-url"] = "https://codeload.github.com/Zephyruso/zashboard/zip/refs/heads/gh-pages";
  }
  config.profile = Object.assign({ "store-selected": true, "store-fake-ip": true }, config.profile || {});

  // —— TUN (裸订阅必须有, 否则抓不到系统流量; 已补全到与 Clashmi-fx 一致; TUN_STACK 见顶部参数区) ——
  if (setTun) {
    const t = {
      enable: true,
      device: "mihomo",
      stack: TUN_STACK,
      mtu: 1500,
      "inet6-address": ["fdfe:dcba:9876::1/126"],
      "strict-route": true,
      "dns-hijack": ["any:53", "tcp://any:53"],
      "auto-route": true,
      "auto-detect-interface": true,
      "endpoint-independent-nat": true,
      "udp-timeout": 60,
      "disable-icmp-forwarding": true,
      "route-exclude-address-set": ["private-ip"],
      "route-exclude-cidr": ["192.168.0.0/16", "10.0.0.0/8", "172.16.0.0/12", "100.64.0.0/10", "fc00::/7", "fe80::/10"],
    };
    // auto-redirect / gso 只在 system/mixed 栈下有意义, gvisor 下加了可能报错, 故按栈区分
    if (TUN_STACK !== "gvisor") { t["auto-redirect"] = true; t["gso"] = true; t["gso-max-size"] = 65536; }
    config.tun = t;
  }

  // —— hosts (与 Clashmi-fx 一致) —— 值都是 127.0.0.1, 只列域名
  config.hosts = Object.assign(
    ["*.backloop.dev", "*.localtest.me", "*.lvh.me", "*.vcap.me", "*.traefik.me", "*.readymade.dev"]
      .reduce((h, d) => (h[d] = "127.0.0.1", h), {}),
    config.hosts || {}
  );

  // —— tunnels (端口转发, 与 Clashmi-fx 一致) —— [本地端口, 目标, 走哪个组]; network 都是 tcp+udp
  const TUN = [
    [7788, "jp1.wildrift.riotgames.com:443", "🎮国际游戏"],
    [7789, "jp1.pvp.net:443", "🎮国际游戏"],
    [9000, "149.154.167.91:443", "💻Telegram"],
    [9001, "149.154.167.92:443", "💻Telegram"],
    [9002, "149.154.175.100:443", "💻Telegram"],
    [7999, "api.openai.com:443", "🧠OpenAI"],
    [7443, "chat.openai.com:443", "🧠OpenAI"],
    [7700, "www.google.com:443", "🌐Google服务"],
    [7701, "accounts.google.com:443", "🌐Google服务"],
    [7702, "www.googleapis.com:443", "🌐Google服务"],
  ];
  config.tunnels = TUN.map(([port, target, proxy]) => ({
    network: ["tcp", "udp"], address: "127.0.0.1:" + port, target, proxy,
  }));

  // —— 给"吃 uTLS 指纹"的节点补 client-fingerprint=chrome(替代已废弃的 global-client-fingerprint)——
  // 只处理走标准 TLS 的协议(FP_OK 白名单); QUIC系(hysteria/hysteria2/tuic)、wireguard、ssh、
  // 纯 ss/ssr、anytls 等不在名单内一律跳过(它们不吃 uTLS, 强加可能告警/握手失败)。已自带指纹的也不动。
  (config.proxies || []).forEach(function (p) {
    if (!p || FP_OK.indexOf(p.type) === -1) return;   // 协议不在白名单 -> 跳过
    if (p["client-fingerprint"]) return;              // 已自带(含 REALITY 自带) -> 不覆盖
    var usesTLS = p.type === "trojan" || p.tls === true || p["reality-opts"];
    if (usesTLS) p["client-fingerprint"] = "chrome";  // 仅确实走 TLS 时才补
  });
  // 注: 不再给 proxy-providers 统一加 override.client-fingerprint —— 那是"整份订阅强制套用",
  // 会把订阅里的 hy2/tuic 等也一起套, 反而可能出问题。订阅模式请在订阅/机场侧配置指纹。

  // —— 给支持 smux 的节点补 smux h2mux(SMUX_FILL 开关; 服务端没开 mux 会连不上 -> 关掉)——
  // 仅 SMUX_OK 白名单内的协议; 且排除 XTLS Vision(有 flow 字段, 叠 smux 会破坏 XTLS);
  // hy2/tuic/wireguard/ssh/anytls 不在名单 -> 不碰(QUIC/自带mux/不支持)。已自带 smux 的不覆盖。
  if (SMUX_FILL) {
    (config.proxies || []).forEach(function (p) {
      if (!p || SMUX_OK.indexOf(p.type) === -1) return;   // 协议不支持 -> 跳过
      if (p.smux) return;                    // 已自带 -> 不动
      if (p.flow) return;                    // XTLS Vision(flow非空) -> 绝不加
      p.smux = { enable: true, protocol: "h2mux", "max-connections": 4, "min-streams": 4, padding: true };
    });
  }

  // —— YAML 安全化: 无条件执行(都是功能等价改写) ——
  return makeYamlSafe(config);
}

// 把单个节点名改成 YAML 安全。只动会破坏裸标量的字符; 国家匹配正则不含这些字符, 匹配不受影响。
function safeName(name) {
  let s = String(name)
    .replace(/:/g, "：").replace(/,/g, "，")
    .replace(/\[/g, "【").replace(/\]/g, "】")
    .replace(/\{/g, "｛").replace(/\}/g, "｝");
  // 行首保留字符(* & ! | > @ % # ?)会被当成指示符 -> 替成全角; 行首引号/反引号直接去掉
  s = s.replace(/^\*/, "＊").replace(/^&/, "＆").replace(/^!/, "！")
       .replace(/^\|/, "｜").replace(/^>/, "＞").replace(/^@/, "＠")
       .replace(/^%/, "％").replace(/^#/, "＃").replace(/^\?/, "？")
       .replace(/^["'`]/, "");
  return s;
}

// 数字 -> 上标 (1->¹, 10->¹⁰, 100->¹⁰⁰)。任意位数, 不设上限。
function sup(n) {
  const S = "⁰¹²³⁴⁵⁶⁷⁸⁹";  // ⁰¹²³⁴⁵⁶⁷⁸⁹
  return String(n).replace(/\d/g, function (d) { return S[+d]; });
}
// 生成 proxy-providers: 展开原锚点 *p, 按顺序自动加上标前缀。节点靠各组 include-all 自动收入。
function buildProviders() {
  const out = {}, names = Object.keys(PROVIDER_URLS);
  for (let i = 0; i < names.length; i++) {
    const url = PROVIDER_URLS[names[i]];
    if (!url || url.charAt(0) === "#") continue;   // 空 / 占位符(#机场订阅) -> 跳过, 上标序号不占用
    out[names[i]] = {
      type: "http", interval: 3600, proxy: PROVIDER_PROXY,
      "health-check": { enable: true, url: "https://www.gstatic.com/generate_204", interval: 300 },
      url: url, override: { "additional-prefix": sup(i + 1) },
    };
  }
  return out;
}

// 把整份配置改成 YAML 安全(无条件执行)。逐项功能等价, 不删任何"功能", 只换 ClashMi 内核
// 序列化时不会加引号、会导致启动报错的写法。对 FlClash/Verge/Party 也无副作用。
function makeYamlSafe(config) {
  for (const p of (config.proxies || [])) if (p && p.name) p.name = safeName(p.name);

  if (config["bind-address"] === "*") delete config["bind-address"];      // = 默认监听全部

  const cors = config["external-controller-cors"];
  if (cors && Array.isArray(cors["allow-origins"]) && cors["allow-origins"].indexOf("*") !== -1) {
    delete cors["allow-origins"];                                          // 裸 '*' 无安全等价, 仅去此项
  }

  if (config.hosts && typeof config.hosts === "object") {                  // '*.x' -> '.x'
    const h = {};
    for (const k of Object.keys(config.hosts)) h[k.indexOf("*.") === 0 ? k.slice(1) : k] = config.hosts[k];
    config.hosts = h;
  }
  return config;
}

// 兼容部分客户端的导出习惯; 浏览器/纯脚本环境忽略即可
if (typeof module !== "undefined") { module.exports = main; module.exports.main = main; }
