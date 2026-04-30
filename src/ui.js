import { escapeHtml, findBrand, findProfile, formatCategories, formatJobStatus, initials } from "./utils.js";

function emptyState(title, text) {
  return `
    <article class="empty-state">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(text)}</p>
    </article>
  `;
}

function icon(name) {
  const icons = {
    bell: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3.75a4.25 4.25 0 0 0-4.25 4.25v1.11c0 .77-.22 1.53-.63 2.18L5.8 13.3a1.75 1.75 0 0 0 1.49 2.7h9.42a1.75 1.75 0 0 0 1.49-2.7l-1.32-2.01a4.1 4.1 0 0 1-.63-2.18V8A4.25 4.25 0 0 0 12 3.75Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/>
        <path d="M9.75 18a2.25 2.25 0 0 0 4.5 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.7"/>
      </svg>
    `,
    plus: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/>
      </svg>
    `,
    send: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m4 12 15-7-3 7 3 7-15-7Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.7"/>
        <path d="M16 12H5" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.7"/>
      </svg>
    `,
    edit: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m14.25 5.25 4.5 4.5M5.25 18.75l3.42-.76a2 2 0 0 0 .97-.53L18 9.1a1.5 1.5 0 0 0 0-2.12l-.98-.98a1.5 1.5 0 0 0-2.12 0l-8.36 8.36a2 2 0 0 0-.53.97l-.76 3.42Z" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/>
      </svg>
    `,
    user: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.7"/>
      </svg>
    `,
    close: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.8"/>
      </svg>
    `,
    image: `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="14" rx="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/>
        <path d="m7.5 15.5 3.4-3.4a1 1 0 0 1 1.4 0l1.7 1.7a1 1 0 0 0 1.4 0l1.1-1.1a1 1 0 0 1 1.4 0l1.1 1.1" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.7"/>
        <circle cx="9" cy="9" r="1.25" fill="currentColor"/>
      </svg>
    `
  };

  return icons[name] || "";
}

export function renderAppShell(root) {
  root.innerHTML = `
    <div class="app-shell">
      <main id="page-view"></main>
      <div id="modal-root"></div>
      <div id="toast" class="toast hidden"></div>
    </div>
  `;
}

export function renderAuthPage() {
  return `
    <section class="auth-screen">
      <div class="auth-editorial reveal">
        <span class="eyebrow">ModelLink</span>
        <h1>Fashion networking with a portfolio-first experience.</h1>
        <p>Build your public presence, post fresh work, manage castings, and keep conversations moving in realtime.</p>
        <div class="feature-strip">
          <article><strong>Portfolio profiles</strong><span>Cleaner personal pages designed like a visual social platform.</span></article>
          <article><strong>Realtime hiring</strong><span>Messaging, job requests, and profile updates stay synced instantly.</span></article>
          <article><strong>Global discovery</strong><span>Search talent and brands by location, niche, and visual style.</span></article>
        </div>
      </div>
      <div class="auth-card reveal">
        <div class="auth-card__header">
          <span class="eyebrow">Member Access</span>
          <h2>Step into your network</h2>
        </div>
        <div class="auth-tabs">
          <button class="tab is-active" data-auth-tab="login" type="button">Login</button>
          <button class="tab" data-auth-tab="signup" type="button">Create account</button>
        </div>
        <form id="login-form" class="form-stack">
          <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label>
          <label>Password<input name="password" type="password" required placeholder="Password" /></label>
          <button class="button button--primary" type="submit">Login</button>
        </form>
        <form id="signup-form" class="form-stack hidden">
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" minlength="6" required /></label>
          <label>Role
            <select name="role" required>
              <option value="model">Model</option>
              <option value="brand">Brand / Agency</option>
            </select>
          </label>
          <div class="role-fields">
            <label>Display name<input name="displayName" type="text" required /></label>
            <label>Location<input name="location" type="text" placeholder="City, Country" /></label>
            <label>Bio<textarea name="bio" rows="3"></textarea></label>
            <label>Categories<input name="categories" type="text" placeholder="Fashion, Product, Fitness" /></label>
          </div>
          <button class="button button--primary" type="submit">Create account</button>
        </form>
      </div>
    </section>
  `;
}

