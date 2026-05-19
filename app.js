const data = window.CATALOG_DATA || {
  hero: [],
  categories: [],
  sections: [],
  reviews: [],
};

const heroVisual = document.querySelector("[data-hero-visual]");
const heroDots = document.querySelector("[data-hero-dots]");
const categoriesRoot = document.querySelector("[data-categories]");
const sectionsRoot = document.querySelector("[data-sections]");
const reviewCard = document.querySelector("[data-review-card]");
const reviewsSection = document.querySelector("[data-reviews-section]");
const modal = document.querySelector(".image-modal");
const modalMedia = document.querySelector(".image-modal__media");
const modalImg = document.querySelector(".image-modal__img");
const modalCaption = document.querySelector(".image-modal__caption");
const modalPrevButton = document.querySelector(".image-modal__nav--prev");
const modalNextButton = document.querySelector(".image-modal__nav--next");
const closeButton = document.querySelector(".image-modal__close");
const piecesModal = document.querySelector(".pieces-modal");
const piecesModalCard = document.querySelector(".pieces-modal__card");
const piecesModalTitle = document.querySelector(".pieces-modal__title");
const piecesModalGrid = document.querySelector(".pieces-modal__grid");
const piecesCloseButton = document.querySelector(".pieces-modal__close");
const themeToggle = document.querySelector(".theme-toggle");
const themeColorMeta = document.querySelector('meta[name="theme-color"]');
const darkSchemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
let viewerItems = [];
let viewerIndex = 0;
let swipeStartX = 0;
let swipeStartY = 0;
let swipePointerId = null;
let swipeTracking = false;
let swipeMoved = false;
let lastSwipeAt = 0;
const swipeThreshold = 50;

modalImg.draggable = false;

const getStoredTheme = () => {
  try {
    const theme = localStorage.getItem("isla-theme");
    return theme === "dark" || theme === "light" ? theme : null;
  } catch {
    return null;
  }
};

const saveTheme = (theme) => {
  try {
    localStorage.setItem("isla-theme", theme);
  } catch {
    // Manual theme still works for the current page even if storage is blocked.
  }
};

const getEffectiveTheme = () =>
  document.documentElement.dataset.theme || (darkSchemeQuery.matches ? "dark" : "light");

const syncThemeControl = () => {
  const theme = getEffectiveTheme();
  const isDark = theme === "dark";
  if (themeColorMeta) {
    themeColorMeta.content = isDark ? "#262522" : "#f6f0e8";
  }
  if (!themeToggle) return;
  themeToggle.setAttribute("aria-pressed", String(isDark));
  themeToggle.setAttribute(
    "aria-label",
    isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro",
  );
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  saveTheme(theme);
  syncThemeControl();
};

const initThemeToggle = () => {
  syncThemeControl();
  if (!themeToggle) return;

  themeToggle.addEventListener("click", () => {
    setTheme(getEffectiveTheme() === "dark" ? "light" : "dark");
  });

  const onSchemeChange = () => {
    if (!getStoredTheme()) syncThemeControl();
  };

  if (darkSchemeQuery.addEventListener) {
    darkSchemeQuery.addEventListener("change", onSchemeChange);
  } else if (darkSchemeQuery.addListener) {
    darkSchemeQuery.addListener(onSchemeChange);
  }
};

const lowResSrc = (src) => src.replace(/(\.[a-z0-9]+)$/i, "_low.webp");
const ultraLowResSrc = (src) => src.replace(/(\.[a-z0-9]+)$/i, "_ultra_low.webp");

const getFullImageDelay = () => {
  const connection =
    navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection?.saveData) return 3500;
  if (connection?.effectiveType === "slow-2g" || connection?.effectiveType === "2g") {
    return 2500;
  }
  if (connection?.effectiveType === "3g") return 900;
  return 0;
};

const scheduleFullImageLoad = (callback) => {
  const delay = getFullImageDelay();
  if (delay) {
    window.setTimeout(callback, delay);
    return;
  }
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1200 });
    return;
  }
  window.setTimeout(callback, 0);
};

const preloadImage = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.onload = () => resolve();
    image.onerror = () => resolve();
    image.src = src;
  });

