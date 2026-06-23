  // ---- AUDIO: web-shot SFX, played only on meaningful actions ----
  // Rules: once on first entry, on mobile menu open, on major nav clicks,
  // on entering a project universe, on special interactions. NEVER on hover loops.
  //
  // SFX_ENABLED is declared in js/intro.js (which loads first) and reused
  // here as the single mute switch for every sound effect on the site.
  const webShotSfx = document.getElementById('webShotSfx');
  let sfxArmed = false;
  let lastSfxTime = 0;

  function playSfx() {
    if (!window.SFX_ENABLED) return;
    if (!webShotSfx) return;
    const now = Date.now();
    if (now - lastSfxTime < 250) return; // guard against accidental double-fire
    lastSfxTime = now;
    try {
      webShotSfx.currentTime = 0;
      webShotSfx.volume = 0.55;
      webShotSfx.play().catch(() => {});
    } catch (e) {}
  }

  // Arm the "entry" sound to fire on the first user gesture (browsers block
  // unprompted autoplay, so this is the closest faithful equivalent of
  // "plays once when the hero loads").
  function armEntrySound() {
    if (sfxArmed) return;
    sfxArmed = true;
    playSfx();
  }
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(evt => {
    window.addEventListener(evt, armEntrySound, { once: true, passive: true });
  });

  // Major nav clicks (desktop nav + mobile menu links + scroll cue)
  document.querySelectorAll('[data-sfx="nav"]').forEach(el => {
    el.addEventListener('click', () => { sfxArmed = true; playSfx(); });
  });

  // Entering a project "universe" (GitHub / Live Demo links)
  document.querySelectorAll('[data-sfx="enter"]').forEach(el => {
    el.addEventListener('click', () => { sfxArmed = true; playSfx(); });
  });

  // ---- DIMENSION JUMP FLASH ON NAV CLICK ----
  const dimensionFlash = document.getElementById('dimensionFlash');
  function jumpFlash() {
    if (prefersReducedMotion || !dimensionFlash) return;
    dimensionFlash.classList.remove('flash');
    requestAnimationFrame(() => dimensionFlash.classList.add('flash'));
    setTimeout(() => dimensionFlash.classList.remove('flash'), 460);
  }
  document.querySelectorAll('.nav-links a, .mobile-menu a, .scroll-cue').forEach(a => {
    a.addEventListener('click', jumpFlash);
  });

  // ---- MOBILE MENU ----
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  navToggle.addEventListener('click', () => {
    const isOpen = mobileMenu.classList.toggle('open');
    navToggle.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (isOpen) { sfxArmed = true; playSfx(); }
  });
  mobileMenu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      navToggle.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // ---- SKYLINE PARALLAX (scroll + mouse depth) ----
  const skylineEl = document.querySelector('.skyline');
  const heroEl = document.getElementById('hero');
  let skylineScrollShift = 0;
  let skylineMouseX = 0;

  function applySkylineTransform() {
    if (skylineEl) {
      skylineEl.style.transform = `translate(${skylineMouseX}px, ${skylineScrollShift}px)`;
    }
  }

  if (!prefersReducedMotion && skylineEl) {
    document.addEventListener('scroll', () => {
      skylineScrollShift = Math.min(window.scrollY * 0.12, 60);
      applySkylineTransform();
    }, { passive: true });

    if (hasFinePointer && heroEl) {
      heroEl.addEventListener('mousemove', e => {
        const rect = heroEl.getBoundingClientRect();
        const xPct = (e.clientX - rect.left) / rect.width - 0.5;
        skylineMouseX = xPct * -18;
        applySkylineTransform();
      });
      heroEl.addEventListener('mouseleave', () => {
        skylineMouseX = 0;
        applySkylineTransform();
      });
    }
  }

  // ---- MAGNETIC BUTTONS ----
  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.magnetic').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.18}px, ${y * 0.28}px)`;
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  // ---- SCROLL REVEAL ----
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
      }
    });
  }, { threshold: 0.12 });
  reveals.forEach(el => observer.observe(el));

  // ---- SKILL BARS: fill on reveal ----
  const skillsLayout = document.querySelector('.skills-layout');
  const skillBarObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.skill-bar-fill[data-width]').forEach(bar => {
          requestAnimationFrame(() => { bar.style.width = bar.dataset.width + '%'; });
        });
        skillBarObserver.disconnect();
      }
    });
  }, { threshold: 0.25 });
  if (skillsLayout) skillBarObserver.observe(skillsLayout);

  // ---- CONTACT: web grows in + spider descends on scroll ----
  const contactSection = document.getElementById('contact');
  const spiderEl = document.getElementById('spiderDescend');

  const contactObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        contactSection.classList.add('web-grown');
      }
    });
  }, { threshold: 0.25 });
  if (contactSection) contactObserver.observe(contactSection);

  if (!prefersReducedMotion && contactSection && spiderEl) {
    document.addEventListener('scroll', () => {
      const rect = contactSection.getBoundingClientRect();
      const vh = window.innerHeight;
      // progress: 0 when section top reaches bottom of viewport, 1 when section top reaches top
      const progress = Math.min(Math.max((vh - rect.top) / (vh + rect.height * 0.4), 0), 1);
      const maxDrop = 130;
      spiderEl.style.transform = `translateY(${progress * maxDrop}px)`;
    }, { passive: true });
  }

  // ---- IDLE HERO SPIDER EASTER EGG — drops in after a moment of stillness ----
  (function initIdleSpider() {
    const heroSection = document.getElementById('hero');
    const idleSpider = document.getElementById('idleSpider');
    if (!heroSection || !idleSpider || prefersReducedMotion) return;

    let idleTimer = null;
    const IDLE_DELAY = 9000;

    function scheduleSpider() {
      clearTimeout(idleTimer);
      idleSpider.classList.remove('dropped', 'fleeing');
      idleTimer = setTimeout(() => {
        const heroVisible = heroSection.getBoundingClientRect().bottom > 80;
        if (!heroVisible) { scheduleSpider(); return; }
        idleSpider.style.left = (30 + Math.random() * 40) + '%';
        idleSpider.classList.add('dropped');
      }, IDLE_DELAY);
    }

    idleSpider.addEventListener('click', (e) => {
      e.stopPropagation();
      idleSpider.classList.remove('dropped');
      idleSpider.classList.add('fleeing');
      const lines = ['not today, neighbor!', 'okay okay, going!', 'thwip, see ya!'];
      const tag = document.createElement('div');
      tag.className = 'thwip';
      tag.style.left = (e.clientX - 30) + 'px';
      tag.style.top = (e.clientY - 30) + 'px';
      tag.style.fontSize = '0.85rem';
      tag.textContent = lines[Math.floor(Math.random() * lines.length)];
      document.body.appendChild(tag);
      setTimeout(() => tag.remove(), 750);
      scheduleSpider();
    });

    ['mousemove', 'scroll', 'keydown', 'touchstart'].forEach(evt => {
      window.addEventListener(evt, scheduleSpider, { passive: true });
    });
    scheduleSpider();
  })();

  // ---- TYPE "SPIDEY" ANYWHERE — quick spider-sense flash easter egg ----
  (function initSpideyWord() {
    const target = 'spidey';
    let buffer = '';
    document.addEventListener('keydown', (e) => {
      if (e.key.length !== 1) return;
      buffer = (buffer + e.key.toLowerCase()).slice(-target.length);
      if (buffer === target) {
        buffer = '';
        const flash = document.getElementById('dimensionFlash');
        if (flash) {
          flash.style.transition = 'opacity 0.15s ease';
          flash.style.opacity = '0.25';
          setTimeout(() => { flash.style.opacity = '0'; }, 180);
        }
        const tag = document.createElement('div');
        tag.className = 'thwip';
        tag.textContent = 'SPIDER-SENSE TINGLING!';
        tag.style.left = '50%';
        tag.style.top = '20%';
        tag.style.transform = 'translateX(-50%)';
        tag.style.fontSize = '1.1rem';
        document.body.appendChild(tag);
        setTimeout(() => tag.remove(), 750);
      }
    });
  })();


  // ---- STATS COUNTER ----
  function animateStats() {
    document.querySelectorAll('.stat-num[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target);
      const duration = prefersReducedMotion ? 1 : 1800;
      const start = performance.now();
      const halftoneEl = el.closest('.stat-block')?.querySelector('.halftone');
      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target);
        if (progress < 1) {
          requestAnimationFrame(update);
        } else {
          el.textContent = target + (target >= 100 ? '+' : '');
          el.classList.add('pop');
          setTimeout(() => el.classList.remove('pop'), 450);
          if (halftoneEl) {
            halftoneEl.style.opacity = '0.55';
            setTimeout(() => { halftoneEl.style.opacity = ''; }, 380);
          }
        }
      }
      requestAnimationFrame(update);
    });
  }

  const statsSection = document.getElementById('stats');
  const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateStats();
      statsObserver.disconnect();
    }
  }, { threshold: 0.3 });
  statsObserver.observe(statsSection);

  // ---- HERO NAME GLITCH ----
  if (!prefersReducedMotion) {
    const heroName = document.querySelector('.hero-name');
    setInterval(() => {
      if (Math.random() > 0.85) {
        heroName.style.textShadow = '6px 2px 0 var(--red), -4px -2px 0 rgba(0,200,255,0.3), 12px 12px 0 rgba(0,0,0,0.4)';
        setTimeout(() => {
          heroName.style.textShadow = '4px 4px 0 var(--red), 8px 8px 0 var(--red-dark), 12px 12px 0 rgba(0,0,0,0.4)';
        }, 80);
      }
    }, 2000);
  }

  // ---- CONTACT FORM ----
  function sendMessage() {
    const nameEl = document.getElementById('contactName');
    const emailEl = document.getElementById('contactEmail');
    const name = nameEl.value.trim();
    const email = emailEl.value.trim();
    const fb = document.getElementById('formFeedback');
    const btn = document.querySelector('.contact-form-wrap .btn-primary');

    if (!name) {
      fb.textContent = '// NAME REQUIRED';
      fb.style.color = 'var(--red)';
      fb.style.opacity = '1';
      nameEl.focus();
      return;
    }
    if (!email || !email.includes('@')) {
      fb.textContent = '// VALID EMAIL REQUIRED';
      fb.style.color = 'var(--red)';
      fb.style.opacity = '1';
      emailEl.focus();
      return;
    }

    btn.disabled = true;
    const originalText = btn.textContent;
    btn.textContent = 'SENDING...';

    setTimeout(() => {
      fb.textContent = '// MESSAGE SENT — THWIP!';
      fb.style.color = 'var(--gold)';
      fb.style.opacity = '1';
      btn.textContent = originalText;
      btn.disabled = false;
      document.getElementById('contactName').value = '';
      document.getElementById('contactEmail').value = '';
      document.getElementById('contactMsg').value = '';
      setTimeout(() => fb.style.opacity = '0', 3000);
    }, 600);
  }

  // ---- 3D TILT: comic panels + project cards ----
  if (hasFinePointer && !prefersReducedMotion) {
    document.querySelectorAll('.comic-panel, .project-card').forEach(p => {
      const isProject = p.classList.contains('project-card');
      if (isProject) p.dataset.baseTransform = 'translateY(-6px) rotate(-0.5deg)';

      p.addEventListener('mousemove', e => {
        const rect = p.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const tiltX = isProject ? 2.5 : 4;
        p.style.setProperty('--mx', `${(x + 0.5) * 100}%`);
        p.style.setProperty('--my', `${(y + 0.5) * 100}%`);
        const base = isProject ? p.dataset.baseTransform : '';
        p.style.transform = `${base} perspective(600px) rotateX(${-y * tiltX}deg) rotateY(${x * tiltX}deg)`;
      });
      p.addEventListener('mouseleave', () => {
        p.style.transform = '';
      });
    });
  }

  // ---- HERO "UNIVERSE" WORD GLITCH — keeps going continuously ----
  // Loops forever with only a brief intentional rest between bursts
  // (kept very low, ~0.3s) so it reads as a constantly-flickering
  // signal rather than an occasional one-off pulse. Still scoped to
  // only the word itself; rest of the sentence ("Welcome to my ___")
  // is untouched.
  (function initUniverseWordGlitch() {
    const universeWord = document.getElementById('universeWord');
    if (!universeWord || prefersReducedMotion) return;

    function scheduleGlitch() {
      universeWord.classList.add('universe-glitch');
      setTimeout(() => {
        universeWord.classList.remove('universe-glitch');
        setTimeout(scheduleGlitch, 300); // short, low intentional rest
      }, 2000); // active flicker burst
    }
    scheduleGlitch();
  })();

  // ---- PROJECTS HEADING GLITCH — fires when cursor enters the main ----
  // ---- project container, brief & responsive, no continuous loop  ----
  // Listener lives on the whole <section id="projects"> (heading +
  // subtitle + card grid) rather than just the heading text, so hovering
  // anywhere inside the Projects container triggers the heading glitch
  // automatically. mouseenter/mouseleave don't re-fire while moving
  // between child elements (cards, links, etc.) inside the section, so
  // this won't repeatedly re-trigger as the cursor wanders around inside.
  (function initProjectsTitleGlitch() {
    const projectsSection = document.getElementById('projects');
    const projectsTitle = document.getElementById('projectsTitle');
    if (!projectsSection || !projectsTitle || prefersReducedMotion) return;

    let glitchTimeout = null;
    projectsSection.addEventListener('mouseenter', () => {
      clearTimeout(glitchTimeout);
      projectsTitle.classList.add('projects-glitch');
      glitchTimeout = setTimeout(() => {
        projectsTitle.classList.remove('projects-glitch');
      }, 450);
    });
    projectsSection.addEventListener('mouseleave', () => {
      clearTimeout(glitchTimeout);
      projectsTitle.classList.remove('projects-glitch');
    });
  })();