export function renderDashboardLayout({ session, routeName, pageContent }) {
  return `
    <div class="site-shell">
      <header class="site-header reveal is-visible">
        <div class="brand-lockup">
          <button class="brand-mark" data-route="home" type="button" aria-label="ModelLink home">ML</button>
          <div class="brand-copy">
            <span class="eyebrow">Global Modeling Network</span>
            <strong>ModelLink</strong>
          </div>
        </div>
        <nav class="site-nav">
          ${navItem("home", "Home", routeName)}
          ${navItem("discover", "Discover", routeName)}
          ${navItem("jobs", "Jobs", routeName)}
          ${navItem("messages", "Messages", routeName)}
          ${navItem("profile", "Profile", routeName)}
        </nav>
        <div class="site-tools">
          <div class="search-shell">
            <input id="global-search" type="search" placeholder="Search models, brands, locations..." />
            <div id="search-results-panel" class="floating-panel"></div>
          </div>
          <div class="topbar-actions">
            <button class="user-chip" data-toggle="user-menu" type="button" aria-label="User menu">
              <span>${escapeHtml(initials(session.displayName || session.email))}</span>
            </button>
            <div id="user-menu-panel" class="floating-panel floating-panel--right"></div>
          </div>
        </div>
      </header>
      <main class="site-main">${pageContent}</main>
    </div>
  `;
}

export function renderFeedPage({ session, posts, jobs, models, brands }) {
  const latestPosts = posts.slice(0, 2);
  const spotlightModels = models.slice(0, 4);
  const spotlightBrands = brands.slice(0, 2);

  return `
    <section class="page-stack">
      <article class="hero-panel hero-panel--compact reveal">
        <div class="hero-panel__copy">
          <span class="eyebrow">Home Feed</span>
          <h1>Stay visible, post recent work, and move from discovery to booking faster.</h1>
          <p>A cleaner social-style feed with sharper spacing, compact cards, and a faster publishing flow.</p>
          <div class="hero-actions">
            <button class="button button--primary" data-open-create-post type="button">${icon("plus")} <span>Create Post</span></button>
            <button class="button button--ghost" data-route="discover" type="button">Explore Talent</button>
          </div>
        </div>
        <div class="hero-stats">
          ${metricCard(String(posts.length), "Live posts")}
          ${metricCard(String(models.length), "Models")}
          ${metricCard(String(jobs.length), "Open jobs")}
          ${metricCard(session.role === "brand" ? "Brand" : "Model", "Workspace")}
        </div>
      </article>

      <section class="latest-strip reveal">
        <div class="section-shell__header">
          <div>
            <span class="eyebrow">Latest Posts</span>
            <h2>Fresh activity from the network</h2>
          </div>
        </div>
        <div class="latest-posts-grid">
          ${
            latestPosts.length
              ? latestPosts.map((post) => renderLatestPostCard(post, models, brands)).join("")
              : emptyState("No posts yet", "Publish the first post to start the live stream.")
          }
        </div>
      </section>

      <section class="content-grid">
        <div class="content-main">
          <article class="section-shell reveal">
            <div class="section-shell__header">
              <div>
                <span class="eyebrow">All Posts</span>
                <h2>Compact feed</h2>
              </div>
              <button class="button button--secondary" data-open-create-post type="button">${icon("plus")} <span>Add Post</span></button>
            </div>
          </article>
          ${
            posts.length
              ? posts.map((post) => renderPostCard(post, models, brands)).join("")
              : emptyState("No posts yet", "Create the first live post to start the network feed.")
          }
        </div>

        <aside class="content-rail">
          <article class="rail-card reveal">
            <div class="section-shell__header">
              <div>
                <span class="eyebrow">Casting Board</span>
                <h3>Latest job calls</h3>
              </div>
              <button class="button button--ghost" data-route="jobs" type="button">View all</button>
            </div>
            <div class="stack-list">
              ${jobs.length ? jobs.slice(0, 3).map((job) => renderCompactJob(job, brands)).join("") : `<p class="muted-copy">No jobs have been posted yet.</p>`}
            </div>
          </article>

          <article class="rail-card reveal">
            <div class="section-shell__header">
              <div>
                <span class="eyebrow">Talent Spotlight</span>
                <h3>Profiles to watch</h3>
              </div>
            </div>
            <div class="stack-list">
              ${spotlightModels.length ? spotlightModels.map((model) => renderProfileLinkCard(model, model.categories?.[0] || "Model")).join("") : `<p class="muted-copy">New model profiles will appear here.</p>`}
            </div>
          </article>

          <article class="rail-card reveal">
            <div class="section-shell__header">
              <div>
                <span class="eyebrow">Brands</span>
                <h3>Active companies</h3>
              </div>
            </div>
            <div class="stack-list">
              ${spotlightBrands.length ? spotlightBrands.map((brand) => renderProfileLinkCard(brand, brand.industry || "Brand")).join("") : `<p class="muted-copy">Brand and agency accounts will show here.</p>`}
            </div>
          </article>
        </aside>
      </section>
    </section>
  `;
}