const collectPreloadGroups = () => {
  const seen = new Set();
  const createGroup = () => [];
  const add = (group, src) => {
    if (src && !seen.has(src)) {
      seen.add(src);
      group.push(src);
    }
  };

  const aboveFold = createGroup();
  const sectionLeads = createGroup();
  const reviewFaces = createGroup();
  const rest = createGroup();

  data.hero.forEach((item) => add(aboveFold, item.src));
  data.categories.forEach((category) => add(aboveFold, category.icon));

  data.sections.forEach((section) => {
    section.items.slice(0, 2).forEach((item) => add(sectionLeads, item.src));
  });

  data.reviews.forEach((review) => add(reviewFaces, review.image));

  data.sections.forEach((section) => {
    section.items.forEach((item) => add(rest, item.src));
  });
  data.categories.forEach((category) => {
    category.items.forEach((item) => add(rest, item.src));
  });

  return {
    priority: [aboveFold, sectionLeads, reviewFaces, rest],
    all: [...aboveFold, ...sectionLeads, ...reviewFaces, ...rest],
  };
};

const runInIdle = (callback) => {
  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(callback, { timeout: 1500 });
    return;
  }
  window.setTimeout(callback, 0);
};

const preloadBackgroundImages = () => {
  const { priority, all: sources } = collectPreloadGroups();
  if (!sources.length) return;

  const stages = [
    ...priority.map((group) => group.map((src) => ultraLowResSrc(src))),
    sources.map((src) => lowResSrc(src)),
    sources,
  ];

  const preloadStage = (stageIndex) => {
    if (stageIndex >= stages.length) return;

    const queue = [...new Set(stages[stageIndex])];
    let cursor = 0;

    const pump = (deadline) => {
      while (cursor < queue.length) {
        if (deadline && typeof deadline.timeRemaining === "function" && deadline.timeRemaining() < 8) {
          runInIdle(() => pump());
          return;
        }

        preloadImage(queue[cursor]);
        cursor += 1;
      }

      preloadStage(stageIndex + 1);
    };

    runInIdle((deadline) => pump(deadline));
  };

  preloadStage(0);
};

const setSteppedImageSource = (img, src) =>
  new Promise((resolve) => {
    const loadFull = () => {
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = src;
    };

    const loadLow = () => {
      img.onload = () => scheduleFullImageLoad(loadFull);
      img.onerror = () => scheduleFullImageLoad(loadFull);
      img.src = lowResSrc(src);
    };

    img.onload = loadLow;
    img.onerror = loadLow;
    img.src = ultraLowResSrc(src);
  });

const createProgressiveImage = (src, alt = "", className = "", options = {}) => {
  const frame = document.createElement("span");
  frame.className = ["progressive-image", className].filter(Boolean).join(" ");

  const ultraImage = document.createElement("img");
  ultraImage.alt = alt;
  ultraImage.decoding = "async";
  ultraImage.className = "progressive-image__img progressive-image__img--ultra";
  if (options.loading) ultraImage.loading = options.loading;
  if (options.fetchPriority) ultraImage.fetchPriority = options.fetchPriority;

  const lowImage = document.createElement("img");
  lowImage.alt = "";
  lowImage.decoding = "async";
  lowImage.className = "progressive-image__img progressive-image__img--low";
  lowImage.setAttribute("aria-hidden", "true");
  if (options.loading) lowImage.loading = options.loading;
  if (options.fetchPriority) lowImage.fetchPriority = options.fetchPriority;

  const fullImage = document.createElement("img");
  fullImage.alt = "";
  fullImage.decoding = "async";
  fullImage.className = "progressive-image__img progressive-image__img--full";
  fullImage.setAttribute("aria-hidden", "true");
  if (options.loading) fullImage.loading = options.loading;
  if (options.fetchPriority) fullImage.fetchPriority = options.fetchPriority;

  const loadFull = () => {
    scheduleFullImageLoad(() => {
      fullImage.src = src;
    });
  };

  ultraImage.onload = () => {
    lowImage.src = lowResSrc(src);
  };
  ultraImage.onerror = () => {
    ultraImage.onerror = null;
    lowImage.src = lowResSrc(src);
  };
  lowImage.onload = () => {
    frame.classList.add("is-low-loaded");
    loadFull();
  };
  lowImage.onerror = () => {
    lowImage.onerror = null;
    loadFull();
  };
  fullImage.onload = () => {
    frame.classList.add("is-full-loaded");
  };
  fullImage.onerror = () => {
    frame.classList.add("is-full-loaded");
  };

  frame.append(ultraImage, lowImage, fullImage);
  ultraImage.src = ultraLowResSrc(src);
  return frame;
};

