const closeAnnouncement = document.getElementById("closeAnnouncement");
const announcement = document.querySelector(".announcement");
closeAnnouncement.addEventListener("click", () => announcement.style.display = "none");

const menuButton = document.getElementById("menuButton");
const navLinks = document.getElementById("navLinks");
menuButton.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", open);
});

document.querySelectorAll(".nav-links a").forEach((link) => {
  link.addEventListener("click", () => {
    document.querySelectorAll(".nav-links a").forEach((item) => item.classList.remove("active"));
    link.classList.add("active");
    navLinks.classList.remove("open");
  });
});

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const dateInput = document.getElementById("visitDate");
const checkOutInput = document.getElementById("checkOutDate");
dateInput.min = today.toISOString().split("T")[0];
dateInput.value = tomorrow.toISOString().split("T")[0];
checkOutInput.min = tomorrow.toISOString().split("T")[0];
checkOutInput.value = new Date(tomorrow.getTime() + 86400000).toISOString().split("T")[0];

const bookingForm = document.getElementById("bookingForm");
const modal = document.getElementById("bookingModal");
const modalSummary = document.getElementById("modalSummary");
const availabilityResult = document.getElementById("availabilityResult");
let activeTab = "tickets";
let promoApplied = false;
let pendingCheckoutPrice = null;
let pendingPackageName = "";

function formatDate(value) {
  return new Date(value + "T00:00:00").toLocaleDateString("en-MY", { day:"numeric", month:"long", year:"numeric" });
}

function guestsCount() {
  const value = document.getElementById("guestCount").value;
  if (value.includes("2 Adults, 2")) return 4;
  if (value.includes("2 Adults")) return value.includes("1 Child") ? 3 : 2;
  if (value.includes("5+")) return 5;
  return 1;
}

function calculatePrice() {
  const experience = document.getElementById("experience").value;
  const count = guestsCount();
  let base = 0;
  if (experience === "Water Park") base = 85 * count;
  if (experience === "Safari Experience") base = 105 * count;
  if (experience === "Resort Stay") base = 320;
  if (experience === "Adventure Combo") base = 288 * count;
  if (activeTab === "package") base = 288 * count;
  if (promoApplied) base = base * 0.8;
  return Math.round(base);
}

function roomConflict() {
  const start = dateInput.value;
  const end = checkOutInput.value;
  const room = document.getElementById("roomType").value;
  const bookedRanges = {
    "Garden View Room": [["2026-11-21","2026-11-23"]],
    "Safari View Suite": [["2026-11-22","2026-11-25"]],
    "Family Villa": [["2026-11-24","2026-11-27"]],
    "Ocean View Room": [["2026-11-25","2026-11-26"]]
  };
  if (!start || !end || end <= start) return true;
  return (bookedRanges[room] || []).some(([rangeStart, rangeEnd]) => start <= rangeEnd && end >= rangeStart);
}

function openModal(summary) {
  modalSummary.textContent = summary;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

function setTab(tab) {
  activeTab = tab;
  pendingCheckoutPrice = null;
  pendingPackageName = "";
  document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item.dataset.tab === tab));
  const experience = document.getElementById("experience");
  const stayFields = [document.getElementById("checkOutField"), document.getElementById("roomField")];
  if (tab === "stay") {
    experience.value = "Resort Stay";
    bookingForm.classList.add("stay-mode");
    stayFields.forEach((field) => field.hidden = false);
  } else {
    bookingForm.classList.remove("stay-mode");
    stayFields.forEach((field) => field.hidden = true);
    if (tab === "tickets") experience.value = "Adventure Combo";
    if (tab === "package") experience.value = "Adventure Combo";
  }
}

document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => setTab(tab.dataset.tab)));

bookingForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const source = document.getElementById("campaignSource").value;
  const guests = document.getElementById("guestCount").value;
  const experience = document.getElementById("experience").value;

  if (activeTab === "stay") {
    const conflict = roomConflict();
    if (conflict) {
      openModal(`${document.getElementById("roomType").value} · ${formatDate(dateInput.value)} to ${formatDate(checkOutInput.value)} · Conflict detected`);
      availabilityResult.className = "availability conflict";
      availabilityResult.innerHTML = '<span class="available-dot"></span><div><strong>Room clash detected</strong><small>Choose different dates or a room type</small></div>';
      document.getElementById("modalTitle").textContent = "Date conflict";
      document.getElementById("continueButton").textContent = "Choose other dates";
    } else {
      openModal(`${experience} · ${guests} · ${formatDate(dateInput.value)} to ${formatDate(checkOutInput.value)} · Source: ${source}`);
      availabilityResult.className = "availability";
      availabilityResult.innerHTML = '<span class="available-dot"></span><div><strong>Room available</strong><small>Instant confirmation</small></div>';
      pendingCheckoutPrice = calculatePrice();
      document.getElementById("modalTitle").textContent = "Stay confirmed";
      document.getElementById("continueButton").innerHTML = "Continue to booking <span>→</span>";
    }
    return;
  }

  openModal(`${experience} · ${guests} · ${formatDate(dateInput.value)} · Source: ${source}`);
  const price = calculatePrice();
  availabilityResult.className = "availability";
  availabilityResult.innerHTML = '<span class="available-dot"></span><div><strong>Tickets available</strong><small>Instant digital confirmation</small></div>';
  pendingCheckoutPrice = price;
  document.getElementById("modalTitle").textContent = "Your E-Ticket";
  document.getElementById("continueButton").innerHTML = "Continue to payment <span>→</span>";
});