export function renderDiscoverPage({ models, filters }) {
  return `
    <section class="page-stack">
      <article class="page-banner reveal">
        <div>
          <span class="eyebrow">Discover</span>
          <h1>Browse talent through a cleaner, editorial portfolio grid.</h1>
          <p>Filter by category or location and open any profile to review images, details, and direct contact actions.</p>
        </div>
      </article>
      <form id="discover-filters" class="filter-bar reveal">
        <label>
          Category
          <select name="category">
            ${["All", "Fashion", "Product", "Fitness", "Editorial", "Commercial", "Beauty", "Runway"].map((item) => `<option value="${item}" ${filters.category === item ? "selected" : ""}>${item}</option>`).join("")}
          </select>
        </label>
        <label>
          Location
          <input name="location" type="text" value="${escapeHtml(filters.location)}" placeholder="Search by city or country" />
        </label>
        <button class="button button--primary" type="submit">Apply Filters</button>
      </form>
      <div class="discover-grid">
        ${models.length ? models.map((model) => renderModelCard(model)).join("") : emptyState("No models found", "Profiles matching these filters will appear here.")}
      </div>
    </section>
  `;
}

export function renderMessagesPage({ chats, activeChat }) {
  return `
    <section class="page-stack">
      <article class="page-banner reveal">
        <div>
          <span class="eyebrow">Messages</span>
          <h1>Direct, readable conversations built for fast coordination.</h1>
          <p>Messages align naturally, scroll smoothly, and stay synced in realtime for both users.</p>
        </div>
      </article>
      <section class="messages-layout reveal">
        <div class="chat-list">
          <div class="section-shell__header">
            <div>
              <span class="eyebrow">Inbox</span>
              <h2>Conversations</h2>
            </div>
          </div>
          ${
            chats.length
              ? chats.map((chat) => `
                  <button class="chat-item ${activeChat?.id === chat.id ? "is-active" : ""}" data-chat-id="${escapeHtml(chat.id)}" type="button">
                    <strong>${escapeHtml(chat.participant)}</strong>
                    <span>${escapeHtml(chat.role)}</span>
                    <p>${escapeHtml(chat.preview || "Open the conversation to start chatting.")}</p>
                  </button>
                `).join("")
              : emptyState("No conversations yet", "Open a profile and start a direct conversation.")
          }
        </div>
        <div class="chat-window">
          <div class="chat-window__header">
            <div>
              <strong>${escapeHtml(activeChat?.participant || "Conversation")}</strong>
              <span>${escapeHtml(activeChat?.role || "Select a chat to begin")}</span>
            </div>
          </div>
          <div class="chat-thread" id="chat-thread">
            ${
              activeChat?.messages?.length
                ? activeChat.messages.map((message) => `
                    <div class="message-row ${message.sender === "You" ? "message-row--self" : "message-row--other"}">
                      <div class="message-bubble ${message.sender === "You" ? "message-bubble--self" : "message-bubble--other"}">
                        <span>${escapeHtml(message.sender)}</span>
                        <p>${escapeHtml(message.text)}</p>
                      </div>
                    </div>
                  `).join("")
                : emptyState("No messages yet", "Write the first message and it will appear for both participants in realtime.")
            }
          </div>
          <form id="message-form" class="chat-input">
            <input data-message-input name="message" type="text" placeholder="Write a message..." ${activeChat ? "" : "disabled"} />
            <button class="button button--primary button--icon" type="submit" ${activeChat ? "" : "disabled"}>${icon("send")} <span>Send</span></button>
          </form>
        </div>
      </section>
    </section>
  `;
}