const syncViewer = () => {
  if (!viewerItems.length) return;

  const item = viewerItems[viewerIndex];
  modalImg.src = item.src;
  modalImg.alt = item.name || "";
  modalCaption.textContent = item.name || "";

  const hasMultiple = viewerItems.length > 1;
  modalPrevButton.hidden = !hasMultiple;
  modalNextButton.hidden = !hasMultiple;
};

const showPreviousImage = () => {
  if (!viewerItems.length) return;
  viewerIndex = (viewerIndex - 1 + viewerItems.length) % viewerItems.length;
  syncViewer();
};

const showNextImage = () => {
  if (!viewerItems.length) return;
  viewerIndex = (viewerIndex + 1) % viewerItems.length;
  syncViewer();
};

const startSwipe = (x, y, pointerId = null) => {
  if (viewerItems.length < 2) return;
  swipePointerId = pointerId;
  swipeStartX = x;
  swipeStartY = y;
  swipeTracking = true;
  swipeMoved = false;
};

const updateSwipe = (x, y) => {
  if (!swipeTracking) return { deltaX: 0, deltaY: 0 };

  const deltaX = x - swipeStartX;
  const deltaY = y - swipeStartY;
  if (Math.abs(deltaX) > 8 || Math.abs(deltaY) > 8) {
    swipeMoved = true;
  }

  return { deltaX, deltaY };
};

const finishSwipe = (x, y) => {
  if (!swipeTracking) return;

  const now = Date.now();
  const { deltaX, deltaY } = updateSwipe(x, y);
  const isHorizontalSwipe =
    Math.abs(deltaX) >= swipeThreshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.2;

  if (isHorizontalSwipe && now - lastSwipeAt > 350) {
    if (deltaX < 0) {
      showNextImage();
    } else {
      showPreviousImage();
    }
    lastSwipeAt = now;
  }

  swipeTracking = false;
  swipePointerId = null;
};

const cancelSwipe = () => {
  swipeTracking = false;
  swipePointerId = null;
};

const createElement = (tag, className, text) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text) element.textContent = text;
  return element;
};

