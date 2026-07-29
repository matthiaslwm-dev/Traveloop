"use client";

import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import Link from "next/link";
import Navbar from "./components/Navbar";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYouTubeApi(): Promise<void> {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previousCallback?.();
      resolve();
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }
  });
}

function setHighestQuality(target: any) {
  const levels: string[] = target.getAvailableQualityLevels?.() ?? [];
  target.setPlaybackQuality(levels[0] ?? "hd2160");
}

function extractYouTubeId(embedUrl: string) {
  return embedUrl.split("/embed/")[1]?.split("?")[0] ?? embedUrl;
}

const qualityLabels: Record<string, string> = {
  highres: "4K+",
  hd2160: "2160p",
  hd1440: "1440p",
  hd1080: "1080p",
  hd720: "720p",
  large: "480p",
  medium: "360p",
  small: "240p",
  tiny: "144p",
  auto: "Auto",
  default: "Auto",
};

function qualityLabel(level: string) {
  return qualityLabels[level] ?? level;
}

function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${m}:${s}`;
}

function Icon({ name }: { name: string }) {
  const svgProps = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  const paths: Record<string, ReactNode> = {
    tag: (
      <>
        <path d="M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
        <circle cx="7" cy="7" r="1.1" />
      </>
    ),
    pin: (
      <>
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z" />
        <circle cx="12" cy="10" r="2.6" />
      </>
    ),
    bolt: <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />,
    bag: (
      <>
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </>
    ),
    fork: (
      <>
        <path d="M4 2v6a3 3 0 0 0 6 0V2" />
        <path d="M7 8v14" />
        <path d="M17 2c-1.7 1.8-2 5-2 8h4c0-3-.3-6.2-2-8z" />
        <path d="M17 10v12" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    camera: (
      <>
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3l2-3h8l2 3h3a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </>
    ),
    ticket: (
      <>
        <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
        <path d="M10 6v12" strokeDasharray="2.5 2.5" />
      </>
    ),
    headset: (
      <>
        <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
        <path d="M4 13a2 2 0 0 1 2-2h1a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        <path d="M20 13a2 2 0 0 0-2-2h-1a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2z" />
        <path d="M18 18v1a2 2 0 0 1-2 2h-3" />
      </>
    ),
    coins: (
      <>
        <ellipse cx="12" cy="6" rx="8" ry="3.2" />
        <path d="M4 6v5.5c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2V6" />
        <path d="M4 11.5V17c0 1.8 3.6 3.2 8 3.2s8-1.4 8-3.2v-5.5" />
      </>
    ),
    handshake: (
      <>
        <path d="M2.5 11.5l4.2-3 3 2h4.6l3-2 4.2 3" />
        <path d="M8 13.5l2.3 2.3a2 2 0 0 0 2.9 0l3.3-3.3" />
        <path d="M13.7 12.5l2 2a1.6 1.6 0 0 0 2.3-2.3" />
      </>
    ),
    cup: (
      <>
        <path d="M4 8h13a3 3 0 0 1 0 6h-1" />
        <path d="M4 8v8a4 4 0 0 0 4 4h5a4 4 0 0 0 4-4V8" />
        <path d="M8 4c0 1-1 1-1 2M12 4c0 1-1 1-1 2M16 4c0 1-1 1-1 2" />
      </>
    ),
    cake: (
      <>
        <path d="M3 20h18" />
        <path d="M4 20v-9l8-6 8 6v9" />
        <path d="M4 11h16" />
        <circle cx="12" cy="7" r="1" />
      </>
    ),
    store: (
      <>
        <path d="M3 9l1.5-5h15L21 9" />
        <path d="M4 9v10a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9" />
        <path d="M3 9h18" />
        <path d="M9 20v-6h6v6" />
      </>
    ),
    leaf: (
      <>
        <path d="M4 20C4 10 11 4 20 4c0 9-6 16-16 16z" />
        <path d="M4 20c3-3 7-5 11-11" />
      </>
    ),
    landmark: (
      <>
        <path d="M4 21h16" />
        <path d="M5 21v-11M9 21v-11M15 21v-11M19 21v-11" />
        <path d="M3 10l9-6 9 6" />
      </>
    ),
  };
  return <svg {...svgProps}>{paths[name]}</svg>;
}

function StarbucksLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label="Starbucks"
    >
      <path d="M13.2072 5.2801c-.1052-.0188-.6126-.104-1.2072-.104s-1.102.0848-1.2072.104c-.0605.0108-.0837-.0484-.0377-.0828.0417-.0308 1.2445-.9463 1.2445-.9463l1.244.9463c.0469.0344.024.0936-.0364.0828zm-2.0783 5.9446s-.0636.0228-.0804.0788c.252.1937.4257.6343.9515.6343s.6995-.4406.9511-.6343c-.0164-.0564-.08-.0788-.08-.0788s-.3293.0776-.8711.0776c-.5418 0-.8711-.0776-.8711-.0776zM12 10.4832c-.146 0-.178-.0552-.2777-.0548-.0948.0004-.2789.076-.319.1453a.1542.1542 0 00.0413.0948c.2129.032.309.1505.5558.1505.2469 0 .3425-.1185.5558-.1505a.1579.1579 0 00.0412-.0948c-.0396-.0692-.224-.1445-.3193-.1453-.1-.0008-.1324.0548-.2781.0548zm11.9868 2.27a11.964 11.964 0 01-.076.8528c-1.359.2249-1.8447-.986-3.2368-.9252.0832.2954.1508.5963.2029.9036 1.148-.0008 1.6105 1.0724 2.8878.9143-.0672.3281-.148.6519-.2413.9708-1.01.0992-1.3657-.9044-2.5345-.8767.0096.1664.0148.3345.0148.5041l-.0048.2805 2.2696.866a12.04 12.04 0 01-.3965.9479c-.6823-.0376-.9175-.9127-1.9555-.8431a9.0882 9.0882 0 01-.118.665c.9015-.0632 1.0955.7667 1.7414.834a12.2317 12.2317 0 01-.5302.8767c-.3826-.205-.7143-.8231-1.4398-.8612a8.6035 8.6035 0 00.195-.6994c-.6435 0-1.3794-.2509-1.9964-.8127.2-1.1388-1.5674-2.2984-1.5674-3.1324 0-.9059.4582-1.4073.4582-2.6285 0-.9063-.4402-1.8895-1.104-2.5614a2.2175 2.2175 0 00-.4114-.3309c.6098.7547 1.078 1.6494 1.078 2.6858 0 1.15-.535 1.757-.535 2.8186 0 1.0612 1.5526 1.9796 1.5526 3.074 0 .4305-.1377.851-.5914 1.677.697.6962 1.605 1.076 2.1908 1.076.19 0 .292-.058.3601-.2073a9.0925 9.0925 0 00.1665-.391c.631.0245.9199.5979 1.2692.8268-.1916.2573-.393.5057-.6038.7462-.234-.2593-.5486-.6954-1.0092-.8167a9.2087 9.2087 0 01-.2613.473c.3966.108.6679.5082.878.7715a12.1305 12.1305 0 01-.7075.6754c-.1532-.2384-.3917-.541-.659-.7042a8.3639 8.3639 0 01-.3077.391c.2272.154.4277.4313.5586.6574-.2833.2272-.5763.443-.8796.6446-.1496-1.2192-1.8138-2.0548-1.3653-3.4693-.1472.2493-.3229.561-.3229.9364 0 1.024 1.0908 1.8366 1.1776 2.8542-.226.1353-.4573.2625-.693.383-.0392-1.1185-1.194-2.3425-1.194-3.2604 0-1.0248 1.342-2.054 1.342-3.2636 0-1.2105-1.5485-2.0484-1.5485-3.1112 0-1.062.6586-1.673.6586-3.0343 0-.9972-.4738-2.0063-1.2056-2.651-.1297-.1144-.2573-.2052-.4106-.2849.6903.828 1.0904 1.579 1.0904 2.7186 0 1.2801-.7546 1.9908-.7546 3.244 0 1.2537 1.5197 1.9507 1.5197 3.1192 0 1.1684-1.4145 2.1532-1.4145 3.3536 0 1.092 1.2468 2.182 1.2653 3.4777a11.7704 11.7704 0 01-.8327.3257c.1584-1.3089-1.245-2.659-1.245-3.727 0-1.1676 1.4674-2.1712 1.4674-3.43 0-1.2597-1.4917-1.8451-1.4917-3.138 0-1.292.9151-2.0075.9151-3.4352 0-1.1129-.5494-2.1136-1.352-2.7338l-.0509-.0385c-.0756-.056-.138.0116-.0844.078.5682.7095.8719 1.427.8719 2.4894 0 1.306-1.0512 2.3673-1.0512 3.6325 0 1.4934 1.4117 1.9203 1.4117 3.1456 0 1.2248-1.5137 2.2048-1.5137 3.5053 0 1.206 1.4325 2.5445 1.1868 3.9366a11.6645 11.6645 0 01-.8743.192c.2689-1.7334-1.1364-2.9782-1.1364-4.1122 0-1.2277 1.5677-2.322 1.5677-3.5217 0-1.1316-1.1252-1.5014-1.2732-2.659-.0204-.158-.1473-.2753-.3221-.2461-.2285.0416-.5214.192-.9816.192-.4602 0-.753-.1508-.982-.192-.1744-.0288-.3013.0884-.3217.246-.1476 1.1577-1.2736 1.527-1.2736 2.659 0 1.1997 1.5681 2.2937 1.5681 3.5218 0 1.134-1.4053 2.3788-1.1368 4.1123a12.1233 12.1233 0 01-.8743-.1921c-.2457-1.3921 1.1872-2.7306 1.1872-3.9366 0-1.3005-1.5141-2.2805-1.5141-3.5053 0-1.2253 1.412-1.6522 1.412-3.1456 0-1.2652-1.0515-2.326-1.0515-3.6325 0-1.062.3037-1.7795.8723-2.4893.0532-.0665-.0088-.134-.0848-.078l-.0504.0384c-.802.6186-1.351 1.6193-1.351 2.7322 0 1.4277.9152 2.1431.9152 3.4352 0 1.2925-1.4917 1.878-1.4917 3.138 0 1.2588 1.4673 2.2624 1.4673 3.43 0 1.0684-1.4033 2.4181-1.2445 3.727a11.8995 11.8995 0 01-.833-.3257c.0188-1.2957 1.2648-2.3861 1.2648-3.4777 0-1.2004-1.4137-2.1852-1.4137-3.3536 0-1.1685 1.519-1.8655 1.519-3.1192 0-1.2532-.7543-1.9639-.7543-3.244 0-1.1396.3997-1.8907 1.09-2.7186-.1537.0797-.281.1705-.4102.285-.7318.6446-1.2052 1.6537-1.2052 2.651 0 1.3612.6586 1.9722.6586 3.0342 0 1.0628-1.5485 1.9007-1.5485 3.1112 0 1.2096 1.342 2.2392 1.342 3.2636 0 .9183-1.1556 2.1423-1.1944 3.2604a11.8754 11.8754 0 01-.693-.383c.0872-1.0176 1.1776-1.8303 1.1776-2.8542 0-.3754-.1753-.687-.323-.9364.4486 1.4145-1.2156 2.25-1.3652 3.4693a12.1204 12.1204 0 01-.8796-.6446c.1305-.2257.331-.5034.5586-.6575a7.9134 7.9134 0 01-.3077-.391c-.2677.1633-.5066.4659-.6594.7043a12.2459 12.2459 0 01-.707-.6754c.21-.2633.4813-.6635.8779-.7715a9.0433 9.0433 0 01-.2613-.473c-.4606.1213-.7755.5574-1.0092.8167a12.141 12.141 0 01-.6038-.7462c.3493-.229.6382-.8027 1.2688-.8267.0529.1312.1085.2617.1669.3909.068.1493.1705.2073.3601.2073.5858 0 1.4934-.3798 2.1908-1.076-.4537-.826-.5914-1.2465-.5914-1.677 0-1.094 1.5526-2.0124 1.5526-3.074 0-1.0615-.535-1.6686-.535-2.8186 0-1.0364.4682-1.9311 1.078-2.6858a2.2175 2.2175 0 00-.4114.331c-.6638.6722-1.104 1.655-1.104 2.5613 0 1.2212.4586 1.7226.4586 2.6285 0 .834-1.7679 1.9936-1.5678 3.1324-.617.5618-1.3529.8127-1.9967.8127a9.305 9.305 0 00.1949.6994c-.7251.0385-1.0568.6567-1.4398.8612a12.0872 12.0872 0 01-.5302-.8768c.6455-.0672.84-.897 1.7419-.8339a9.1275 9.1275 0 01-.1185-.665c-1.038-.0696-1.2732.8059-1.9555.8431a12.04 12.04 0 01-.3965-.948l2.27-.8659-.0048-.2805c0-.1696.0052-.3377.0144-.5041-1.1688-.0273-1.5246.976-2.5345.8767a12.106 12.106 0 01-.241-.9708c1.2766.158 1.7395-.9151 2.888-.9143a8.7482 8.7482 0 01.2024-.9036c-1.392-.0604-1.8779 1.1505-3.2364.9252a11.7352 11.7352 0 01-.076-.8527c1.5794.1764 2.1716-1.122 3.6097-.9632a8.4303 8.4303 0 01.471-.9963c-1.803-.317-2.4153 1.1908-4.0935.9591C.1813 5.2805 5.4844.0898 12 .0898S23.8187 5.2805 24 11.753c-1.6786.2317-2.2908-1.2757-4.0935-.9591.1773.32.335.6526.471.9963 1.4373-.1592 2.0295 1.1396 3.6093.9632zm-17.147-5.035c-.884-.3613-1.954-.278-2.868.309-.1416-.8504-.603-1.6058-1.26-2.0616-.0908-.0628-.1853-.0032-.1769.102.1389 1.7967-.9115 3.3569-2.2032 4.7282 1.3313.4001 2.4645-1.3141 4.1912-.7159a9.0364 9.0364 0 012.3168-2.3617zM12 6.6314c-1.1144 0-2.048.6303-2.2924 1.4446-.0188.0624.0068.1028.0788.0704.2005-.09.4285-.1333.6762-.1333.4546 0 .8551.1669 1.092.4574.1049.3457.1137.8463-.0048 1.132-.1872-.042-.2545-.1868-.4373-.1868-.1829 0-.3245.1284-.6347.1284-.3097 0-.346-.1465-.5498-.1465-.2396 0-.2837.247-.2837.5254 0 1.2417 1.1413 2.9503 2.3553 2.9503 1.2136 0 2.3549-1.7086 2.3549-2.9503 0-.2785-.0573-.517-.3077-.5494-.1249.09-.2397.1705-.5254.1705-.3102 0-.3958-.1284-.5783-.1284-.2204 0-.1984.465-.4601.491-.1745-.4194-.1829-.9572-.038-1.4362.2373-.2905.6374-.4574 1.092-.4574.2477 0 .4773.0437.6758.1333.0724.0324.0976-.0084.0788-.0704-.244-.8143-1.1772-1.4446-2.2916-1.4446zm1.7743 1.7815c-.2673 0-.5807.082-.7775.3013-.0204.0596-.0204.1484.0084.2077.4845-.166.9119-.1725 1.1184.0584.11-.1.1452-.19.1452-.2945 0-.1613-.164-.273-.4945-.273zm-3.8979.5674c.2337-.234.7263-.224 1.238-.0352.0225-.2545-.4333-.5326-.8887-.5326-.3309 0-.4945.1116-.4945.2733 0 .1044.0352.1949.1452.2945zm7.6804-4.2031c-.8799.0628-1.6442.3649-2.2624.8683.2625-.7443.5958-1.3953 1.0184-2.0264-1.1204.1189-2.0572.5286-2.7406 1.2289l-.535-1.4025 1.1876-1.0488-1.5902-.1125L12 .8053l-.635 1.479-1.5902.1124 1.1876 1.0488-.5346 1.4025c-.6838-.7003-1.6206-1.11-2.7402-1.2289.4218.6315.7551 1.2825 1.0176 2.0264-.6178-.5038-1.3821-.806-2.262-.8683.5278.6786.9955 1.402 1.342 2.18.0393.0876.1233.1164.2141.0712 1.2053-.599 2.5634-.936 4.0003-.936 1.437 0 2.7946.3374 4.0007.936.0908.0452.1748.0164.2136-.0712.347-.778.8147-1.5014 1.343-2.18zm1.9211 5.3035c1.7259-.5982 2.8595 1.1156 4.1908.7159-1.2917-1.3713-2.3417-2.9315-2.2028-4.7282.0084-.1052-.0865-.1652-.1769-.102-.6574.4558-1.1188 1.2112-1.26 2.0615-.9144-.587-1.984-.6706-2.868-.3089a9.0431 9.0431 0 012.317 2.3617z" />
    </svg>
  );
}

function useVideoPanel(elementId: string, videoId: string) {
  const [playing, setPlaying] = useState(false);
  // Starts true so the shield stays up over YouTube's own paused/cued chrome
  // until playback genuinely begins.
  const [paused, setPaused] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(100);
  const [muted, setMuted] = useState(true);
  const [quality, setQuality] = useState("auto");
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);
  const playerRef = useRef<any>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const userPickedQuality = useRef(false);

  function start() {
    setPlaying(true);
    setPaused(true);
    userPickedQuality.current = false;
    loadYouTubeApi().then(() => {
      playerRef.current = new window.YT.Player(elementId, {
        width: "1920",
        height: "1080",
        videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            setAvailableQualities(e.target.getAvailableQualityLevels?.() ?? []);
            setHighestQuality(e.target);
            e.target.playVideo();
            setDuration(e.target.getDuration());
            setVolume(e.target.getVolume());
            setMuted(true);
            if (intervalRef.current) clearInterval(intervalRef.current);
            intervalRef.current = setInterval(() => {
              if (playerRef.current) {
                setCurrentTime(playerRef.current.getCurrentTime());
                setDuration(playerRef.current.getDuration());
              }
            }, 250);
          },
          onStateChange: (e: any) => {
            setPaused(e.data !== window.YT.PlayerState.PLAYING);
            if (e.data === window.YT.PlayerState.PLAYING && !userPickedQuality.current) {
              setHighestQuality(e.target);
            }
          },
          onPlaybackQualityChange: (e: any) => {
            setQuality(e.data);
          },
        },
      });
    });
  }

  function stop() {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    playerRef.current?.destroy?.();
    playerRef.current = null;
    setPlaying(false);
    setPaused(true);
    setCurrentTime(0);
    setDuration(0);
    setQuality("auto");
    setAvailableQualities([]);
    userPickedQuality.current = false;
  }

  function changeQuality(e: ChangeEvent<HTMLSelectElement>) {
    const level = e.target.value;
    userPickedQuality.current = level !== "default";
    playerRef.current?.setPlaybackQuality(level);
    setQuality(level === "default" ? "auto" : level);
  }

  function togglePlayPause() {
    if (!playerRef.current) return;
    if (paused) {
      playerRef.current.playVideo();
    } else {
      playerRef.current.pauseVideo();
    }
  }

  function seek(e: ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    setCurrentTime(value);
    playerRef.current?.seekTo(value, true);
  }

  function toggleMute() {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  }

  function handleVolume(e: ChangeEvent<HTMLInputElement>) {
    const value = Number(e.target.value);
    setVolume(value);
    playerRef.current?.setVolume(value);
    if (value === 0) {
      setMuted(true);
      playerRef.current?.mute();
    } else {
      setMuted(false);
      playerRef.current?.unMute();
    }
  }

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      playerRef.current?.destroy?.();
    };
  }, []);

  return {
    elementId,
    playing,
    paused,
    currentTime,
    duration,
    volume,
    muted,
    quality,
    availableQualities,
    start,
    stop,
    togglePlayPause,
    seek,
    toggleMute,
    handleVolume,
    changeQuality,
  };
}

type VideoPanel = ReturnType<typeof useVideoPanel>;

function VideoStage({ panel }: { panel: VideoPanel }) {
  return (
    <>
      <div id={panel.elementId} />
      <div className={`video-shield${panel.paused ? "" : " is-hidden"}`} aria-hidden="true" />
    </>
  );
}

function VideoControls({ panel }: { panel: VideoPanel }) {
  return (
    <div className="video-controls">
      <button
        type="button"
        className="video-control-btn"
        onClick={panel.togglePlayPause}
        aria-label={panel.paused ? "Play video" : "Pause video"}
      >
        {panel.paused ? (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        )}
      </button>
      <button
        type="button"
        className="video-control-btn"
        onClick={panel.stop}
        aria-label="Stop video"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <rect x="6" y="6" width="12" height="12" rx="1.5" />
        </svg>
      </button>
      <span className="video-time">{formatVideoTime(panel.currentTime)}</span>
      <input
        type="range"
        className="video-seek"
        min={0}
        max={panel.duration || 0}
        step={0.1}
        value={panel.currentTime}
        onChange={panel.seek}
        aria-label="Seek video"
      />
      <span className="video-time">{formatVideoTime(panel.duration)}</span>
      <button
        type="button"
        className="video-control-btn"
        onClick={panel.toggleMute}
        aria-label={panel.muted ? "Unmute video" : "Mute video"}
      >
        {panel.muted ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
            <path d="M16 9l6 6M22 9l-6 6" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 5 6 9H3v6h3l5 4z" fill="currentColor" stroke="none" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 6a9 9 0 0 1 0 12" />
          </svg>
        )}
      </button>
      <input
        type="range"
        className="video-volume"
        min={0}
        max={100}
        value={panel.muted ? 0 : panel.volume}
        onChange={panel.handleVolume}
        aria-label="Volume"
      />
      {panel.availableQualities.length > 0 && (
        <select
          className="video-quality-select"
          value={panel.quality}
          onChange={panel.changeQuality}
          aria-label="Video quality"
        >
          <option value="default">Auto</option>
          {panel.availableQualities.map((level) => (
            <option key={level} value={level}>
              {qualityLabel(level)}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

const partners = [
  { name: "Starbucks", logo: "starbucks" },
  { name: "Mixue", icon: "cup" },
  { name: "Le Petit Four Pâtisserie", icon: "cake" },
  { name: "Family Mart", icon: "store" },
  { name: "Hero Tea", icon: "cup" },
  { name: "Rendez by Meowcho", icon: "cup" },
  { name: "Upside Down Museum Penang", icon: "landmark" },
  { name: "BMS Organics", icon: "leaf" },
  { name: "Glass Museum Penang", icon: "landmark" },
  { name: "Tokio Marine", icon: "shield" },
];

const reviews = [
  {
    name: "Wei",
    mask: "*******",
    date: "2026-06-21 14:32:08",
    body: "The lion head was so much heavier than I expected! Our instructor was patient and let us try the drums too. Best cultural activity we did in KL, hands down.",
    img: "/lion-dance.webp",
    activity: "Chinese Lion Dance Experience in Kuala Lumpur",
  },
  {
    name: "Aisyah",
    mask: "****",
    date: "2026-06-09 09:47:52",
    body: "Loved the batik workshop! The artisan showed us the wax and dye technique step by step, and I got to take my canvas home. Great for a rainy afternoon.",
    img: "/batik.jpg",
    activity: "Batik Painting Workshop in Penang",
  },
  {
    name: "Rajan",
    mask: "**********",
    date: "2026-05-27 17:03:41",
    body: "Learning to draw kolam with rice flour was so calming, and the food tasting after was incredible. Our host made sure everyone in the group felt included.",
    img: "/kolam.png",
    activity: "Indian Heritage & Kolam Experience in Kuala Lumpur",
  },
];

const whyHighlights = [
  {
    img: "/privileges.png",
    icon: "coins",
    headline: "Save More",
    tag: "MYR 18,000+",
    title: "Worth of Travel Privileges",
    body:
      "Unlock exclusive savings on dining, shopping, attractions and experiences at over 1,000 partner locations across Malaysia.",
  },
  {
    img: "/local.png",
    icon: "handshake",
    headline: "Experience Malaysia",
    tag: "40+",
    title: "Trusted Local Partners",
    body:
      "Discover authentic cultural experiences and hidden local gems through carefully selected partners across Malaysia.",
  },
  {
    img: "/tokio.png",
    icon: "shield",
    headline: "Travel Worry-Free",
    tag: "Tokio Marine",
    title: "Travel Insurance Included",
    body:
      "Enjoy your trip with comprehensive travel protection included from arrival to departure.",
  },
];

const tierShowcase = [
  {
    key: "silver",
    name: "Silver",
    price: "39.90",
    originalPrice: "79.90",
    tagline: "Great value.",
    sub: "More to explore.",
  },
  {
    key: "gold",
    name: "Gold",
    price: "69.90",
    originalPrice: "139.90",
    badge: "Most Popular",
    tagline: "Most popular.",
    sub: "More to enjoy.",
  },
  {
    key: "platinum",
    name: "Platinum",
    price: "89.90",
    originalPrice: "179.90",
    tagline: "Ultimate experience.",
    sub: "More to indulge.",
  },
];

const tierFeatures = [
  { label: "Retail deals", silver: true, gold: true, platinum: true },
  { label: "Food & beverage deals", silver: true, gold: true, platinum: true },
  { label: "Travel insurance", silver: false, gold: true, platinum: true },
  { label: "Lion Dance Experience", silver: false, gold: true, platinum: true },
  { label: "Batik Painting Experience", silver: false, gold: true, platinum: true },
  { label: "Indian Culture Experience", silver: false, gold: true, platinum: true },
  { label: "1.5-hour photo session", silver: false, gold: false, platinum: true },
  { label: "Priority support", silver: false, gold: false, platinum: true },
];

const faqItems = [
  {
    question: "Is the pass refundable?",
    answer:
      "Unused passes can be refunded up to 7 days before your first booked session. Full terms will be confirmed before launch.",
  },
  {
    question: "How long is my pass valid?",
    answer:
      "Your pass is valid for 30 days from activation, giving you a full trip window to redeem every perk.",
  },
  {
    question: "What if a partner isn't available?",
    answer:
      "If a partner venue is temporarily unavailable, our support team will help you rebook or swap to an equivalent partner.",
  },
];

export default function Home() {
  const [selectedTier, setSelectedTier] = useState<string | null>("Gold");
  const tasteVideoId = "Jg0PRB5Aebo";
  // TODO: swap these placeholder video IDs for the real Batik / Indian Heritage footage.
  const lion = useVideoPanel("lion-player", "qLRp1pvOLr4");
  const batik = useVideoPanel("batik-player", "qLRp1pvOLr4");
  const indian = useVideoPanel("indian-player", "qLRp1pvOLr4");
  const taste = useVideoPanel("taste-player", tasteVideoId);
  const lionCopyRef = useRef<HTMLDivElement>(null);
  const batikCopyRef = useRef<HTMLDivElement>(null);
  const indianCopyRef = useRef<HTMLDivElement>(null);
  const tasteCopyRef = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<string | null>(faqItems[0].question);
  const loaderRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const heroBgRef = useRef<HTMLDivElement>(null);
  const tierCardRef = useRef<HTMLDivElement>(null);
  const filmModalRef = useRef<HTMLDialogElement>(null);
  const filmPlayerRef = useRef<any>(null);
  const filmSrc = "https://www.youtube.com/embed/8V7czbc0kxg";
  const destinationVideos: Record<string, string> = {
    "Kuala Lumpur": "https://www.youtube.com/embed/cvT7CyFJ76I",
    Langkawi: "https://www.youtube.com/embed/l1YiY-OaS9I",
    Penang: "https://www.youtube.com/embed/4GUPqwMWDUY",
    "Cameron Highlands": "https://www.youtube.com/embed/bjFpApWzs4k",
  };

  function playFilm(src: string) {
    filmModalRef.current?.showModal();
    loadYouTubeApi().then(() => {
      filmPlayerRef.current?.destroy?.();
      filmPlayerRef.current = new window.YT.Player("film-player", {
        width: "1920",
        height: "1080",
        videoId: extractYouTubeId(src),
        playerVars: {
          autoplay: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (e: any) => {
            setHighestQuality(e.target);
            e.target.playVideo();
          },
          onStateChange: (e: any) => {
            if (e.data === window.YT.PlayerState.PLAYING) {
              setHighestQuality(e.target);
            }
          },
        },
      });
    });
  }

  useEffect(() => {
    lionCopyRef.current?.classList.toggle("is-hidden", lion.playing);
  }, [lion.playing]);

  useEffect(() => {
    batikCopyRef.current?.classList.toggle("is-hidden", batik.playing);
  }, [batik.playing]);

  useEffect(() => {
    indianCopyRef.current?.classList.toggle("is-hidden", indian.playing);
  }, [indian.playing]);

  useEffect(() => {
    tasteCopyRef.current?.classList.toggle("is-hidden", taste.playing);
  }, [taste.playing]);

  useEffect(() => {
    const onLoad = () =>
      setTimeout(() => loaderRef.current?.classList.add("hidden"), 450);
    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    function onScroll() {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (progressRef.current) {
        progressRef.current.style.width = `${Math.min(100, (y / max) * 100)}%`;
      }
      if (heroBgRef.current && y < window.innerHeight * 1.2) {
        heroBgRef.current.style.transform = `translate3d(0, ${y * 0.12}px, 0) scale(1.04)`;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.14 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

    function attachTilt(card: HTMLDivElement | null) {
      if (!card) return () => {};
      const onMove = (e: PointerEvent) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 12}deg) translateZ(8px)`;
      };
      const onLeave = () => {
        card.style.transform = "rotateY(0) rotateX(0)";
      };
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
      return () => {
        card.removeEventListener("pointermove", onMove);
        card.removeEventListener("pointerleave", onLeave);
      };
    }
    const detachTierCard = attachTilt(tierCardRef.current);

    const filmModal = filmModalRef.current;
    const onFilmBackdropClick = (e: MouseEvent) => {
      if (e.target === filmModal) filmModal?.close();
    };
    const onFilmClose = () => {
      filmPlayerRef.current?.destroy?.();
      filmPlayerRef.current = null;
    };
    filmModal?.addEventListener("click", onFilmBackdropClick);
    filmModal?.addEventListener("close", onFilmClose);

    return () => {
      window.removeEventListener("load", onLoad);
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
      detachTierCard();
      filmModal?.removeEventListener("click", onFilmBackdropClick);
      filmModal?.removeEventListener("close", onFilmClose);
    };
  }, []);

  return (
    <>
      <div className="progress" aria-hidden="true">
        <span ref={progressRef}></span>
      </div>

      <div className="loader" id="loader" ref={loaderRef}>
        <div className="loader-plane">✈</div>
        <p>Your Malaysian story begins…</p>
      </div>

      <Navbar />

      <main id="top">
        <section className="hero section-dark" data-nav="dark">
          <div className="hero-bg" ref={heroBgRef} aria-hidden="true"></div>
          <div className="hero-overlay" aria-hidden="true"></div>
          <div className="hero-cloud cloud-a" aria-hidden="true"></div>
          <div className="hero-cloud cloud-b" aria-hidden="true"></div>
          <div className="flight-path" aria-hidden="true">
            <span className="plane">✈</span>
          </div>

          <div className="hero-content reveal">
            <p className="eyebrow light">The Premier Tourist Pass for Malaysia</p>
            <h1>
              Experience Malaysia,
              <br />
              <em>with Traveloop.</em>
            </h1>
            <p className="hero-copy">
              Discover authentic culture, exclusive local deals, immersive
              experiences, and seamless travel. All with one Traveloop Pass.
            </p>
            <div className="hero-actions">
              <a className="button primary" href="#discover">
                Begin your journey
              </a>
              <button className="button ghost" onClick={() => playFilm(filmSrc)}>
                Watch the story <span>▶</span>
              </button>
            </div>
          </div>

          <a href="#discover" className="scroll-cue" aria-label="Scroll to discover">
            <span>Scroll to travel</span>
            <i></i>
          </a>
        </section>

        <section className="arrival section-light" id="discover" data-nav="light">
          <div className="section-heading centered reveal">
            <h2>Discover the many faces of Malaysia.</h2>
            <p>
              From iconic landmarks and vibrant cities to authentic cultural
              experiences and local flavours, discover the stories,
              traditions, and moments that make Malaysia truly unforgettable.
            </p>
            <p className="discover-hint">
              <span>▶</span> Tap a card to watch it come to life
            </p>
          </div>

          <div className="discover-grid">
            <button
              type="button"
              className="discover-tile tile-city reveal"
              onClick={() => playFilm(destinationVideos["Kuala Lumpur"])}
              aria-label="Watch a video of Kuala Lumpur"
            >
              <span className="discover-play">▶</span>
              <span className="discover-tag">City Lights</span>
              <span className="discover-place">Kuala Lumpur</span>
            </button>
            <button
              type="button"
              className="discover-tile tile-island reveal delay-1"
              onClick={() => playFilm(destinationVideos.Langkawi)}
              aria-label="Watch a video of Langkawi"
            >
              <span className="discover-play">▶</span>
              <span className="discover-tag">Island Shores</span>
              <span className="discover-place">Langkawi</span>
            </button>
            <button
              type="button"
              className="discover-tile tile-heritage reveal delay-2"
              onClick={() => playFilm(destinationVideos.Penang)}
              aria-label="Watch a video of Penang"
            >
              <span className="discover-play">▶</span>
              <span className="discover-tag">Heritage Streets</span>
              <span className="discover-place">Penang</span>
            </button>
            <button
              type="button"
              className="discover-tile tile-hilltop reveal delay-3"
              onClick={() => playFilm(destinationVideos["Cameron Highlands"])}
              aria-label="Watch a video of Cameron Highlands"
            >
              <span className="discover-play">▶</span>
              <span className="discover-tag">Hilltop Escapes</span>
              <span className="discover-place">Cameron Highlands</span>
            </button>
          </div>

        </section>

        <section className="experience-intro section-blue" id="experiences" data-nav="dark">
          <div className="section-heading split reveal">
            <div>
              <p className="eyebrow">The heart of the journey</p>
              <h2>
                Experience Malaysia
                <br />
                <em>through its culture</em>
              </h2>
            </div>
            <p>
              Every experience is thoughtfully curated to connect you with the
              people, traditions, and culture that define the true spirit of
              Malaysia.
            </p>
          </div>
        </section>

        <section className="experience-panel lion section-dark" data-nav="dark">
          <div className="experience-bg" aria-hidden="true"></div>
          {lion.playing && (
            <div className="experience-video" aria-hidden="true">
              <VideoStage panel={lion} />
            </div>
          )}
          <div className="experience-shade" aria-hidden="true"></div>
          <div className="experience-copy reveal" ref={lionCopyRef}>
            <p className="experience-number">01 / 03</p>
            <h2>
              Feel the rhythm
              <br />
              of <em>lion dance.</em>
            </h2>
            <p>
              Step into the world of Chinese Lion Dance with a hands-on
              experience where you&apos;ll learn traditional movements, play
              authentic instruments, perform with a lion head, and discover
              the rich cultural heritage behind this iconic art.
            </p>
            <button
              type="button"
              className="play-video-btn"
              onClick={lion.start}
              aria-label="Play lion dance video"
            >
              <span className="play-video-icon">▶</span>
              Play Video
            </button>
          </div>
          {lion.playing && <VideoControls panel={lion} />}
        </section>

        <section className="experience-panel batik section-dark" data-nav="dark">
          <div className="experience-bg" aria-hidden="true"></div>
          {batik.playing && (
            <div className="experience-video" aria-hidden="true">
              <VideoStage panel={batik} />
            </div>
          )}
          <div className="experience-shade" aria-hidden="true"></div>
          <div className="experience-copy reveal" ref={batikCopyRef}>
            <p className="experience-number">02 / 03</p>
            <h2>
              Batik Painting
              <br />
              <em>Experience.</em>
            </h2>
            <p>
              Immerse yourself in the rich heritage of Malaysian Batik through
              a hands-on painting workshop led by experienced local artisans.
              Discover the beauty of this traditional art form as you create
              your own Batik masterpiece and take home a unique handmade
              souvenir to remember your Malaysian journey.
            </p>
            <button
              type="button"
              className="play-video-btn"
              onClick={batik.start}
              aria-label="Play batik painting video"
            >
              <span className="play-video-icon">▶</span>
              Play Video
            </button>
          </div>
          {batik.playing && <VideoControls panel={batik} />}
          <div className="batik-orbit" aria-hidden="true"></div>
        </section>

        <section className="experience-panel indian section-dark" data-nav="dark">
          <div className="experience-bg" aria-hidden="true"></div>
          {indian.playing && (
            <div className="experience-video" aria-hidden="true">
              <VideoStage panel={indian} />
            </div>
          )}
          <div className="experience-shade" aria-hidden="true"></div>
          <div className="experience-copy reveal" ref={indianCopyRef}>
            <p className="experience-number">03 / 03</p>
            <h2>
              Experience Malaysia&apos;s
              <br />
              <em>Indian Heritage.</em>
            </h2>
            <p>
              Step into a vibrant celebration of tradition through the
              intricate art of Kolam, authentic Indian cuisine, and warm local
              hospitality. Create, taste, and connect with one of
              Malaysia&apos;s richest cultural communities.
            </p>
            <button
              type="button"
              className="play-video-btn"
              onClick={indian.start}
              aria-label="Play Indian heritage video"
            >
              <span className="play-video-icon">▶</span>
              Play Video
            </button>
          </div>
          {indian.playing && <VideoControls panel={indian} />}
        </section>

        <section className={`taste section-light${taste.playing ? " is-playing" : ""}`} id="taste" data-nav="light">
          {taste.playing && (
            <div className="taste-bg-video" aria-hidden="true">
              <VideoStage panel={taste} />
              <div className="taste-video-mask top" />
              <div className="taste-video-mask bottom" />
            </div>
          )}
          <div className="section-heading centered reveal" ref={tasteCopyRef}>
            <p className="eyebrow">The Taste of Malaysia</p>
            <h2>
              Discover Malaysia
              <br />
              <em>Through Its Flavours.</em>
            </h2>
            <p>
              Taste your way through Malaysia with handpicked local
              favourites, hidden cafés, and iconic eateries. All with
              exclusive Traveloop dining privileges.
            </p>
            <button
              type="button"
              className="play-video-btn on-light"
              onClick={taste.start}
              aria-label="Play a taste of Malaysia video"
            >
              <span className="play-video-icon">▶</span>
              Play Video
            </button>
          </div>
          {taste.playing && <VideoControls panel={taste} />}
        </section>

        <section className="why section-light" id="why" data-nav="light">
          <div className="why-hero reveal">
            <div className="why-hero-copy">
              <p className="eyebrow">Why Choose Traveloop</p>
              <h2>
                Experience More.
                <br />
                <em>Plan Less.</em>
              </h2>
              <p>
                Handpicked cultural experiences, exclusive dining and shopping
                privileges, trusted local partners, complimentary travel
                protection, and unforgettable moments—
                <span className="gradient-highlight">
                  all included in one simple pass
                </span>
                .
              </p>
              <a className="button primary taste-cta" href="/partners">
                View Exclusive Deals
              </a>
            </div>
          </div>

          <div className="why-cards reveal">
            {whyHighlights.map((h, i) => (
              <article className={`why-card delay-${i + 1}`} key={h.title}>
                <div
                  className="why-card-bg"
                  style={{ backgroundImage: `url('${h.img}')` }}
                />
                <div className="why-card-overlay" />
                <div className="why-card-content">
                  <span className="why-card-icon">
                    <Icon name={h.icon} />
                  </span>
                  <span className="why-card-headline">{h.headline}</span>
                  <div className="why-card-stat-group">
                    <strong className="why-card-stat">{h.tag}</strong>
                    <span className="why-card-title">{h.title}</span>
                  </div>
                  <p>{h.body}</p>
                </div>
              </article>
            ))}
          </div>

          <div className="reviews reveal">
            <h3 className="reviews-label">Stories from Fellow Travellers</h3>
            <div className="reviews-grid">
              {reviews.map((r) => (
                <article className="review-card" key={r.name}>
                  <div className="review-head">
                    <div>
                      <strong className="review-name">
                        {r.name} <span className="review-mask">{r.mask}</span>
                      </strong>
                      <span className="review-date">{r.date}</span>
                    </div>
                    <span className="review-rating">
                      Fantastic <span className="review-rating-badge">5.0</span>
                    </span>
                  </div>
                  <p className="review-body">{r.body}</p>
                  <a className="review-activity" href="#experiences">
                    <span
                      className="review-activity-img"
                      style={{ backgroundImage: `url('${r.img}')` }}
                    />
                    {r.activity}
                  </a>
                </article>
              ))}
            </div>
          </div>

          <div className="partners reveal">
            <h3 className="partners-label">Our Trusted Partners</h3>
            <div className="partners-marquee">
              <div className="partners-track">
                {[...partners, ...partners].map((p, i) => (
                  <span className="partner-chip" key={`${p.name}-${i}`}>
                    <span className="partner-chip-icon">
                      {p.logo === "starbucks" ? (
                        <StarbucksLogo />
                      ) : (
                        <Icon name={p.icon!} />
                      )}
                    </span>
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="what section-cream" id="what" data-nav="light">
          <div className="section-heading centered reveal">
            <p className="eyebrow">Experience Malaysia with Traveloop</p>
            <h2>
              One pass.
              <br />
              <em>Everything included.</em>
            </h2>
            <p>
              Everything has been carefully curated, from authentic cultural
              experiences to exclusive local deals,{" "}
              <span className="gradient-highlight">
                so all you have to do is enjoy
              </span>
              .
            </p>
          </div>

          {(() => {
            const activeTierInfo =
              tierShowcase.find((t) => t.name === selectedTier) ?? tierShowcase[1];
            const tierKey = activeTierInfo.key as "silver" | "gold" | "platinum";
            return (
              <>
                <div className="tier-toggle reveal">
                  {tierShowcase.map((t) => (
                    <button
                      type="button"
                      key={t.key}
                      className={`tier-toggle-btn${
                        selectedTier === t.name ? " active" : ""
                      }`}
                      onClick={() => setSelectedTier(t.name)}
                    >
                      {t.name}
                      {t.badge && <span className="tier-toggle-badge">{t.badge}</span>}
                    </button>
                  ))}
                </div>

                <div className="tier-preview reveal">
                  <div className="tier-preview-card">
                    <div className={`pass-card tier-${tierKey}`} ref={tierCardRef}>
                      <div className="card-shine"></div>
                      <div className="card-top">
                        <img src="/traveloop-logo.webp" alt="Traveloop" />
                        <span>{activeTierInfo.name.toUpperCase()}</span>
                      </div>
                      <div className="card-chip"></div>
                      <div className="card-bottom">
                        <strong>EXPERIENCE MALAYSIA</strong>
                        <span>TOURIST PASS · 2026</span>
                      </div>
                    </div>
                    <p className="pass-caption">
                      <span>Move your cursor</span> to explore the card
                    </p>
                  </div>

                  <div className="tier-perks">
                    <div className="tier-perks-head">
                      <strong>{activeTierInfo.name} Pass</strong>
                      <div className="tier-price">
                        <s className="tier-price-original">
                          <small>MYR</small>
                          {activeTierInfo.originalPrice}
                        </s>
                        <strong className="tier-price-current">
                          <small>MYR</small>
                          {activeTierInfo.price}
                        </strong>
                      </div>
                    </div>
                    <span className="tier-discount-badge">
                      Exclusive 50% launch discount applied!
                    </span>
                    <ul className="tier-perks-list">
                      {tierFeatures.map((f) => (
                        <li
                          key={f.label}
                          className={f[tierKey] ? "included" : "excluded"}
                        >
                          <span className="tier-perk-icon">
                            {f[tierKey] ? "✓" : "—"}
                          </span>
                          {f.label}
                        </li>
                      ))}
                    </ul>
                    <p className="tier-preview-tag">{activeTierInfo.tagline}</p>
                    <a
                      className="button primary tier-purchase-cta"
                      href="#what"
                      onClick={() => setSelectedTier(activeTierInfo.name)}
                    >
                      Purchase {activeTierInfo.name} Now
                    </a>
                  </div>
                </div>
              </>
            );
          })()}
        </section>

        <section className="faq-section section-red" id="faq" data-nav="dark">
          <div className="faq-facets" aria-hidden="true">
            <span className="facet facet-a"></span>
            <span className="facet facet-b"></span>
            <span className="facet facet-c"></span>
          </div>
          <div className="faq-header reveal">
            <h2>
              Frequently Asked <span className="accent">Questions</span>
            </h2>
            <p>
              Everything you need to know before you start exploring Malaysia
              with your Traveloop Pass.
            </p>
          </div>

          <div className="accordion faq-accordion reveal">
            {faqItems.map((item) => {
              const isOpen = openFaq === item.question;
              return (
                <div
                  className={`accordion-row${isOpen ? " open" : ""}`}
                  key={item.question}
                >
                  <button
                    type="button"
                    className="accordion-head"
                    aria-expanded={isOpen}
                    onClick={() => setOpenFaq(isOpen ? null : item.question)}
                  >
                    <span className="accordion-title">{item.question}</span>
                    <span className="accordion-chevron">⌄</span>
                  </button>
                  {isOpen && <p className="accordion-body">{item.answer}</p>}
                </div>
              );
            })}
          </div>

          <p className="faq-quiz-link">
            Still have questions?{" "}
            <Link className="text-link-button" href="/contact">
              Contact Us →
            </Link>
          </p>
        </section>

        <section className="closing section-dark" data-nav="dark">
          <div className="closing-bg" aria-hidden="true"></div>
          <div className="closing-overlay" aria-hidden="true"></div>
          <div className="closing-content reveal">
            <h2>Your Journey Starts Here.</h2>
            <p className="closing-copy">
              Come for Malaysia. Leave with unforgettable stories, authentic
              experiences, exclusive privileges, and memories that last long
              after your trip ends.
            </p>
            <a className="button primary" href="#what">
              Choose your Traveloop Pass
            </a>
          </div>
        </section>
      </main>

      <footer>
        <img src="/traveloop-logo.webp" alt="Traveloop" />
        <p>Experience Malaysia like never before.</p>
        <div className="footer-links">
          <span className="footer-link-placeholder" title="Coming soon">
            Instagram
          </span>
          <span className="footer-link-placeholder" title="Coming soon">
            TikTok
          </span>
          <span className="footer-link-placeholder" title="Coming soon">
            Contact
          </span>
        </div>
        <small>
          Concept prototype · Images are placeholders for design exploration
          only.
        </small>
      </footer>

      <dialog className="modal" ref={filmModalRef}>
        <div className="film-video">
          <div id="film-player" />
        </div>
      </dialog>
    </>
  );
}