export function renderJobsPage({ jobs, brands }) {
  return `
    <section class="page-stack">
      <article class="page-banner reveal">
        <div>
          <span class="eyebrow">Jobs</span>
          <h1>Manage every casting request and hiring status from one board.</h1>
          <p>Accept, reject, or leave requests pending while keeping a clean overview of the live casting pipeline.</p>
        </div>
      </article>
      <div class="jobs-list">
        ${
          jobs.length
            ? jobs.map((job) => {
                const brand = findBrand(brands, job.brandId);
                return `
                  <article class="job-card reveal">
                    <div class="job-card__main">
                      <div class="job-card__meta">
                        <span class="status-badge status-badge--${job.status.toLowerCase()}">${escapeHtml(formatJobStatus(job.status))}</span>
                        <span class="job-card__brand">${escapeHtml(brand?.name || "Independent Brand")}</span>
                      </div>
                      <h3>${escapeHtml(job.title)}</h3>
                      <p>${escapeHtml(job.description || "No description added yet.")}</p>
                      <div class="job-card__facts">
                        <span>${escapeHtml(job.budget || "Budget on request")}</span>
                        <span>${escapeHtml(job.locationType)}</span>
                      </div>
                    </div>
                    <div class="job-card__actions">
                      <button class="button button--ghost" data-job-id="${escapeHtml(job.id)}" data-job-status="Pending" type="button">Pending</button>
                      <button class="button button--secondary" data-job-id="${escapeHtml(job.id)}" data-job-status="Accepted" type="button">Accept</button>
                      <button class="button button--danger" data-job-id="${escapeHtml(job.id)}" data-job-status="Rejected" type="button">Reject</button>
                    </div>
                  </article>
                `;
              }).join("")
            : emptyState("No jobs yet", "Post the first live job request to populate this board.")
        }
      </div>
    </section>
  `;
}

