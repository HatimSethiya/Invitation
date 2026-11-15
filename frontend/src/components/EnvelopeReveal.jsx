import { useCallback, useEffect, useRef, useState } from "react";
import { resolveMediaUrl } from "../services/api";
import "./PremiumReferenceOpening.css";

/**
 * Premium reference opening sequence:
 * wax-seal burst -> envelope flap -> invitation insert extraction ->
 * envelope fade -> champagne curtains reveal the existing invitation.
 * The standalone reference's sample invitation and countdown are intentionally
 * not rendered; this overlay hands off to the invitation already on this page.
 */
function EnvelopeReveal({ invitation, onOpenMusic, onHandoffStart, onOpened }) {
  const [isStarted, setIsStarted] = useState(false);
  const [isFlapOpen, setIsFlapOpen] = useState(false);
  const [isCardExtracted, setIsCardExtracted] = useState(false);
  const [isIntroHidden, setIsIntroHidden] = useState(false);
  const [isCurtainsOpening, setIsCurtainsOpening] = useState(false);
  const [isFast, setIsFast] = useState(false);
  const timersRef = useRef([]);
  const startedRef = useRef(false);
  const handedOffRef = useRef(false);
  const openedRef = useRef(false);

  const schedule = useCallback((callback, delay) => {
    const timerId = window.setTimeout(callback, delay);
    timersRef.current.push(timerId);
    return timerId;
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const handoff = useCallback(() => {
    if (handedOffRef.current) return;
    handedOffRef.current = true;
    onHandoffStart?.();
  }, [onHandoffStart]);

  const finish = useCallback(() => {
    if (openedRef.current) return;
    openedRef.current = true;
    onOpened?.();
  }, [onOpened]);

  const burstSeal = useCallback(() => {
    const seal = document.querySelector(".premium-opening-seal");
    if (!seal) return;

    const rect = seal.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const flash = document.createElement("i");
    flash.className = "premium-opening-flash";
    flash.style.cssText = "left:" + x + "px;top:" + y + "px";
    document.body.appendChild(flash);
    flash.animate(
      [{ transform: "scale(.2)", opacity: 1 }, { transform: "scale(2.6)", opacity: 0 }],
      { duration: 800, easing: "ease-out" }
    ).onfinish = () => flash.remove();

    for (let index = 0; index < 90; index += 1) {
      const dust = document.createElement("i");
      dust.className = "premium-opening-dust";
      const size = 2 + Math.random() * 4;
      dust.style.cssText =
        "left:" + x + "px;top:" + y + "px;width:" + size + "px;height:" + size + "px";
      document.body.appendChild(dust);

      const angle = Math.random() * 6.283;
      const distance = 40 + Math.random() * 130;
      dust.animate(
        [
          { transform: "translate(0,0)", opacity: 1 },
          {
            transform:
              "translate(" + Math.cos(angle) * distance + "px," +
              (Math.sin(angle) * distance + 30) + "px)",
            opacity: 0,
          },
        ],
        { duration: 900 + Math.random() * 900, easing: "cubic-bezier(.1,.7,.3,1)" }
      ).onfinish = () => dust.remove();
    }
  }, []);

  const beginCurtainReveal = useCallback(() => {
    setIsIntroHidden(true);
    setIsCurtainsOpening(true);
    handoff();
    schedule(finish, 4150);
  }, [finish, handoff, schedule]);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setIsStarted(true);
    onOpenMusic?.();
    burstSeal();

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setIsFast(true);
      setIsFlapOpen(true);
      setIsCardExtracted(true);
      setIsIntroHidden(true);
      setIsCurtainsOpening(true);
      handoff();
      schedule(finish, 250);
      return;
    }

    schedule(() => setIsFlapOpen(true), 600);
    schedule(() => setIsCardExtracted(true), 1600);
    schedule(() => setIsIntroHidden(true), 3000);
    schedule(beginCurtainReveal, 3300);
  }, [beginCurtainReveal, burstSeal, finish, handoff, onOpenMusic, schedule]);

  const skip = useCallback(() => {
    if (!startedRef.current || openedRef.current) return;
    clearTimers();
    setIsFast(true);
    setIsFlapOpen(true);
    setIsCardExtracted(true);
    setIsIntroHidden(true);
    setIsCurtainsOpening(true);
    handoff();
    schedule(finish, 250);
  }, [clearTimers, finish, handoff, schedule]);

  const bride = invitation?.couple?.partner1?.name || invitation?.couple?.brideName || "Bride";
  const groom = invitation?.couple?.partner2?.name || invitation?.couple?.groomName || "Groom";
  const primaryNames = invitation?.couple?.nameOrder === "brideFirst" ? [bride, groom] : [groom, bride];
  const monogram =
    (primaryNames[0].charAt(0) || "G").toUpperCase() +
    "&" +
    (primaryNames[1].charAt(0) || "B").toUpperCase();
  const coverImage = invitation?.coverImageUrl
    ? resolveMediaUrl(invitation.coverImageUrl)
    : null;
  const stageClass =
    "premium-opening-stage" +
    (isStarted ? " premium-opening-started" : "") +
    (isFlapOpen ? " premium-opening-flap-open" : "") +
    (isCardExtracted ? " premium-opening-card-extracted" : "") +
    (isIntroHidden ? " premium-opening-intro-hidden" : "") +
    (isCurtainsOpening ? " premium-opening-fx" : "") +
    (isFast ? " premium-opening-fast" : "");

  return (
    <div className={stageClass} aria-label="Wedding invitation opening">
      <div className="premium-opening-curtain premium-opening-curtain-left" />
      <div className="premium-opening-curtain premium-opening-curtain-right" />
      <div className="premium-opening-top-panel" />

      <div className="premium-opening-intro">
        <div className="premium-opening-envelope-wrap">
          <div
            className="premium-opening-envelope"
            aria-label={"Wedding invitation envelope for " + primaryNames[0] + " and " + primaryNames[1]}
          >
            <div className="premium-opening-envelope-back" />
            <div className="premium-opening-flap-wrap">
              <div className="premium-opening-flap" />
            </div>
            <div className="premium-opening-insert">
              {coverImage ? (
                <img
                  className="premium-opening-cover-art"
                  src={coverImage}
                  alt="Invitation cover"
                  draggable="false"
                />
              ) : (
                <>
                  <span className="premium-opening-insert-ornament" aria-hidden="true">✦</span>
                  <span className="premium-opening-insert-monogram">{monogram}</span>
                  <span className="premium-opening-insert-couple">
                    <span>{primaryNames[0]}</span>
                    <em>Weds</em>
                    <span>{primaryNames[1]}</span>
                  </span>
                  <span className="premium-opening-insert-date">
                    {invitation?.weddingDate
                      ? new Date(invitation.weddingDate).toLocaleDateString(undefined, {
                          month: "long",
                          year: "numeric",
                        })
                      : "Wedding Invitation"}
                  </span>
                </>
              )}
            </div>
            <div className="premium-opening-envelope-pocket" />
            <div className="premium-opening-envelope-front">
              <i className="premium-opening-front-left" />
              <i className="premium-opening-front-right" />
              <i className="premium-opening-front-bottom" />
            </div>
            <button
              className="premium-opening-seal"
              type="button"
              onClick={start}
              disabled={startedRef.current}
              aria-label="Tap the wax seal to open the wedding invitation"
            >
              <b className="premium-opening-seal-half-one">{monogram}</b>
              <b className="premium-opening-seal-half-two">{monogram}</b>
            </button>
          </div>
          <p className={"premium-opening-hint" + (isStarted ? " premium-opening-hint-hidden" : "")}>
            Tap the seal to open
          </p>
        </div>
      </div>

      <button
        className={"premium-opening-skip" + (isStarted && !isCurtainsOpening ? " premium-opening-skip-visible" : "")}
        type="button"
        onClick={skip}
        disabled={!isStarted || isCurtainsOpening}
      >
        Skip
      </button>
    </div>
  );
}

export default EnvelopeReveal;