const openModal = (items, index = 0) => {
  viewerItems = items;
  viewerIndex = index;
  syncViewer();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closeModal = () => {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  if (!piecesModal.classList.contains("is-open")) {
    document.body.classList.remove("modal-open");
  }
  modalImg.src = "";
  modalImg.alt = "";
  modalCaption.textContent = "";
  viewerItems = [];
  viewerIndex = 0;
};

const openPiecesModal = (category) => {
  piecesModalTitle.textContent = category.title;
  piecesModalGrid.innerHTML = "";

  category.items.forEach((item, index) => {
    const card = createElement("article", "product-card pieces-card");
    const image = createProgressiveImage(item.src, item.name, "openable-image", {
      loading: "lazy",
    });
    image.addEventListener("click", () => openModal(category.items, index));
    card.appendChild(image);
    card.appendChild(createElement("h3", "", item.name));
    piecesModalGrid.appendChild(card);
  });

  piecesModal.classList.add("is-open");
  piecesModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
};

const closePiecesModal = () => {
  piecesModal.classList.remove("is-open");
  piecesModal.setAttribute("aria-hidden", "true");
  if (!modal.classList.contains("is-open")) {
    document.body.classList.remove("modal-open");
  }
  piecesModalGrid.innerHTML = "";
};

const renderHero = () => {
  if (!heroVisual || !data.hero.length) return;

  const loadPromises = data.hero.map((image, index) => {
    const img = document.createElement("img");
    img.alt = image.name;
    img.decoding = "async";
    img.loading = "eager";
    img.fetchPriority = "high";
    img.className = `hero__image${index === 0 ? " is-active" : ""}`;

    const loadPromise = setSteppedImageSource(img, image.src).then(() => {
      img.dataset.ready = "true";
    });
    heroVisual.appendChild(img);

    const dot = document.createElement("span");
    if (index === 0) dot.classList.add("active");
    heroDots.appendChild(dot);
    return loadPromise;
  });

  if (data.hero.length < 2) return;

  Promise.all(loadPromises).then(() => {
    let activeIndex = 0;
    const images = heroVisual.querySelectorAll(".hero__image");
    const dots = heroDots.querySelectorAll("span");

    window.setInterval(() => {
      images[activeIndex].classList.remove("is-active");
      dots[activeIndex].classList.remove("active");
      activeIndex = (activeIndex + 1) % images.length;
      images[activeIndex].classList.add("is-active");
      dots[activeIndex].classList.add("active");
    }, 4500);
  });
};

const renderCategories = () => {
  if (!categoriesRoot) return;
  const categories = data.categories || [];
  if (!categories.length) {
    categoriesRoot.hidden = true;
    return;
  }

  categories.forEach((category) => {
    const button = createElement("button", "category");
    button.type = "button";
    button.setAttribute("aria-label", `Ver piezas de ${category.title}`);

    const img = createProgressiveImage(category.icon, category.title, "", {
      loading: "lazy",
    });

    button.appendChild(img);
    button.appendChild(createElement("span", "", category.title));
    button.addEventListener("click", () => openPiecesModal(category));
    categoriesRoot.appendChild(button);
  });
};

const updateCarouselButtons = (track, previousButton, nextButton) => {
  const hasOverflow = track.scrollWidth > track.clientWidth + 2;
  previousButton.hidden = !hasOverflow || track.scrollLeft <= 2;
  nextButton.hidden =
    !hasOverflow || track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
};

const scrollCarousel = (track, direction) => {
  const distance = track.clientWidth * 0.9 * direction;
  track.scrollBy({ left: distance, behavior: "smooth" });
};

const renderSections = () => {
  if (!sectionsRoot) return;

  data.sections.forEach((section) => {
    const sectionElement = createElement("section", "catalog-section");
    sectionElement.id = section.id;

    const header = createElement("div", "section-head");
    const titleGroup = createElement("div", "section-head__copy");
    const titleRow = createElement("div", "section-title-row");
    const collectionButton = createElement("button", "collection-open-button", "+");
    collectionButton.type = "button";
    collectionButton.setAttribute("aria-label", `Abrir colección ${section.title}`);
    collectionButton.addEventListener("click", () => openPiecesModal(section));

    titleRow.append(collectionButton, createElement("h2", "", section.title));
    titleGroup.appendChild(titleRow);
    if (section.message) {
      titleGroup.appendChild(createElement("p", "", section.message));
    }
    header.appendChild(titleGroup);

    const carousel = createElement("div", "catalog-carousel");
    const previousButton = createElement("button", "carousel-button carousel-button--prev", "‹");
    const nextButton = createElement("button", "carousel-button carousel-button--next", "›");
    const track = createElement("div", "catalog-track");

    previousButton.type = "button";
    nextButton.type = "button";
    previousButton.setAttribute("aria-label", `Ver anteriores en ${section.title}`);
    nextButton.setAttribute("aria-label", `Ver más en ${section.title}`);

    section.items.forEach((item, index) => {
      const card = createElement("article", "product-card");
      const img = createProgressiveImage(item.src, item.name, "openable-image", {
        loading: "lazy",
      });
      img.addEventListener("click", () => openModal(section.items, index));

      card.appendChild(img);
      card.appendChild(createElement("h3", "", item.name));
      track.appendChild(card);
    });

    previousButton.addEventListener("click", () => scrollCarousel(track, -1));
    nextButton.addEventListener("click", () => scrollCarousel(track, 1));
    track.addEventListener("scroll", () =>
      updateCarouselButtons(track, previousButton, nextButton),
    );

    carousel.append(previousButton, track, nextButton);
    sectionElement.append(header, carousel);
    sectionsRoot.appendChild(sectionElement);

    requestAnimationFrame(() =>
      updateCarouselButtons(track, previousButton, nextButton),
    );
    window.addEventListener("resize", () =>
      updateCarouselButtons(track, previousButton, nextButton),
    );
  });
};

const renderReviews = () => {
  if (!reviewCard || !data.reviews.length) {
    reviewsSection.hidden = true;
    return;
  }

  let activeIndex = 0;
  let autoplayTimer = null;

  const stopAutoplay = () => {
    if (autoplayTimer) {
      window.clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
  };

  const paint = () => {
    const review = data.reviews[activeIndex];
    reviewCard.innerHTML = "";

    const previousButton = createElement("button", "testimonial__nav", "‹");
    const nextButton = createElement("button", "testimonial__nav", "›");
    previousButton.type = "button";
    nextButton.type = "button";
    previousButton.setAttribute("aria-label", "Reseña anterior");
    nextButton.setAttribute("aria-label", "Siguiente reseña");

    const img = createProgressiveImage(review.image, review.person, "", {
      loading: "lazy",
    });

    const content = createElement("div", "testimonial__content");
    content.appendChild(createElement("div", "stars", "★".repeat(review.stars || 5)));
    content.appendChild(createElement("p", "", `"${review.review}"`));
    const nameLine = review.location
      ? `— ${review.person}, ${review.location}`
      : `— ${review.person}`;
    content.appendChild(createElement("strong", "", nameLine));

    previousButton.addEventListener("click", () => {
      activeIndex = (activeIndex - 1 + data.reviews.length) % data.reviews.length;
      paint();
    });
    nextButton.addEventListener("click", () => {
      activeIndex = (activeIndex + 1) % data.reviews.length;
      paint();
    });

    const media = createElement("div", "testimonial__media");
    media.append(previousButton, img, nextButton);

    reviewCard.append(media, content);
    previousButton.hidden = data.reviews.length < 2;
    nextButton.hidden = data.reviews.length < 2;
  };

  paint();

  if (data.reviews.length > 1) {
    autoplayTimer = window.setInterval(() => {
      activeIndex = (activeIndex + 1) % data.reviews.length;
      paint();
    }, 4500);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopAutoplay();
      return;
    }
    if (!autoplayTimer && data.reviews.length > 1) {
      autoplayTimer = window.setInterval(() => {
        activeIndex = (activeIndex + 1) % data.reviews.length;
        paint();
      }, 4500);
    }
  });
};

