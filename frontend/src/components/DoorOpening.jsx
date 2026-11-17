import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./DoorOpening.css";

const THEME_PALETTES = {
  bohraNikah: ["#c9a063", "#e6cb97", "#6b4036", "#8a5a50", "90,50,30", "#efdcc3", "#c9a05a", "#b58a45"],
  purpleWhite: ["#8d69bb", "#d8c5ed", "#49345f", "#68428f", "73,52,95", "#f4edff", "#a98bc9", "#70518f"],
  midnightNavy: ["#7896c8", "#c5d5f2", "#182c4c", "#263f67", "15,30,55", "#dce7f8", "#526f9e", "#253e68"],
  sageBotanical: ["#78966f", "#d2dfc5", "#344b35", "#536d50", "38,58,39", "#e9f0e4", "#9eaf8e", "#526b4e"],
  champagnePearl: ["#c5a66f", "#f0dfb8", "#71583d", "#927653", "80,60,35", "#f5ead7", "#d8c29b", "#b69a6b"],
  rubyVelvet: ["#a84d61", "#e7b6bf", "#4c1e2b", "#793747", "55,15,25", "#f4e1e5", "#b85c70", "#702b3e"],
  oceanTeal: ["#4b9b9a", "#b8e1dc", "#164b50", "#286d70", "15,55,58", "#dff2ef", "#69aaa6", "#24676b"],
  celestialBlack: ["#b7a0d6", "#e4d9f2", "#282235", "#514465", "25,20,35", "#e9e4f1", "#8b79a7", "#393047"],
  blushTerracotta: ["#c77e69", "#f0c6b6", "#673c35", "#945c4e", "75,35,28", "#f7e5dc", "#d89b85", "#a65f4d"],
  desertSand: ["#b99869", "#ead8b7", "#604b32", "#8a704d", "70,50,30", "#f1e6d2", "#c9ad80", "#a8895e"],
  sapphireSilver: ["#8aa8c9", "#dce7f3", "#293b55", "#526c8c", "35,50,70", "#e8eff7", "#aebfd2", "#637e9e"],
  burgundyLuxe: ["#a65b70", "#e5b9c5", "#4b1d2d", "#79364a", "55,18,30", "#f2e1e6", "#b9788b", "#6e2c40"],
  jadeMarble: ["#4c927a", "#b8ddce", "#204b3e", "#39715e", "25,60,48", "#e0eee7", "#75aa94", "#2e6655"],
  sunsetCopper: ["#bd7950", "#efc5a4", "#603a2d", "#89563d", "70,38,24", "#f4e2d3", "#d69a70", "#9b5c3d"],
  whiteRoseGold: ["#c58d80", "#f0d2c7", "#68433d", "#9b655a", "75,43,38", "#f5e5df", "#d9a99c", "#a96e62"],
};

