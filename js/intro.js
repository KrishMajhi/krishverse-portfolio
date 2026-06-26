const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- SFX_ENABLED — single switch to mute every sound effect on the ----
// ---- site (this file's intro thwip + effects.js's playSfx). Flip ----
// ---- back to true whenever sound should return; nothing else needs ----
// ---- to change. Declared here because intro.js loads/runs first. ----
window.SFX_ENABLED = true;

  // ── COMIC NARRATOR INTRO ───────────────────────────────────────────────────
  (function() {
    const intro = document.getElementById('comic-intro');
    if (!intro) return;

    // Plays on EVERY page load/reload — no localStorage gate.
    // (If you ever want it to play only once per visitor again, reintroduce
    // a localStorage check here.)

    const atmosphere  = document.getElementById('ciAtmosphere');
    const boxWrap      = document.getElementById('ciBoxWrap');
    const textEl       = document.getElementById('ciNarrationText');
    const caretEl       = document.getElementById('ciCaret');
    const dotsEl        = document.getElementById('ciDots');
    const swingWrap      = document.getElementById('ciSwingWrap');
    const swinger          = document.getElementById('ciSwinger');
    const blackout        = document.getElementById('ciBlackout');
    const skipBtn          = document.getElementById('ciSkipBtn');
    const pauseBtn          = document.getElementById('ciPauseBtn');
    // Same <audio> element js/effects.js uses for nav/SFX elsewhere on the
    // page — referenced directly here (instead of via effects.js's
    // playSfx()) because intro.js loads and runs before effects.js does.
    const webShotSfx        = document.getElementById('webShotSfx');

    // Plays the existing web-shot/thwip SFX. Respects the global
    // SFX_ENABLED mute switch — when false, this is a silent no-op and
    // the visual "THWIP!" pop still plays on its own.
    function playIntroThwip() {
      if (!window.SFX_ENABLED) return;
      if (!webShotSfx) return;
      try {
        webShotSfx.currentTime = 0;
        webShotSfx.volume = 0.55;
        webShotSfx.play().catch(() => {});
      } catch (e) {}
    }

    const lines = [
      'MEANWHILE...',
      'ENTERING KRISHVERSE...',
      'ESTABLISHING CONNECTION...',
      'WELCOME TO EARTH-KRISH'
    ];

    // ── SWING SCENE TIMING ──────────────────────────────────────────────────
    // gifDurationMs  = how long your swing-character.gif actually takes to
    //                  play one full loop (measure your real file and set
    //                  this to match — currently 2000ms / 2s per your GIF).
    // holdAfterGifMs = extra hold time AFTER the GIF finishes before cutting
    //                  to blackout, so the last frame doesn't feel chopped.
    // Total time from "swing scene starts" to "blackout begins" = the sum
    // of these two. This MUST match the 2.7s duration set on the
    // `ciSwingerPop` animation in css/intro.css — if you change either
    // number here, update that CSS animation's duration to match.
    const TIMING = {
      gifDurationMs: 2000,
      holdAfterGifMs: 700
    };
    const SWING_SCENE_TOTAL_MS = TIMING.gifDurationMs + TIMING.holdAfterGifMs; // 2700ms

    // ── PAUSE-AWARE TIMER SYSTEM ───────────────────────────────────────────
    // Native setTimeout can't be paused, only cancelled. To get a real
    // pause (so you can freeze mid-scene, open devtools, and tweak CSS
    // without the sequence continuing underneath you), every "wait" in
    // this file goes through setTimer() below instead of setTimeout()
    // directly. While paused, remaining delay is tracked and timers are
    // re-armed with the leftover time on resume.
    let isPaused = false;
    const activeTimers = []; // { id, fn, remaining, startedAt }

    function setTimer(fn, delay) {
      const entry = { id: null, fn, remaining: delay, startedAt: performance.now() };
      entry.id = setTimeout(() => {
        const idx = activeTimers.indexOf(entry);
        if (idx !== -1) activeTimers.splice(idx, 1);
        fn();
      }, delay);
      activeTimers.push(entry);
      return entry;
    }

    function clearAllTimers() {
      activeTimers.forEach(entry => clearTimeout(entry.id));
      activeTimers.length = 0;
    }

    function pauseAllTimers() {
      activeTimers.forEach(entry => {
        clearTimeout(entry.id);
        const elapsed = performance.now() - entry.startedAt;
        entry.remaining = Math.max(0, entry.remaining - elapsed);
      });
    }

    function resumeAllTimers() {
      const toResume = activeTimers.slice();
      activeTimers.length = 0;
      toResume.forEach(entry => {
        entry.startedAt = performance.now();
        entry.id = setTimeout(() => {
          const idx = activeTimers.indexOf(entry);
          if (idx !== -1) activeTimers.splice(idx, 1);
          entry.fn();
        }, entry.remaining);
        activeTimers.push(entry);
      });
    }

    // ── PAUSE-AWARE CSS ANIMATIONS ──────────────────────────────────────────
    // Freezes every CSS @keyframes animation currently running inside
    // #comic-intro (dialogue box pop, atmosphere glow, blinking dots, the
    // GIF's own fade/scale wrapper animation, etc) by forcing
    // animation-play-state: paused via one CSS variable.
    //
    // IMPORTANT GIF-SPECIFIC NOTE:
    // animation-play-state ONLY affects CSS @keyframes — it has NO effect
    // on a GIF's own internal frame playback, because that's decoded by
    // the browser natively, not driven by CSS. The only reliable way to
    // freeze an actual animated GIF is to swap its `src` to itself (this
    // forces the browser to reload and display just the first frame,
    // effectively freezing it) and restore the original animated src on
    // resume. That swap is handled separately below by pauseGif()/resumeGif().
    function setCssPaused(paused) {
      intro.style.setProperty('--ci-anim-state', paused ? 'paused' : 'running');
    }

    // ── GIF-SPECIFIC PAUSE/RESUME ──────────────────────────────────────────
    let gifOriginalSrc = null;
    function pauseGif() {
      if (!swinger || !swinger.src) return;
      gifOriginalSrc = swinger.src;
      // Re-requesting the same URL restarts the GIF decoder at frame 0
      // and most browsers will hold there since there's no further
      // "tick" driving it forward until something reloads it again.
      // This is the standard no-library trick for freezing an <img> GIF.
      const frozenSrc = gifOriginalSrc;
      swinger.src = '';
      swinger.src = frozenSrc;
    }
    function resumeGif() {
      if (!swinger || !gifOriginalSrc) return;
      // Force a fresh load so animation restarts from frame 0. Note this
      // means resuming does NOT continue from the exact paused frame —
      // browsers don't expose GIF frame-seeking — it restarts the loop.
      // Acceptable tradeoff for a dev/testing pause button.
      const src = gifOriginalSrc;
      swinger.src = '';
      requestAnimationFrame(() => { swinger.src = src; });
    }

    function togglePause() {
      isPaused = !isPaused;
      if (isPaused) {
        pauseAllTimers();
        setCssPaused(true);
        pauseGif();
        if (pauseBtn) pauseBtn.textContent = '▶ RESUME';
      } else {
        resumeAllTimers();
        setCssPaused(false);
        resumeGif();
        if (pauseBtn) pauseBtn.textContent = '⏸ PAUSE';
      }
    }

    if (pauseBtn) {
      pauseBtn.addEventListener('click', togglePause);
    }

    let skipped = false;

    // reduced-motion: skip straight to portfolio, no animation work at all
    if (prefersReducedMotion) {
      intro.style.display = 'none';
      return;
    }

    function typeLine(line, onDone) {
      textEl.textContent = '';
      let i = 0;
      const speed = 64;
      function step() {
        if (i < line.length) {
          textEl.textContent += line[i];
          i++;
          setTimer(step, speed);
        } else {
          onDone();
        }
      }
      step();
    }

    // ── INTRO DIALOGUE GLITCH TRIGGER ───────────────────────────────────────
    // Fires once, on the final typed line only: a short intentional beat
    // after typing finishes (kept low — just enough to read as a
    // deliberate pause, not a stall), then applies
    // .intro-dialogue-glitch (Effect 2-style dimensional distortion) to
    // the text and leaves it on — it keeps flickering continuously
    // (the CSS animation behind it loops `infinite`) for as long as the
    // dialogue line stays on screen, right up until the box leaves for
    // the swing scene. The dialogue box itself (.intro-dialogue) never
    // gets the class, so only the text run glitches — the box stays
    // static throughout.
    function triggerDialogueGlitch(line, onDone) {
      textEl.setAttribute('data-glitch-text', line);
      setTimer(() => {
        textEl.classList.add('intro-dialogue-glitch');
        if (onDone) onDone();
      }, 150);
    }

    function stopDialogueGlitch() {
      textEl.classList.remove('intro-dialogue-glitch');
    }

    function startDotsThenSwing() {
      caretEl.style.display = 'none';
      const dotSpans = dotsEl.querySelectorAll('span');
      dotSpans.forEach((s, i) => {
        setTimer(() => s.classList.add('show'), i * 220);
      });
      setTimer(() => {
        dotSpans[dotSpans.length - 1].classList.add('blink');
      }, dotSpans.length * 220);

      setTimer(startSwing, 1000);
    }

    function runLines(idx) {
      if (idx >= lines.length) {
        // shouldn't normally be reached directly — the last line's
        // typeLine callback below routes through the glitch first —
        // but kept as a safe fallback.
        startDotsThenSwing();
        return;
      }
      typeLine(lines[idx], () => {
        const isLast = idx === lines.length - 1;
        if (isLast) {
          // Start the glitch (which now loops continuously), then move
          // straight on to the trailing dots → swing sequence without
          // waiting for it to "finish" — it doesn't finish on its own
          // anymore. It keeps flickering right up until startSwing()
          // explicitly stops it as the box leaves.
          triggerDialogueGlitch(lines[idx], startDotsThenSwing);
        } else {
          setTimer(() => runLines(idx + 1), 480);
        }
      });
    }

    function startSwing() {
      // Sound fires the instant the glitch stops (box is about to leave),
      // then there's a short beat before the GIF itself actually starts —
      // splitting the gap so the cue reads as "in between" rather than
      // tied hard to either edge.
      stopDialogueGlitch();
      playIntroThwip();

      setTimer(() => {
        boxWrap.classList.remove('pop');
        boxWrap.classList.add('leave');
        // Adding `.go` here (not earlier) is what starts the 2.7s
        // ciSwingerPop CSS animation on the GIF wrapper — it has to
        // line up with the `src` assignment below, or the wrapper
        // would sit empty mid-animation for a second with nothing to
        // show.
        swingWrap.classList.add('go');
        // The GIF's `src` is intentionally left unset in the HTML
        // (it's only on data-src) so the browser doesn't decode/play
        // its frames in the background while the dialogue scene runs.
        // Assigning `src` here is what actually starts the GIF's own
        // internal animation loop.
        if (swinger && swinger.dataset.src && !swinger.src) {
          swinger.src = swinger.dataset.src;
        }
        // GIF starts playing now. Portfolio must not appear until the
        // GIF's full duration (2000ms) PLUS the hold (700ms) has
        // elapsed — i.e. 2700ms from this exact moment, matching the
        // ciSwingerPop CSS animation duration in css/intro.css.
        setTimer(blackoutAndReveal, SWING_SCENE_TOTAL_MS);
      }, 300);
    }

    function blackoutAndReveal() {
      atmosphere.classList.remove('show');
      blackout.classList.add('flash');
      // Beat 1: hold fully black for a moment once the flash settles,
      // so the cut to dark reads as a deliberate pause, not a flicker.
      setTimer(() => {
        // Beat 2: start revealing the portfolio (blur/scale-settle) while
        // still hidden behind the solid black blackout layer — this way
        // the portfolio is already easing into place by the time the
        // black layer itself starts to fade, instead of popping in after.
        document.body.classList.add('ci-revealing');
        intro.classList.add('done');
        blackout.classList.add('fade-out');
        setTimer(() => {
          intro.style.display = 'none';
          document.body.classList.remove('ci-revealing');
        }, 700);
      }, 480);
    }

    // ── SKIP BUTTON ──────────────────────────────────────────────────────
    // Cancels every queued timer, then jumps straight to the
    // blackout → reveal scenes so the exit still feels like a deliberate
    // comic-impact cut rather than an abrupt UI disappearance.
    function skipIntro() {
      if (skipped) return;
      skipped = true;
      if (isPaused) { isPaused = false; setCssPaused(false); resumeGif(); }
      clearAllTimers();

      // tidy up whatever scene was mid-flight
      boxWrap.classList.remove('pop');
      boxWrap.classList.add('leave');
      swingWrap.classList.remove('go');
      stopDialogueGlitch();
      if (skipBtn) skipBtn.style.display = 'none';
      if (pauseBtn) pauseBtn.style.display = 'none';

      blackoutAndReveal();
    }

    if (skipBtn) {
      skipBtn.addEventListener('click', skipIntro);
    }

    // Scene 1 — black screen, brief beat
    setTimer(() => {
      // Scene 2 — atmosphere eases in first, dialogue box follows a beat
      // later, so the screen feels like it's gradually waking up rather
      // than everything appearing in the same instant.
      atmosphere.classList.add('show');
      setTimer(() => {
        boxWrap.classList.add('pop');
        setTimer(() => runLines(0), 350);
      }, 220);
    }, 500);
  })();
  // ─────────────────────────────────────────────────────────────────────────