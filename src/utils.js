export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function uid(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function initials(value = "") {
  return String(value)
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0]?.toUpperCase() || "")
    .join("");
}

export function formatCategories(items = []) {
  return items.join(" | ");
}

export function formatJobStatus(status) {
  return status;
}

export function findBrand(brands, id) {
  return brands.find((item) => item.id === id);
}

export function findProfile({ models, brands }, id, role) {
  return role === "brand"
    ? brands.find((item) => item.id === id)
    : models.find((item) => item.id === id);
}

export function useRevealAnimations() {
  const items = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  items.forEach((item) => observer.observe(item));
}

export function asMillis(value) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value === "string") return new Date(value).getTime();
  return Number(value) || 0;
}

export function relativeTime(value) {
  const diff = Date.now() - asMillis(value);
  const hours = Math.max(1, Math.floor(diff / (1000 * 60 * 60)));
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function normalizeProfile(item) {
  if (item.role === "model") {
    return {
      id: item.id,
      source: item.source || "firebase",
      role: "model",
      name: item.name,
      location: item.location || "Location flexible",
      bio: item.bio || "",
      categories: item.categories || [],
      measurements: item.measurements || {},
      profileImage: item.profileImage || createProfileArtwork(item.name || "Model", "model").profileImage,
      coverImage: item.coverImage || createProfileArtwork(item.name || "Model", "model").coverImage,
      portfolio: item.portfolio || [],
      ownerUid: item.ownerUid || ""
    };
  }

  return {
    id: item.id,
    source: item.source || "firebase",
    role: "brand",
    name: item.name,
    industry: item.industry || "Brand / Agency",
    location: item.location || "Global",
    description: item.description || item.bio || "",
    logo: item.profileImage || item.logo || createProfileArtwork(item.name || "Brand", "brand").profileImage,
    banner: item.banner || item.coverImage || createProfileArtwork(item.name || "Brand", "brand").coverImage,
    ownerUid: item.ownerUid || ""
  };
}

export function normalizePost(item) {
  return {
    id: item.id,
    source: item.source || "firebase",
    authorId: item.authorId,
    authorRole: item.authorRole,
    image: item.image,
    caption: item.caption,
    likes: item.likes || 0,
    comments: item.comments || 0,
    timestamp: item.timestamp || relativeTime(item.createdAt)
  };
}

export function normalizeJob(item) {
  return {
    id: item.id,
    source: item.source || "firebase",
    title: item.title,
    brandId: item.brandId || "",
    modelId: item.modelId || "",
    budget: item.budget || "",
    locationType: item.locationType || "Remote",
    status: item.status || "Pending",
    description: item.description || "",
    createdAt: item.createdAt || null
  };
}

export function normalizeChat(item, currentUid = "") {
  const participants = item.participants || [];
  const other = participants.find((entry) => entry.uid !== currentUid) || participants[0] || null;

  return {
    id: item.id,
    source: item.source || "firebase",
    participant: other?.name || item.participant || "Conversation",
    role: other?.role || item.role || "",
    preview: item.preview || item.messages?.at(-1)?.text || "",
    messages: (item.messages || []).map((message) => ({
      ...message,
      sender:
        message.senderUid === currentUid
          ? "You"
          : participants.find((entry) => entry.uid === message.senderUid)?.name ||
            message.senderName ||
            "User"
    }))
  };
}

export function createProfileArtwork(name = "Profile", role = "model") {
  const palette =
    role === "model"
      ? { top: "#3a2c1a", bottom: "#121212", accent: "#d8b77a" }
      : { top: "#18302a", bottom: "#121212", accent: "#98c8aa" };
  const label = encodeURIComponent(initials(name) || "P");
  const title = encodeURIComponent(name);

  const profileImage = `data:image/svg+xml;utf8,
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.top}"/>
          <stop offset="100%" stop-color="${palette.bottom}"/>
        </linearGradient>
      </defs>
      <rect width="400" height="400" rx="200" fill="url(%23g)"/>
      <circle cx="200" cy="150" r="74" fill="${palette.accent}" opacity="0.18"/>
      <text x="200" y="228" fill="${palette.accent}" font-family="Arial, sans-serif" font-size="118" text-anchor="middle" font-weight="700">${label}</text>
    </svg>`.replace(/\s+/g, " ");

  const coverImage = `data:image/svg+xml;utf8,
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 520">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.top}"/>
          <stop offset="100%" stop-color="${palette.bottom}"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="520" fill="url(%23g)"/>
      <circle cx="1280" cy="120" r="120" fill="${palette.accent}" opacity="0.12"/>
      <circle cx="260" cy="390" r="180" fill="${palette.accent}" opacity="0.10"/>
      <text x="96" y="168" fill="${palette.accent}" font-family="Arial, sans-serif" font-size="84" font-weight="700">${title}</text>
    </svg>`.replace(/\s+/g, " ");

  return { profileImage, coverImage };
}