document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeModal));
document.getElementById("continueButton").addEventListener("click", () => {
  const stored = {
    experience: pendingPackageName || document.getElementById("experience").value,
    date: formatDate(dateInput.value),
    guests: document.getElementById("guestCount").value,
    source: document.getElementById("campaignSource").value,
    price: pendingCheckoutPrice ?? calculatePrice()
  };
  if (document.getElementById("modalTitle").textContent === "Date conflict") {
    closeModal();
    return;
  }
  localStorage.setItem("escapeLandCheckout", JSON.stringify(stored));
  window.location.href = "checkout.html";
});

document.querySelectorAll("[data-experience]").forEach((button) => {
  button.addEventListener("click", () => {
    setTab(button.dataset.experience === "Resort Stay" ? "stay" : "tickets");
    document.getElementById("experience").value = button.dataset.experience;
    document.querySelector(".booking-panel").scrollIntoView({ behavior:"smooth", block:"center" });
  });
});

document.getElementById("applyPromo").addEventListener("click", () => {
  const input = document.getElementById("promoCode");
  const message = document.getElementById("promoMessage");
  if (input.value.trim().toUpperCase() === "ESCAPE20") {
    promoApplied = true;
    document.querySelectorAll(".bundle-card").forEach((card) => {
      const base = Number(card.dataset.price);
      card.querySelector("[data-base-price]").textContent = "RM " + Math.round(base * 0.8);
    });
    message.textContent = "ESCAPE20 applied — 20% saved";
    message.style.color = "#28764b";
  } else {
    promoApplied = false;
    message.textContent = "Code not recognised";
    message.style.color = "#a43b27";
  }
});

document.querySelectorAll(".bundle-select").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".bundle-card");
    setTab("package");
    pendingPackageName = card.dataset.package;
    pendingCheckoutPrice = Math.round(card.dataset.price * (promoApplied ? 0.8 : 1));
    document.getElementById("experience").value = "Adventure Combo";
    openModal(`${pendingPackageName} · 2 Adults, 1 Child · ${formatDate(dateInput.value)} · Estimated RM ${pendingCheckoutPrice}`);
    availabilityResult.className = "availability";
    availabilityResult.innerHTML = '<span class="available-dot"></span><div><strong>Bundle available</strong><small>Proceed to secure checkout</small></div>';
    document.getElementById("modalTitle").textContent = "Package selected";
    document.getElementById("continueButton").innerHTML = "Continue to payment <span>→</span>";
  });
});

const grid = document.getElementById("experienceGrid");
document.getElementById("nextCard").addEventListener("click", () => grid.appendChild(grid.firstElementChild));
document.getElementById("prevCard").addEventListener("click", () => grid.insertBefore(grid.lastElementChild, grid.firstElementChild));

const reviewModal = document.getElementById("reviewModal");
let selectedRating = 5;
document.getElementById("writeReviewButton").addEventListener("click", () => {
  reviewModal.classList.add("open");
  reviewModal.setAttribute("aria-hidden","false");
  document.body.style.overflow = "hidden";
});
document.querySelectorAll("[data-close-review]").forEach((button) => button.addEventListener("click", () => {
  reviewModal.classList.remove("open");
  reviewModal.setAttribute("aria-hidden","true");
  document.body.style.overflow = "";
}));
document.querySelectorAll(".star-picker button").forEach((button) => {
  button.addEventListener("click", () => {
    selectedRating = Number(button.dataset.rating);
    document.querySelectorAll(".star-picker button").forEach((item) => item.classList.toggle("active", Number(item.dataset.rating) <= selectedRating));
  });
});
document.querySelectorAll(".star-picker button").forEach((item) => item.classList.add("active"));

document.getElementById("reviewForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("reviewName").value.trim();
  const category = document.getElementById("reviewCategory").value;
  const comment = document.getElementById("reviewComment").value.trim();
  if (!name || !comment) return;
  const card = document.createElement("blockquote");
  card.className = "review-card";
  card.innerHTML = `<div class="stars">${"★".repeat(selectedRating)}${"☆".repeat(5 - selectedRating)}</div><p>“${comment.replace(/[<>]/g,"") }”</p><footer><span class="avatar">${name.slice(0,2).toUpperCase()}</span><div><strong>${name.replace(/[<>]/g,"")}</strong><small>${category} Guest</small></div></footer>`;
  document.getElementById("reviewList").prepend(card);
  event.target.reset();
  selectedRating = 5;
  document.querySelectorAll(".star-picker button").forEach((item) => item.classList.add("active"));
  reviewModal.classList.remove("open");
  document.body.style.overflow = "";
});

document.querySelectorAll(".portal-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".portal-tab").forEach((item) => item.classList.remove("active"));
    document.querySelectorAll(".portal-view").forEach((view) => view.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.portal).classList.add("active");
  });
});

document.getElementById("accountButton").addEventListener("click", () => {
  window.location.href = "staff-login.html";
});
