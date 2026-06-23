  // ---- PAGE LOADER ----
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    const minDelay = prefersReducedMotion ? 0 : 900;
    setTimeout(() => {
      loader.classList.add('hide');
      document.body.classList.remove('loading');
    }, minDelay);
  });
  // Failsafe in case 'load' is slow/blocked
  setTimeout(() => {
    document.getElementById('loader').classList.add('hide');
    document.body.classList.remove('loading');
  }, 3500);

  // ---- CURSOR (dot + lagging ring) ----
  const cursor = document.getElementById('cursor');
  const cursorRing = document.getElementById('cursorRing');
  let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;
  const hasFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (hasFinePointer) {
    document.addEventListener('mousemove', e => {
      mouseX = e.clientX; mouseY = e.clientY;
      cursor.style.left = mouseX + 'px';
      cursor.style.top = mouseY + 'px';
    });

    function ringLoop() {
      ringX += (mouseX - ringX) * 0.18;
      ringY += (mouseY - ringY) * 0.18;
      cursorRing.style.left = ringX + 'px';
      cursorRing.style.top = ringY + 'px';
      requestAnimationFrame(ringLoop);
    }
    ringLoop();

    const hoverTargets = 'a, button, .skill-card, .project-card, .comic-panel, .journey-node, input, textarea';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(hoverTargets)) cursor.classList.add('hover-active');
    });
    document.addEventListener('mouseout', e => {
      if (e.target.closest(hoverTargets)) cursor.classList.remove('hover-active');
    });
  } else {
    cursor.style.display = 'none';
    cursorRing.style.display = 'none';
  }

  // ---- THWIP ON CLICK ----
  document.addEventListener('click', e => {
    const words = ['THWIP!', 'ZAP!', 'POW!', 'WHAM!', 'CLICK!'];
    const el = document.createElement('div');
    el.className = 'thwip';
    el.textContent = words[Math.floor(Math.random() * words.length)];
    el.style.left = (e.clientX - 30) + 'px';
    el.style.top = (e.clientY - 20) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 750);
  });

  // ---- EASTER EGG #1: KONAMI WEB CODE ----
  // Sequence: Up Up Down Down Left Right Left Right (B A reinterpreted as W S)
  const konamiSequence = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','w','s'];
  let konamiProgress = [];
  let spiderSenseOn = false;

  function triggerEasterEgg() {
    if (spiderSenseOn) return;
    spiderSenseOn = true;
    activateSpiderSense();
  }

  document.addEventListener('keydown', e => {
    const key = e.key;
    konamiProgress.push(key);
    konamiProgress = konamiProgress.slice(-konamiSequence.length);
    if (konamiProgress.length === konamiSequence.length &&
        konamiProgress.every((k, i) => k.toLowerCase() === konamiSequence[i].toLowerCase())) {
      triggerEasterEgg();
    }
  });

  function activateSpiderSense() {
    document.body.classList.add('spider-sense');
    document.getElementById('eggOverlay').classList.add('active');
    const banner = document.getElementById('eggBanner');
    banner.classList.add('active');

    sfxArmed = true;
    playSfx();
    fireConfetti();

    setTimeout(() => banner.classList.remove('active'), 3200);

    revealSecretCard();
  }

  function fireConfetti() {
    if (prefersReducedMotion) return;
    const colors = ['#e8272a', '#f5c518', '#f0ead8', '#a01b1e'];
    for (let i = 0; i < 50; i++) {
      const c = document.createElement('div');
      c.className = 'egg-confetti';
      c.style.left = Math.random() * 100 + 'vw';
      c.style.background = colors[Math.floor(Math.random() * colors.length)];
      c.style.animationDuration = (1.6 + Math.random() * 1.4) + 's';
      c.style.animationDelay = (Math.random() * 0.4) + 's';
      c.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(c);
      setTimeout(() => c.remove(), 3500);
    }
  }

  function revealSecretCard() {
    const card = document.getElementById('secretCard');
    const hint = document.getElementById('secretHint');
    if (card && !card.classList.contains('revealed')) {
      card.classList.add('revealed');
      if (hint) hint.style.display = 'none';
      card.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    }
  }

  // ---- EASTER EGG #2: TRIPLE-CLICK LOGO ----
  const navLogo = document.querySelector('.nav-logo');
  if (navLogo) {
    let logoClicks = 0;
    let logoClickTimer = null;
    navLogo.style.cursor = 'pointer';
    navLogo.addEventListener('click', () => {
      logoClicks++;
      clearTimeout(logoClickTimer);
      logoClickTimer = setTimeout(() => { logoClicks = 0; }, 600);
      if (logoClicks >= 3) {
        logoClicks = 0;
        triggerEasterEgg();
      }
    });
  }

  // Manual hint click also reveals (reward curiosity directly)
  const secretHintEl = document.getElementById('secretHint');
  if (secretHintEl) {
    secretHintEl.style.cursor = 'pointer';
    secretHintEl.addEventListener('click', () => {
      fireConfetti();
      revealSecretCard();
    });
  }

  // ---- THREE.JS WEB FIELD (small, light dust of dots in hero) ----
  (function initWebField() {
    const mount = document.getElementById('webFieldCanvas');
    if (!mount || typeof THREE === 'undefined' || prefersReducedMotion) return;

    let width = mount.clientWidth || window.innerWidth;
    let height = mount.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 58;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch (e) {
      return; // WebGL unavailable — fail silently, the CSS pattern + SVG skyline still carry the scene
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    mount.appendChild(renderer.domElement);

    // Small, light dot field — no connecting lines, no pulsing
    const isMobile = window.innerWidth < 768;
    const NODE_COUNT = isMobile ? 35 : 65;
    const nodes = [];
    const positions = new Float32Array(NODE_COUNT * 3);

    for (let i = 0; i < NODE_COUNT; i++) {
      const x = (Math.random() - 0.5) * 170;
      const y = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 70;
      nodes.push({
        x, y, z,
        vx: (Math.random() - 0.5) * 0.018,
        vy: (Math.random() - 0.5) * 0.014,
        vz: (Math.random() - 0.5) * 0.014
      });
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }

    const pointGeo = new THREE.BufferGeometry();
    pointGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointMat = new THREE.PointsMaterial({
      color: 0xf0ead8,
      size: 0.45,
      transparent: true,
      opacity: 0.16,
      sizeAttenuation: true,
      depthWrite: false
    });
    const points = new THREE.Points(pointGeo, pointMat);
    scene.add(points);

    let targetRotX = 0, targetRotY = 0;

    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.getElementById('hero').addEventListener('mousemove', e => {
        const rect = document.getElementById('hero').getBoundingClientRect();
        const nx = (e.clientX - rect.left) / rect.width - 0.5;
        const ny = (e.clientY - rect.top) / rect.height - 0.5;
        targetRotY = nx * 0.12;
        targetRotX = -ny * 0.08;
      });
    }

    function animateWebField() {
      requestAnimationFrame(animateWebField);

      // very slow drift, wrap within bounds
      for (let i = 0; i < NODE_COUNT; i++) {
        const n = nodes[i];
        n.x += n.vx; n.y += n.vy; n.z += n.vz;
        if (n.x > 85) n.x = -85; if (n.x < -85) n.x = 85;
        if (n.y > 50) n.y = -50; if (n.y < -50) n.y = 50;
        if (n.z > 35) n.z = -35; if (n.z < -35) n.z = 35;
        positions[i * 3] = n.x;
        positions[i * 3 + 1] = n.y;
        positions[i * 3 + 2] = n.z;
      }
      pointGeo.attributes.position.needsUpdate = true;

      // gentle scene tilt toward mouse only — no auto-spin
      scene.rotation.y += (targetRotY - scene.rotation.y) * 0.04;
      scene.rotation.x += (targetRotX - scene.rotation.x) * 0.04;

      renderer.render(scene, camera);
    }
    animateWebField();

    window.addEventListener('resize', () => {
      width = mount.clientWidth || window.innerWidth;
      height = mount.clientHeight || window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    }, { passive: true });
  })();

  // ---- AMBIENT PARTICLES ----
  const particleContainer = document.getElementById('particles');
  const particleCount = prefersReducedMotion ? 0 : 30;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (8 + Math.random() * 15) + 's';
    p.style.animationDelay = (Math.random() * 15) + 's';
    p.style.setProperty('--dx', (Math.random() * 100 - 50) + 'px');
    p.style.width = p.style.height = (Math.random() > 0.7 ? '3px' : '2px');
    particleContainer.appendChild(p);
  }

  // ---- RADAR SWEEP ----
  const sweep = document.getElementById('radarSweep');
  let angle = -90;
  function animateSweep() {
    angle += 1.2;
    const rad = angle * Math.PI / 180;
    const x2 = 160 + 130 * Math.cos(rad);
    const y2 = 160 + 130 * Math.sin(rad);
    sweep.setAttribute('x2', x2);
    sweep.setAttribute('y2', y2);
    requestAnimationFrame(animateSweep);
  }
  if (!prefersReducedMotion) animateSweep();

  // ---- SPIDER SENSE: skill card <-> radar node linkage ----
  const radarSvg = document.getElementById('radarSvg');
  const radarNodes = {};
  document.querySelectorAll('.radar-node').forEach(node => {
    const skill = node.dataset.skill;
    radarNodes[skill] = node;
    // create a companion expanding ring for the pulse, positioned at the same point
    const ring = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    ring.setAttribute('cx', node.getAttribute('cx'));
    ring.setAttribute('cy', node.getAttribute('cy'));
    ring.setAttribute('r', 5);
    ring.classList.add('radar-node-ring');
    ring.dataset.skill = skill;
    radarSvg.appendChild(ring);
    radarNodes[skill + '_ring'] = ring;
  });

  function pulseSkillNode(skill) {
    const node = radarNodes[skill];
    const ring = radarNodes[skill + '_ring'];
    if (!node) return;
    node.classList.remove('sense-active');
    if (ring) ring.classList.remove('sense-active');
    requestAnimationFrame(() => {
      node.classList.add('sense-active');
      if (ring) ring.classList.add('sense-active');
    });
  }

  document.querySelectorAll('.skill-card').forEach(card => {
    const skill = card.dataset.skill;
    card.addEventListener('mouseenter', () => {
      card.classList.add('sense-active');
      pulseSkillNode(skill);
    });
    card.addEventListener('mouseleave', () => {
      card.classList.remove('sense-active');
    });
  });

  // Radar nodes also highlight their matching card when hovered directly
  document.querySelectorAll('.radar-node').forEach(node => {
    node.addEventListener('mouseenter', () => {
      const skill = node.dataset.skill;
      pulseSkillNode(skill);
      const card = document.querySelector(`.skill-card[data-skill="${skill}"]`);
      if (card) card.classList.add('sense-active');
    });
    node.addEventListener('mouseleave', () => {
      const skill = node.dataset.skill;
      const card = document.querySelector(`.skill-card[data-skill="${skill}"]`);
      if (card) card.classList.remove('sense-active');
    });
  });

  // ---- NAV: scroll shrink + active link tracking ----
  const mainNav = document.getElementById('mainNav');
  const navLinkEls = document.querySelectorAll('.nav-links a, .mobile-menu a');
  const sections = document.querySelectorAll('section[id]');

  function onScroll() {
    mainNav.classList.toggle('scrolled', window.scrollY > 60);

    let current = '';
    sections.forEach(sec => {
      const rect = sec.getBoundingClientRect();
      if (rect.top <= 140 && rect.bottom >= 140) current = sec.id;
    });
    navLinkEls.forEach(a => {
      a.classList.toggle('active', a.getAttribute('href') === '#' + current);
    });
  }
  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