export function renderModelProfilePage({ model, viewerRole, isOwnProfile }) {
  if (!model) {
    return emptyState("Profile not found", "This model profile has not been created in Firestore yet.");
  }

  return `
    <section class="page-stack profile-page profile-stack">
      <article class="profile-hero reveal">
        <img class="profile-hero__cover" src="${escapeHtml(model.coverImage)}" alt="${escapeHtml(model.name)} cover" />
        <div class="profile-hero__overlay"></div>
        <div class="profile-hero__content">
          <img class="profile-avatar" src="${escapeHtml(model.profileImage)}" alt="${escapeHtml(model.name)}" />
          <div class="profile-copy">
            <span class="eyebrow">Model Profile</span>
            <h1>${escapeHtml(model.name)}</h1>
            <p>${escapeHtml(model.location)}</p>
            <p>${escapeHtml(model.bio || "No bio added yet.")}</p>
            <div class="tag-row">${(model.categories || []).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
          </div>
          <div class="profile-actions">
            ${isOwnProfile ? `<button class="button button--primary button--icon" data-open-edit-profile type="button">${icon("edit")} <span>Edit Profile</span></button>` : ""}
            ${viewerRole === "brand" && !isOwnProfile ? `<button class="button button--primary" data-open-hire-modal type="button">Hire Model</button>` : ""}
            ${!isOwnProfile ? `<button class="button button--ghost" data-open-message type="button">Message</button>` : ""}
          </div>
        </div>
      </article>

      <section class="profile-summary reveal">
        <article class="profile-stat-card"><strong>${String(model.portfolio?.length || 0)}</strong><span>Portfolio</span></article>
        <article class="profile-stat-card"><strong>${String(model.categories?.length || 0)}</strong><span>Categories</span></article>
        <article class="profile-stat-card"><strong>${Object.keys(model.measurements || {}).length}</strong><span>Measurements</span></article>
      </section>

      <div class="profile-grid profile-grid--instagram">
        <article class="info-card reveal">
          <span class="eyebrow">Details</span>
          <h3>Measurements</h3>
          <div class="measurement-grid">
            ${
              Object.keys(model.measurements || {}).length
                ? Object.entries(model.measurements).map(([label, value]) => `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("")
                : emptyState("No measurements yet", "Add key measurements from the profile editor.")
            }
          </div>
        </article>

        <article class="info-card reveal">
          <div class="section-shell__header">
            <div>
              <span class="eyebrow">Portfolio</span>
              <h3>Grid gallery</h3>
            </div>
            ${isOwnProfile ? `<button class="button button--ghost button--icon" data-open-edit-profile type="button">${icon("image")} <span>Manage</span></button>` : ""}
          </div>
          <div class="portfolio-grid portfolio-grid--instagram">
            ${
              model.portfolio?.length
                ? model.portfolio.map((item) => `
                    <button class="portfolio-tile" data-lightbox-image="${escapeHtml(item.image)}" type="button">
                      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(model.name)} portfolio" />
                    </button>
                  `).join("")
                : emptyState("No portfolio yet", "Upload portfolio images to build the grid.")
            }
          </div>
        </article>
      </div>
    </section>
  `;
}

export function renderBrandProfilePage({ brand, isOwnProfile }) {
  if (!brand) {
    return emptyState("Profile not found", "This brand profile has not been created in Firestore yet.");
  }

  return `
    <section class="page-stack profile-page profile-stack">
      <article class="profile-hero reveal">
        <img class="profile-hero__cover" src="${escapeHtml(brand.banner)}" alt="${escapeHtml(brand.name)} banner" />
        <div class="profile-hero__overlay"></div>
        <div class="profile-hero__content">
          <img class="profile-avatar" src="${escapeHtml(brand.logo)}" alt="${escapeHtml(brand.name)} logo" />
          <div class="profile-copy">
            <span class="eyebrow">Brand Profile</span>
            <h1>${escapeHtml(brand.name)}</h1>
            <p>${escapeHtml(brand.industry)} | ${escapeHtml(brand.location)}</p>
            <p>${escapeHtml(brand.description || "No description added yet.")}</p>
          </div>
          <div class="profile-actions">
            ${isOwnProfile ? `<button class="button button--primary button--icon" data-open-edit-profile type="button">${icon("edit")} <span>Edit Profile</span></button>` : ""}
            ${isOwnProfile ? `<button class="button button--secondary" data-open-post-job type="button">Post Job</button>` : ""}
            ${!isOwnProfile ? `<button class="button button--ghost" data-open-message type="button">Message</button>` : ""}
          </div>
        </div>
      </article>

      <section class="profile-summary reveal">
        <article class="profile-stat-card"><strong>${escapeHtml(brand.industry || "Brand")}</strong><span>Industry</span></article>
        <article class="profile-stat-card"><strong>${escapeHtml(brand.location || "Global")}</strong><span>Location</span></article>
        <article class="profile-stat-card"><strong>Live</strong><span>Status</span></article>
      </section>

      <div class="profile-grid profile-grid--brand">
        <article class="info-card reveal">
          <span class="eyebrow">About</span>
          <h3>Company overview</h3>
          <p>${escapeHtml(brand.description || "No description added yet.")}</p>
        </article>
        <article class="info-card reveal">
          <span class="eyebrow">Visuals</span>
          <h3>Brand presence</h3>
          <div class="brand-visual-preview">
            <img src="${escapeHtml(brand.logo)}" alt="${escapeHtml(brand.name)} logo" />
            <img src="${escapeHtml(brand.banner)}" alt="${escapeHtml(brand.name)} banner" />
          </div>
        </article>
      </div>
    </section>
  `;
}

export function renderNotifications(items) {
  return `
    <div class="menu-card">
      <h4>Notifications</h4>
      ${items.length ? items.map((item) => `<p>${escapeHtml(item.title)} is ${escapeHtml(item.status.toLowerCase())}.</p>`).join("") : "<p>No live notifications yet.</p>"}
    </div>
  `;
}

export function renderUserMenu(session) {
  return `
    <div class="menu-card">
      <strong>${escapeHtml(session.displayName || session.email)}</strong>
      <p>${escapeHtml(session.role === "model" ? "Model workspace" : "Brand workspace")}</p>
      <button class="button button--ghost button--full button--icon" data-route="profile" type="button">${icon("user")} <span>Open Profile</span></button>
      <button class="button button--danger button--full" data-action="logout" type="button">Logout</button>
    </div>
  `;
}

export function renderSearchResults(results) {
  if (!results.length) {
    return `<div class="menu-card"><p>No matching profiles.</p></div>`;
  }

  return `
    <div class="menu-card">
      ${results.slice(0, 6).map((item) => `
        <button class="search-result" data-search-profile="${escapeHtml(item.id)}" type="button">
          <strong>${escapeHtml(item.name)}</strong>
          <span>${escapeHtml(item.role)} | ${escapeHtml(item.location)}</span>
        </button>
      `).join("")}
    </div>
  `;
}

export function renderEditProfileModal({ profile, role }) {
  const isModel = role === "model";
  const portfolio = profile.portfolio || [];
  const categories = isModel ? (profile.categories || []).join(", ") : "";
  const measurements = isModel ? profile.measurements || {} : {};

  return `
    <div class="modal-card modal-card--large">
      <div class="modal-header">
        <div>
          <span class="eyebrow">Edit Profile</span>
          <h3>${escapeHtml(profile.name || "Profile")}</h3>
        </div>
        <button class="icon-button" data-close-modal="true" type="button">${icon("close")}</button>
      </div>
      <form id="profile-details-form" class="form-stack">
        <div class="modal-grid">
          <label>Name<input name="name" type="text" required value="${escapeHtml(profile.name || "")}" /></label>
          <label>Location<input name="location" type="text" value="${escapeHtml(profile.location || "")}" /></label>
        </div>
        <label>${isModel ? "Bio" : "Description"}<textarea name="bio" rows="4">${escapeHtml(isModel ? profile.bio || "" : profile.description || "")}</textarea></label>
        ${
          isModel
            ? `
              <label>Categories
                <input name="categories" type="text" value="${escapeHtml(categories)}" placeholder="Fashion, Product, Beauty" />
              </label>
              <div class="modal-grid modal-grid--measurements">
                ${["height", "bust", "waist", "hips", "shoe", "hair", "eyes"].map((key) => `
                  <label>${escapeHtml(key)}
                    <input name="measurement-${escapeHtml(key)}" type="text" value="${escapeHtml(measurements[key] || "")}" />
                  </label>
                `).join("")}
              </div>
            `
            : `<label>Industry<input name="industry" type="text" value="${escapeHtml(profile.industry || "")}" /></label>`
        }
        <button class="button button--primary" type="submit">Save Details</button>
      </form>

      <section class="editor-media">
        <div class="section-shell__header">
          <div>
            <span class="eyebrow">Media</span>
            <h3>Images and cover visuals</h3>
          </div>
        </div>
        <div class="upload-grid">
          <form id="profile-photo-form" class="form-stack">
            <label>${isModel ? "Profile picture" : "Brand logo"}
              <input name="profileImage" type="file" accept="image/*" required />
            </label>
            <button class="button button--secondary" type="submit">Update Picture</button>
          </form>
          <form id="cover-photo-form" class="form-stack">
            <label>${isModel ? "Cover image" : "Brand banner"}
              <input name="coverImage" type="file" accept="image/*" required />
            </label>
            <button class="button button--secondary" type="submit">Update Cover</button>
          </form>
          ${
            isModel
              ? `
                <form id="portfolio-upload-form" class="form-stack">
                  <label>Portfolio image
                    <input name="portfolioImage" type="file" accept="image/*" required />
                  </label>
                  <button class="button button--primary" type="submit">Add Portfolio Image</button>
                </form>
              `
              : ""
          }
        </div>
        ${
          isModel
            ? `
              <div class="editor-gallery">
                ${portfolio.length ? portfolio.map((item) => `
                  <article class="editor-gallery__item">
                    <img src="${escapeHtml(item.image)}" alt="Portfolio item" />
                    <button class="button button--danger button--small" data-remove-portfolio="${escapeHtml(item.id)}" type="button">Remove</button>
                  </article>
                `).join("") : `<p class="muted-copy">Your portfolio grid is empty. Upload images to build it.</p>`}
              </div>
            `
            : ""
        }
      </section>
    </div>
  `;
}

export function openModal(content) {
  const modalRoot = document.getElementById("modal-root");
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-close-modal="true">
      <div class="modal-shell">
        ${content}
      </div>
    </div>
  `;
}

