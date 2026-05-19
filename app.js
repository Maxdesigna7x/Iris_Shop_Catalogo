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
let viewerItems = [];
let viewerIndex = 0;

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
    const img = document.createElement("img");
    img.src = item.src;
    img.alt = item.name;
    img.className = "openable-image";
    img.addEventListener("click", () => openModal(category.items, index));
    card.appendChild(img);
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

  data.hero.forEach((image, index) => {
    const img = document.createElement("img");
    img.src = image.src;
    img.alt = image.name;
    img.className = `hero__image${index === 0 ? " is-active" : ""}`;
    heroVisual.appendChild(img);

    const dot = document.createElement("span");
    if (index === 0) dot.classList.add("active");
    heroDots.appendChild(dot);
  });

  if (data.hero.length < 2) return;

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

    const img = document.createElement("img");
    img.src = category.icon;
    img.alt = category.title;

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
    titleGroup.appendChild(createElement("h2", "", section.title));
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
      const img = document.createElement("img");
      img.src = item.src;
      img.alt = item.name;
      img.className = "openable-image";
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

    const img = document.createElement("img");
    img.src = review.image;
    img.alt = review.person;

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
modalPrevButton.addEventListener("click", () => {
  if (!viewerItems.length) return;
  viewerIndex = (viewerIndex - 1 + viewerItems.length) % viewerItems.length;
  syncViewer();
});
modalNextButton.addEventListener("click", () => {
  if (!viewerItems.length) return;
  viewerIndex = (viewerIndex + 1) % viewerItems.length;
  syncViewer();
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

renderHero();
renderCategories();
renderSections();
renderReviews();