function DoorOpening({ invitation, onOpenMusic, onHandoffStart, onOpened }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isHandoff, setIsHandoff] = useState(false);
  const [isFast, setIsFast] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const startedRef = useRef(false);
  const timersRef = useRef([]);
  const palette = THEME_PALETTES[invitation?.theme] || THEME_PALETTES.bohraNikah;

  const bride = invitation?.couple?.partner1?.name || invitation?.couple?.brideName || "Bride";
  const groom = invitation?.couple?.partner2?.name || invitation?.couple?.groomName || "Groom";
  const primaryNames = invitation?.couple?.nameOrder === "brideFirst" ? [bride, groom] : [groom, bride];
  const monogram = (primaryNames[0].charAt(0) || "G").toUpperCase() + "&" +
    (primaryNames[1].charAt(0) || "B").toUpperCase();

  const stageStyle = useMemo(() => ({
    "--door-gold": palette[0],
    "--door-gold-light": palette[1],
    "--door-brown": palette[2],
    "--door-ink": palette[3],
    "--door-shadow": palette[4],
    "--door-hall": palette[5],
    "--door-mid": palette[6],
    "--door-deep": palette[7],
  }), [palette]);

  const schedule = useCallback((callback, delay) => {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
    return timer;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(window.clearTimeout);
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const burstDust = useCallback(() => {
    const crest = document.querySelector(".door-opening-crest");
    if (!crest) return;
    const rect = crest.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    for (let index = 0; index < 50; index += 1) {
      const particle = document.createElement("i");
      particle.className = "door-opening-dust";
      const size = 2 + Math.random() * 4;
      particle.style.cssText = `left:${x}px;top:${y}px;width:${size}px;height:${size}px;background:${palette[0]}`;
      document.body.appendChild(particle);
      const angle = Math.random() * 6.283;
      const distance = 50 + Math.random() * 150;
      particle.animate(
        [
          { transform: "translate(0,0)", opacity: 1 },
          { transform: `translate(${Math.cos(angle) * distance}px,${Math.sin(angle) * distance + 30}px)`, opacity: 0 },
        ],
        { duration: 900 + Math.random() * 900, easing: "cubic-bezier(.1,.7,.3,1)" }
      ).onfinish = () => particle.remove();
    }
  }, [palette]);

  const finish = useCallback(() => {
    onOpened?.();
  }, [onOpened]);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    onOpenMusic?.();
    setIsOpen(true);
    setShowSkip(true);
    burstDust();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsFast(true);
      setIsHandoff(true);
      onHandoffStart?.();
      schedule(finish, 250);
      return;
    }

    schedule(() => {
      setIsHandoff(true);
      onHandoffStart?.();
    }, 2700);
    schedule(finish, 3900);
  }, [burstDust, finish, onHandoffStart, onOpenMusic, schedule]);

  const skip = useCallback(() => {
    if (!startedRef.current) return;
    clearTimers();
    setIsFast(true);
    setIsOpen(true);
    setIsHandoff(true);
    onHandoffStart?.();
    schedule(finish, 250);
  }, [clearTimers, finish, onHandoffStart, schedule]);

  return (
    <div
      className={`door-opening-stage${isOpen ? " door-opening-is-open" : ""}${isFast ? " door-opening-fast" : ""}${isHandoff ? " door-opening-handoff" : ""}`}
      style={stageStyle}
      aria-label={`Royal door opening for ${primaryNames[0]} and ${primaryNames[1]}`}
    >
      <div className="door-opening-hall" aria-hidden="true">
        <div className="door-opening-rays" />
        <div className="door-opening-glow" />
      </div>

      <div className="door-opening-gates">
        <div className="door-opening-doors">
          <div className="door-opening-door door-opening-left">
            <i className="door-opening-handle door-opening-handle-one" />
            <i className="door-opening-handle door-opening-handle-two" />
            <i className="door-opening-handle door-opening-handle-three" />
            <i className="door-opening-panel door-opening-panel-one" />
            <i className="door-opening-panel door-opening-panel-two"><b /></i>
            <i className="door-opening-panel door-opening-panel-three"><b /></i>
            <i className="door-opening-plate" />
            <i className="door-opening-ring" />
          </div>
          <div className="door-opening-door door-opening-right">
            <i className="door-opening-handle door-opening-handle-one" />
            <i className="door-opening-handle door-opening-handle-two" />
            <i className="door-opening-handle door-opening-handle-three" />
            <i className="door-opening-panel door-opening-panel-one" />
            <i className="door-opening-panel door-opening-panel-two"><b /></i>
            <i className="door-opening-panel door-opening-panel-three"><b /></i>
            <i className="door-opening-plate" />
            <i className="door-opening-ring" />
          </div>
        </div>
        <i className="door-opening-arch" />
        <i className="door-opening-key" />
        <i className="door-opening-floor" />
        <div className="door-opening-hang">
          <i className="door-opening-chain door-opening-chain-left" />
          <i className="door-opening-chain door-opening-chain-right" />
          <i className="door-opening-hook" />
          <div className="door-opening-nameplate">
            <i className="door-opening-eye door-opening-eye-left" />
            <i className="door-opening-eye door-opening-eye-right" />
            <b>{primaryNames.join(" & ")}</b>
            <span>WEDDING INVITATION</span>
          </div>
        </div>
      </div>

      <button className="door-opening-crest" type="button" onClick={start} disabled={startedRef.current} aria-label="Open the wedding invitation">
        {monogram}
      </button>
      <p className="door-opening-hint">{isOpen ? "" : "Tap the crest to enter"}</p>
      <button className={`door-opening-skip${showSkip ? " door-opening-skip-visible" : ""}`} type="button" onClick={skip}>Skip</button>
    </div>
  );
}

export default DoorOpening;
