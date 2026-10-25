(() => {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Current year ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Header state ---------- */
  const header = document.getElementById("site-header");
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const brandEl = document.querySelector(".site-header .brand");
  const mainEl = document.getElementById("main");
  const footerEl = document.querySelector(".site-footer");
  let lastFocused = null;

  const setMenu = (open) => {
    if (!menuToggle || !mobileMenu) return;
    document.body.classList.toggle("menu-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileMenu.setAttribute("aria-hidden", String(!open));

    if (open) lastFocused = document.activeElement;

    if (mainEl) {
      if (open) mainEl.setAttribute("inert", "");
      else mainEl.removeAttribute("inert");
    }
    if (footerEl) {
      if (open) footerEl.setAttribute("inert", "");
      else footerEl.removeAttribute("inert");
    }
    if (brandEl) {
      if (open) brandEl.setAttribute("inert", "");
      else brandEl.removeAttribute("inert");
    }

    if (open) {
      mobileMenu.removeAttribute("inert");
      window.requestAnimationFrame(() => {
        const firstLink = mobileMenu.querySelector("a");
        if (firstLink) firstLink.focus({ preventScroll: true });
      });
    } else {
      mobileMenu.setAttribute("inert", "");
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus({ preventScroll: true });
      }
    }
  };

  if (mobileMenu) mobileMenu.setAttribute("inert", "");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      setMenu(!document.body.classList.contains("menu-open"));
    });
  }

  if (mobileMenu) {
    mobileMenu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false));
    });
  }

  document.addEventListener("keydown", (event) => {
    if (!document.body.classList.contains("menu-open")) return;

    if (event.key === "Escape") {
      setMenu(false);
      if (menuToggle) menuToggle.focus();
      return;
    }

    if (event.key !== "Tab" || !mobileMenu) return;

    const focusables = [
      menuToggle,
      ...mobileMenu.querySelectorAll("a[href], button:not([disabled])"),
    ].filter((el) => el && el.offsetParent !== null);

    if (!focusables.length) return;

    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (!focusables.includes(document.activeElement)) {
      event.preventDefault();
      (event.shiftKey ? last : first).focus();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 980 && document.body.classList.contains("menu-open")) {
      setMenu(false);
    }
  });

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll(".reveal");

  if ("IntersectionObserver" in window && !prefersReduced) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }
    );

    revealEls.forEach((el) => revealObserver.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Active nav link ---------- */
  const navLinks = Array.from(document.querySelectorAll(".desktop-nav a"));
  const pageSections = Array.from(document.querySelectorAll("main section[id]"));
  let navFrame = null;

  const updateActiveNav = () => {
    navFrame = null;
    if (!navLinks.length || !pageSections.length) return;

    const marker = window.scrollY + Math.min(window.innerHeight * 0.34, 360);
    let current = null;

    pageSections.forEach((section) => {
      if (section.getBoundingClientRect().top + window.scrollY <= marker) {
        current = section;
      }
    });

    navLinks.forEach((link) => {
      const isActive = current && link.getAttribute("href") === `#${current.id}`;
      link.classList.toggle("is-active", Boolean(isActive));
    });
  };

  const requestNavUpdate = () => {
    if (navFrame !== null) return;
    navFrame = window.requestAnimationFrame(updateActiveNav);
  };

  window.addEventListener("scroll", requestNavUpdate, { passive: true });
  window.addEventListener("resize", requestNavUpdate);
  updateActiveNav();

  /* ---------- Pitch builder ---------- */
  const whoInput = document.getElementById("pitch-who");
  const changeInput = document.getElementById("pitch-change");
  const askInput = document.getElementById("pitch-ask");
  const output = document.getElementById("pitch-output");
  const copyBtn = document.getElementById("copy-pitch");

  const escapeHTML = (str) =>
    str.replace(/[&<>"']/g, (char) => {
      const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
      return map[char];
    });

  let currentPitch = "";

  const renderPitch = () => {
    if (!output) return;

    const who = whoInput ? whoInput.value.trim() : "";
    const change = changeInput ? changeInput.value.trim() : "";
    const ask = askInput ? askInput.value.trim() : "";

    const whoHTML = who
      ? `<span class="hl">${escapeHTML(who)}</span>`
      : `<span class="ph">[who you help]</span>`;
    const changeHTML = change
      ? `<span class="hl">${escapeHTML(change)}</span>`
      : `<span class="ph">[what changes for them]</span>`;
    const askHTML = ask
      ? `<span class="hl">${escapeHTML(ask)}</span>`
      : `<span class="ph">[what you're asking for]</span>`;

    output.innerHTML = `I help ${whoHTML} ${changeHTML}. Most people explain the <em>what</em> — the pitches that land make the stakes impossible to ignore. That's the work we do together, and I'd love to start with ${askHTML}.`;

    currentPitch = `I help ${who || "[who you help]"} ${change || "[what changes for them]"}. Most people explain the what — the pitches that land make the stakes impossible to ignore. That's the work we do together, and I'd love to start with ${ask || "[what you're asking for]"}.`;
  };

  [whoInput, changeInput, askInput].forEach((input) => {
    if (input) input.addEventListener("input", renderPitch);
  });

  if (output) renderPitch();

  if (copyBtn) {
    copyBtn.addEventListener("click", async () => {
      const label = copyBtn.querySelector("span");
      if (!currentPitch) return;

      let copied = false;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(currentPitch);
          copied = true;
        }
      } catch (error) {
        copied = false;
      }

      if (!copied) {
        try {
          const area = document.createElement("textarea");
          area.value = currentPitch;
          area.setAttribute("readonly", "");
          area.style.position = "fixed";
          area.style.opacity = "0";
          document.body.appendChild(area);
          area.select();
          copied = document.execCommand("copy");
          document.body.removeChild(area);
        } catch (error) {
          copied = false;
        }
      }

      if (copied) {
        copyBtn.classList.add("is-copied");
        if (label) label.textContent = "Copied";
      } else {
        if (label) label.textContent = "Copy failed";
      }

      window.setTimeout(() => {
        copyBtn.classList.remove("is-copied");
        if (label) label.textContent = "Copy pitch";
      }, 2200);
    });
  }

  /* ---------- Subtle hero parallax ---------- */
  const heroVisual = document.querySelector(".hero-visual");
  const heroDisc = document.querySelector(".hero-disc");
  const orbit = document.querySelector(".orbit-badge");
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  if (heroVisual && heroDisc && orbit && finePointer && !prefersReduced) {
    heroVisual.addEventListener("pointermove", (event) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;

      heroDisc.style.transform = `translate(${x * -14}px, ${y * -12}px)`;
      orbit.style.transform = `translate(${x * 9}px, ${y * 8}px)`;
    });

    heroVisual.addEventListener("pointerleave", () => {
      heroDisc.style.transform = "";
      orbit.style.transform = "";
    });
  }
})();