closeButton.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
modalPrevButton.addEventListener("click", showPreviousImage);
modalNextButton.addEventListener("click", showNextImage);
modalMedia.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "touch" || event.button > 0) return;
  startSwipe(event.clientX, event.clientY, event.pointerId);
  if (modalMedia.setPointerCapture) {
    modalMedia.setPointerCapture(event.pointerId);
  }
});
modalMedia.addEventListener("pointermove", (event) => {
  if (!swipeTracking || event.pointerId !== swipePointerId) return;
  updateSwipe(event.clientX, event.clientY);
});
modalMedia.addEventListener("pointerup", (event) => {
  if (!swipeTracking || event.pointerId !== swipePointerId) return;
  finishSwipe(event.clientX, event.clientY);
});
modalMedia.addEventListener("pointercancel", cancelSwipe);
modalMedia.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    startSwipe(touch.clientX, touch.clientY);
  },
  { passive: true },
);
modalMedia.addEventListener(
  "touchmove",
  (event) => {
    if (!swipeTracking || event.touches.length !== 1) return;
    const touch = event.touches[0];
    const { deltaX, deltaY } = updateSwipe(touch.clientX, touch.clientY);
    if (Math.abs(deltaX) > 8 && Math.abs(deltaX) > Math.abs(deltaY)) {
      event.preventDefault();
    }
  },
  { passive: false },
);
modalMedia.addEventListener("touchend", (event) => {
  if (!swipeTracking || event.changedTouches.length < 1) return;
  const touch = event.changedTouches[0];
  finishSwipe(touch.clientX, touch.clientY);
});
modalMedia.addEventListener("touchcancel", cancelSwipe);
modalMedia.addEventListener("click", (event) => {
  if (!swipeMoved) return;
  event.preventDefault();
  swipeMoved = false;
});
piecesCloseButton.addEventListener("click", closePiecesModal);
piecesModalCard.addEventListener("click", (event) => {
  event.stopPropagation();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
  if (event.key === "ArrowLeft" && modal.classList.contains("is-open")) {
    modalPrevButton.click();
  }
  if (event.key === "ArrowRight" && modal.classList.contains("is-open")) {
    modalNextButton.click();
  }
  if (event.key === "Escape" && piecesModal.classList.contains("is-open")) {
    closePiecesModal();
  }
});

initThemeToggle();
renderHero();
renderCategories();
renderSections();
renderReviews();
runInIdle(preloadBackgroundImages);