export function closeModal() {
  document.getElementById("modal-root").innerHTML = "";
}

export function showToast(message, tone = "default") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = `toast toast--${tone}`;
  window.setTimeout(() => {
    toast.className = "toast hidden";
  }, 2400);
}

function navItem(route, label, activeRoute) {
  return `
    <button class="nav-item ${route === activeRoute ? "is-active" : ""}" data-route="${route}" type="button">
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

function metricCard(value, label) {
  return `
    <article class="metric-card">
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </article>
  `;
}

function renderCompactJob(job, brands) {
  const brand = findBrand(brands, job.brandId);
  return `
    <article class="mini-card">
      <span class="mini-card__meta">${escapeHtml(brand?.name || "Independent Brand")}</span>
      <strong>${escapeHtml(job.title)}</strong>
      <p>${escapeHtml(job.budget || "Budget on request")} | ${escapeHtml(job.locationType)}</p>
    </article>
  `;
}

function renderProfileLinkCard(profile, label) {
  const image = profile.profileImage || profile.logo || "";
  return `
    <button class="profile-link-card" data-search-profile="${escapeHtml(profile.id)}" type="button">
      <img src="${escapeHtml(image)}" alt="${escapeHtml(profile.name)}" />
      <div>
        <strong>${escapeHtml(profile.name)}</strong>
        <span>${escapeHtml(label)}</span>
      </div>
    </button>
  `;
}

function renderLatestPostCard(post, models, brands) {
  const author = findProfile({ models, brands }, post.authorId, post.authorRole);
  return `
    <article class="latest-post-card">
      <div class="latest-post-card__meta">
        <strong>${escapeHtml(author?.name || "Unknown")}</strong>
        <span>${escapeHtml(post.timestamp)}</span>
      </div>
      <p>${escapeHtml(post.caption)}</p>
      ${post.image ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.caption)}" />` : ""}
    </article>
  `;
}

function renderPostCard(post, models, brands) {
  const author = findProfile({ models, brands }, post.authorId, post.authorRole);
  return `
    <article class="post-card post-card--compact reveal">
      <div class="post-card__header">
        <button class="author-chip" data-search-profile="${escapeHtml(post.authorId)}" type="button">
          <div class="avatar-circle">${escapeHtml(initials(author?.name || "U"))}</div>
          <div>
            <strong>${escapeHtml(author?.name || "Unknown")}</strong>
            <span>${escapeHtml(post.timestamp)}</span>
          </div>
        </button>
      </div>
      <p class="post-caption">${escapeHtml(post.caption)}</p>
      ${post.image ? `<img class="post-image" src="${escapeHtml(post.image)}" alt="${escapeHtml(post.caption)}" />` : ""}
      <div class="post-actions">
        <button class="button button--ghost" data-like-post="${escapeHtml(post.id)}" type="button">Like ${post.likes}</button>
        <button class="button button--ghost" data-comment-post="${escapeHtml(post.id)}" type="button">Comment ${post.comments}</button>
      </div>
    </article>
  `;
}

function renderModelCard(model) {
  return `
    <article class="model-card reveal" data-model-card="${escapeHtml(model.id)}">
      <div class="model-card__media">
        <img src="${escapeHtml(model.profileImage)}" alt="${escapeHtml(model.name)}" />
      </div>
      <div class="model-card__content">
        <div class="model-card__header">
          <h3>${escapeHtml(model.name)}</h3>
          <span>${escapeHtml(model.location)}</span>
        </div>
        <p>${escapeHtml(formatCategories(model.categories || []))}</p>
        <div class="tag-row">${(model.categories || []).slice(0, 3).map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>
      </div>
    </article>
  `;
}
