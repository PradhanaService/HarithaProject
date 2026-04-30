import {
  loginUser,
  logoutUser,
  signupUser,
  watchSession
} from "./auth.js";
import {
  createJob,
  createPost,
  findOrCreateChat,
  sendChatMessage,
  subscribeRealtimeData,
  addPortfolioImage,
  removePortfolioImage,
  updateUserDisplayName,
  updateProfileMedia,
  updateJobStatus,
  updatePostCounts,
  uploadImageFile
} from "./services/dataService.js";
import {
  closeModal,
  openModal,
  renderAppShell,
  renderAuthPage,
  renderBrandProfilePage,
  renderDashboardLayout,
  renderDiscoverPage,
  renderFeedPage,
  renderJobsPage,
  renderMessagesPage,
  renderModelProfilePage,
  renderEditProfileModal,
  renderSearchResults,
  renderUserMenu,
  showToast
} from "./ui.js";
import { createProfileArtwork, useRevealAnimations } from "./utils.js";

const state = {
  initialized: false,
  loading: true,
  session: null,
  models: [],
  brands: [],
  posts: [],
  jobs: [],
  chats: [],
  notificationsOpen: false,
  userMenuOpen: false,
  selectedChatId: "",
  discoverFilters: {
    category: "All",
    location: ""
  },
  searchQuery: "",
  profileFocusId: ""
};

let unsubscribeRealtime = null;

const appRoutes = new Set(["home", "discover", "messages", "jobs", "profile"]);

export function startApp() {
  const root = document.getElementById("app");
  renderAppShell(root);
  bindGlobalEvents();

  watchSession((session) => {
    state.session = session;
    state.loading = false;
    state.initialized = true;
    connectRealtime();
    route();
  });

  route();
}

function connectRealtime() {
  unsubscribeRealtime?.();
  unsubscribeRealtime = subscribeRealtimeData(
    state.session,
    (data) => {
      state.models = data.models;
      state.brands = data.brands;
      state.posts = data.posts;
      state.jobs = data.jobs;
      state.chats = data.chats;
      if (!state.chats.find((item) => item.id === state.selectedChatId)) {
        state.selectedChatId = state.chats[0]?.id || "";
      }
      route();
    },
    (error) => {
      console.error("Realtime subscription error.", error);
      showToast("Realtime sync failed. Check Firestore indexes and rules.", "error");
    }
  );
}

function route() {
  const { routeName, routeParam } = parseHash();
  const pageView = document.getElementById("page-view");

  if (!state.initialized || state.loading) {
    pageView.innerHTML = `
      <section class="auth-screen">
        <div class="auth-hero reveal is-visible">
          <span class="eyebrow">ModelLink</span>
          <h1>Connecting your workspace.</h1>
          <p>Loading Firebase session and realtime network data.</p>
        </div>
      </section>
    `;
    return;
  }

  if (!state.session) {
    pageView.innerHTML = renderAuthPage();
    bindAuthPage();
    useRevealAnimations();
    return;
  }

  pageView.innerHTML = renderDashboardLayout({
    session: state.session,
    routeName,
    pageContent: renderPageContent(routeName, routeParam)
  });

  bindDashboardEvents(routeName, routeParam);
  hydrateHeaderMenus();
  useRevealAnimations();
}

function renderPageContent(routeName, routeParam) {
  if (routeName === "discover") {
    return renderDiscoverPage({
      models: getFilteredModels(),
      filters: state.discoverFilters
    });
  }

  if (routeName === "messages") {
    const activeChat = state.chats.find((chat) => chat.id === state.selectedChatId) || null;
    return renderMessagesPage({
      chats: state.chats,
      activeChat
    });
  }

  if (routeName === "jobs") {
    return renderJobsPage({
      jobs: state.jobs,
      brands: state.brands
    });
  }

  if (routeName === "profile") {
    const targetId = routeParam || state.profileFocusId || state.session.profileId;
    const model = state.models.find((item) => item.id === targetId);
    if (model) {
      return renderModelProfilePage({
        model,
        viewerRole: state.session.role,
        isOwnProfile: state.session.profileId === model.id
      });
    }

    const brand = state.brands.find((item) => item.id === targetId);
    return renderBrandProfilePage({
      brand: brand || null,
      viewerRole: state.session.role,
      isOwnProfile: state.session.profileId === brand?.id
    });
  }

  return renderFeedPage({
    session: state.session,
    posts: state.posts,
    jobs: state.jobs,
    models: state.models,
    brands: state.brands
  });
}

function bindGlobalEvents() {
  window.addEventListener("hashchange", route);

  document.addEventListener("click", async (event) => {
    const logoutButton = event.target.closest("[data-action='logout']");
    if (logoutButton) {
      await logoutUser();
      state.session = null;
      unsubscribeRealtime?.();
      unsubscribeRealtime = null;
      window.location.hash = "#/auth";
      route();
      showToast("Signed out.");
      return;
    }

    const navLink = event.target.closest("[data-route]");
    if (navLink) {
      window.location.hash = `#/${navLink.dataset.route}`;
      return;
    }

    if (
      event.target.matches("[data-close-modal]") ||
      event.target.closest("button[data-close-modal]")
    ) {
      closeModal();
    }

    const searchResult = event.target.closest("[data-search-profile]");
    if (searchResult) {
      openProfile(searchResult.dataset.searchProfile);
    }

    if (!event.target.closest(".topbar-actions")) {
      state.userMenuOpen = false;
      hydrateHeaderMenus();
    }
  });
}

function bindAuthPage() {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");

  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      const isLogin = button.dataset.authTab === "login";
      document.querySelectorAll("[data-auth-tab]").forEach((item) => item.classList.remove("is-active"));
      button.classList.add("is-active");
      loginForm.classList.toggle("hidden", !isLogin);
      signupForm.classList.toggle("hidden", isLogin);
    });
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    try {
      state.session = await loginUser({
        email: formData.get("email"),
        password: formData.get("password")
      });
      window.location.hash = "#/home";
      route();
      showToast("Welcome back.");
    } catch (error) {
      showToast(error.message, "error");
    }
  });

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(signupForm);
    const role = formData.get("role");
    const displayName = formData.get("displayName");
    const art = createProfileArtwork(displayName, role);

    const profile =
      role === "model"
        ? {
            name: displayName,
            location: formData.get("location") || "Location flexible",
            bio: formData.get("bio") || "",
            categories: splitCsv(formData.get("categories")) || [],
            measurements: {},
            profileImage: art.profileImage,
            coverImage: art.coverImage,
            portfolio: []
          }
        : {
            name: displayName,
            location: formData.get("location") || "Global",
            description: formData.get("bio") || "",
            industry: "Brand / Agency",
            profileImage: art.profileImage,
            banner: art.coverImage
          };

    try {
      state.session = await signupUser({
        email: formData.get("email"),
        password: formData.get("password"),
        role,
        profile
      });
      window.location.hash = "#/home";
      route();
      showToast("Account created.");
    } catch (error) {
      showToast(error.message, "error");
    }
  });
}

function bindDashboardEvents(routeName, routeParam) {
  bindHeaderEvents();
  bindFeedEvents();
  bindDiscoverEvents();
  bindMessagingEvents();
  bindJobEvents();
  bindProfileEvents(routeName, routeParam);
}

function bindHeaderEvents() {
  const searchInput = document.getElementById("global-search");
  if (searchInput) {
    searchInput.value = state.searchQuery;
    searchInput.addEventListener("input", () => {
      state.searchQuery = searchInput.value.trim();
      hydrateHeaderMenus();
    });
  }

  document.querySelector("[data-toggle='user-menu']")?.addEventListener("click", () => {
    state.userMenuOpen = !state.userMenuOpen;
    hydrateHeaderMenus();
  });
}

function hydrateHeaderMenus() {
  const userMenuRoot = document.getElementById("user-menu-panel");
  const searchRoot = document.getElementById("search-results-panel");
  if (userMenuRoot) {
    userMenuRoot.innerHTML = state.userMenuOpen ? renderUserMenu(state.session) : "";
  }
  if (searchRoot) {
    const results = getSearchResults();
    searchRoot.innerHTML = state.searchQuery ? renderSearchResults(results) : "";
  }
}

function bindFeedEvents() {
  document.querySelectorAll("[data-open-create-post]").forEach((button) => {
    button.addEventListener("click", () => {
      openModal(`
      <div class="modal-card">
        <div class="modal-header">
          <div>
            <span class="eyebrow">New Post</span>
            <h3>Create a post</h3>
          </div>
          <button class="icon-button" data-close-modal="true" type="button">X</button>
        </div>
        <form id="create-post-form" class="form-stack">
          <label>Caption<textarea name="caption" rows="4" required></textarea></label>
          <label>Image file<input name="imageFile" type="file" accept="image/*" /></label>
          <label>Or image URL<input name="imageUrl" type="url" placeholder="https://example.com/image.jpg" /></label>
          <button class="button button--primary" type="submit">Publish post</button>
        </form>
      </div>
      `);

      document.getElementById("create-post-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const file = formData.get("imageFile");
        let imageUrl = String(formData.get("imageUrl") || "").trim();
        const caption = String(formData.get("caption") || "").trim();
        if (!caption) {
          showToast("Add a caption before publishing.", "error");
          return;
        }

        const submitButton = form.querySelector("button[type='submit']");
        submitButton.disabled = true;
        submitButton.textContent = "Publishing...";

        try {
          if (file && file.size) {
            imageUrl = await uploadImageFile({
              file,
              path: `post-images/${state.session.profileId}`
            });
          }

          await createPost({
            session: state.session,
            caption,
            imageUrl
          });
          closeModal();
          showToast("Post published.");
        } catch (error) {
          console.error("Create post failed.", error);
          showToast(error.message || "Could not publish this post.", "error");
          submitButton.disabled = false;
          submitButton.textContent = "Publish post";
        }
      });
    });
  });

  document.querySelectorAll("[data-like-post]").forEach((button) => {
    button.addEventListener("click", async () => {
      const post = state.posts.find((item) => item.id === button.dataset.likePost);
      if (!post) return;
      await updatePostCounts(post.id, { likes: (post.likes || 0) + 1 });
    });
  });

  document.querySelectorAll("[data-comment-post]").forEach((button) => {
    button.addEventListener("click", async () => {
      const post = state.posts.find((item) => item.id === button.dataset.commentPost);
      if (!post) return;
      await updatePostCounts(post.id, { comments: (post.comments || 0) + 1 });
      showToast("Comment count updated.");
    });
  });
}

function bindDiscoverEvents() {
  const form = document.getElementById("discover-filters");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    state.discoverFilters.category = formData.get("category");
    state.discoverFilters.location = formData.get("location").trim();
    route();
  });

  document.querySelectorAll("[data-model-card]").forEach((card) => {
    card.addEventListener("click", () => {
      openProfile(card.dataset.modelCard);
    });
  });
}

function bindMessagingEvents() {
  const thread = document.getElementById("chat-thread");
  if (thread) {
    thread.scrollTop = thread.scrollHeight;
  }

  document.querySelectorAll("[data-chat-id]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedChatId = button.dataset.chatId;
      route();
    });
  });

  document.getElementById("message-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const activeChat = state.chats.find((item) => item.id === state.selectedChatId);
    if (!activeChat) return;
    const formData = new FormData(event.currentTarget);
    const text = String(formData.get("message") || "").trim();
    if (!text) return;
    try {
      await sendChatMessage({
        chatId: activeChat.id,
        session: state.session,
        text
      });
      event.currentTarget.reset();
    } catch (error) {
      console.error("Send message failed.", error);
      showToast(error.message || "Message could not be sent.", "error");
    }
  });
}

function bindJobEvents() {
  document.querySelectorAll("[data-job-status]").forEach((button) => {
    button.addEventListener("click", async () => {
      const job = state.jobs.find((item) => item.id === button.dataset.jobId);
      if (!job) return;
      await updateJobStatus(job.id, button.dataset.jobStatus);
      showToast(`Job marked ${button.dataset.jobStatus.toLowerCase()}.`);
    });
  });
}

function bindProfileEvents(routeName, routeParam) {
  const currentProfile =
    state.models.find((item) => item.id === (routeParam || state.profileFocusId || state.session.profileId)) ||
    state.brands.find((item) => item.id === (routeParam || state.profileFocusId || state.session.profileId)) ||
    state.models.find((item) => item.id === state.session.profileId) ||
    state.brands.find((item) => item.id === state.session.profileId) ||
    null;

  document.querySelectorAll("[data-lightbox-image]").forEach((button) => {
    button.addEventListener("click", () => {
      openModal(`
        <div class="lightbox-card">
          <button class="icon-button lightbox-close" data-close-modal="true" type="button">X</button>
          <img src="${button.dataset.lightboxImage}" alt="Portfolio preview" />
        </div>
      `);
    });
  });

  document.querySelectorAll("[data-open-hire-modal]").forEach((button) => {
    button.addEventListener("click", () => {
    const profile = state.models.find((item) => item.id === (routeParam || state.profileFocusId || state.session.profileId));
    if (!profile) return;

    openModal(`
      <div class="modal-card">
        <div class="modal-header">
          <h3>Hire ${profile.name}</h3>
          <button class="icon-button" data-close-modal="true" type="button">X</button>
        </div>
        <form id="hire-form" class="form-stack">
          <label>Project title<input name="title" required /></label>
          <label>Description<textarea name="description" rows="4" required></textarea></label>
          <label>Budget<input name="budget" required /></label>
          <label>Location type
            <select name="locationType">
              <option value="Remote">Remote</option>
              <option value="On-site">On-site</option>
            </select>
          </label>
          <button class="button button--primary" type="submit">Send hire request</button>
        </form>
      </div>
    `);

      document.getElementById("hire-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await createJob({
          session: state.session,
          job: {
            title: formData.get("title"),
            description: formData.get("description"),
            brandId: state.session.role === "brand" ? state.session.profileId : "",
            modelId: profile.id,
            budget: formData.get("budget"),
            locationType: formData.get("locationType"),
            status: "Pending"
          }
        });
        closeModal();
        openModal(`
        <div class="modal-card modal-card--success">
          <div class="success-mark">OK</div>
          <h3>Request sent</h3>
          <p>Your hiring request for ${profile.name} has been saved to Firestore.</p>
          <button class="button button--primary" data-close-modal="true" type="button">Close</button>
        </div>
        `);
      });
    });
  });

  document.querySelectorAll("[data-open-post-job]").forEach((button) => {
    button.addEventListener("click", () => {
      openModal(`
      <div class="modal-card">
        <div class="modal-header">
          <h3>Post a job</h3>
          <button class="icon-button" data-close-modal="true" type="button">X</button>
        </div>
        <form id="post-job-form" class="form-stack">
          <label>Job title<input name="title" required /></label>
          <label>Description<textarea name="description" rows="4" required></textarea></label>
          <label>Budget<input name="budget" required /></label>
          <button class="button button--primary" type="submit">Post job</button>
        </form>
      </div>
      `);

      document.getElementById("post-job-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        await createJob({
          session: state.session,
          job: {
            title: formData.get("title"),
            description: formData.get("description"),
            brandId: state.session.profileId,
            modelId: "",
            budget: formData.get("budget"),
            locationType: "Remote",
            status: "Pending"
          }
        });
        closeModal();
        showToast("Job posted.");
        window.location.hash = "#/jobs";
      });
    });
  });

  document.querySelectorAll("[data-open-message]").forEach((button) => {
    button.addEventListener("click", async () => {
      const targetId = routeParam || state.profileFocusId;
      const otherProfile =
        state.models.find((item) => item.id === targetId) ||
        state.brands.find((item) => item.id === targetId);
      if (!otherProfile?.ownerUid) {
        showToast("This profile cannot be messaged yet.", "error");
        return;
      }
      try {
        const chatId = await findOrCreateChat({
          session: state.session,
          otherProfile
        });
        state.selectedChatId = chatId;
        window.location.hash = "#/messages";
      } catch (error) {
        showToast(error.message || "Could not start this conversation.", "error");
      }
    });
  });

  document.querySelectorAll("[data-open-edit-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!currentProfile) return;
      openModal(
        renderEditProfileModal({
          profile: currentProfile,
          role: state.session.role
        })
      );
      bindProfileEditorEvents();
    });
  });

  bindProfileEditorEvents();

  if (routeName === "profile") {
    document.querySelectorAll("[data-related-profile]").forEach((button) => {
      button.addEventListener("click", () => openProfile(button.dataset.relatedProfile));
    });
  }
}

function bindProfileEditorEvents() {
  document.getElementById("profile-photo-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("profileImage");
    if (!file || !file.size) return;
    try {
      const imageUrl = await uploadImageFile({
        file,
        path: `profile-images/${state.session.profileId}`
      });
      await updateProfileMedia(state.session.profileId, { profileImage: imageUrl });
      showToast("Profile image updated.");
    } catch (error) {
      showToast(error.message || "Could not update profile image.", "error");
    }
  });

  document.getElementById("cover-photo-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("coverImage");
    if (!file || !file.size) return;
    try {
      const imageUrl = await uploadImageFile({
        file,
        path: `cover-images/${state.session.profileId}`
      });
      const profile = state.models.find((item) => item.id === state.session.profileId);
      await updateProfileMedia(
        state.session.profileId,
        profile ? { coverImage: imageUrl } : { banner: imageUrl }
      );
      showToast("Cover image updated.");
    } catch (error) {
      showToast(error.message || "Could not update cover image.", "error");
    }
  });

  document.getElementById("portfolio-upload-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("portfolioImage");
    if (!file || !file.size) return;
    try {
      const imageUrl = await uploadImageFile({
        file,
        path: `portfolio/${state.session.profileId}`
      });
      await addPortfolioImage(state.session.profileId, imageUrl);
      showToast("Portfolio image added.");
      reopenEditorModal();
    } catch (error) {
      showToast(error.message || "Could not add portfolio image.", "error");
    }
  });

  document.getElementById("profile-details-form")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const nextName = String(formData.get("name") || "").trim();
    const payload =
      state.session.role === "model"
        ? {
            name: nextName,
            location: String(formData.get("location") || "").trim(),
            bio: String(formData.get("bio") || "").trim(),
            categories: splitCsv(formData.get("categories")) || [],
            measurements: buildMeasurementsPayload(formData)
          }
        : {
            name: nextName,
            location: String(formData.get("location") || "").trim(),
            description: String(formData.get("bio") || "").trim(),
            industry: String(formData.get("industry") || "").trim()
          };
    try {
      await updateProfileMedia(state.session.profileId, payload);
      if (nextName) {
        await updateUserDisplayName(state.session.uid, nextName);
        state.session = { ...state.session, displayName: nextName };
      }
      showToast("Profile updated.");
      closeModal();
      route();
    } catch (error) {
      showToast(error.message || "Could not update this profile.", "error");
    }
  });

  document.querySelectorAll("[data-remove-portfolio]").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await removePortfolioImage(state.session.profileId, button.dataset.removePortfolio);
        showToast("Portfolio image removed.");
        reopenEditorModal();
      } catch (error) {
        showToast(error.message || "Could not remove portfolio image.", "error");
      }
    });
  });
}

function reopenEditorModal() {
  const profile =
    state.models.find((item) => item.id === state.session.profileId) ||
    state.brands.find((item) => item.id === state.session.profileId);
  if (!profile) return;
  openModal(
    renderEditProfileModal({
      profile,
      role: state.session.role
    })
  );
  bindProfileEditorEvents();
}

function buildMeasurementsPayload(formData) {
  const keys = ["height", "bust", "waist", "hips", "shoe", "hair", "eyes"];
  return keys.reduce((acc, key) => {
    const value = String(formData.get(`measurement-${key}`) || "").trim();
    if (value) acc[key] = value;
    return acc;
  }, {});
}

function openProfile(profileId) {
  state.profileFocusId = profileId;
  window.location.hash = `#/profile/${profileId}`;
}

function getFilteredModels() {
  return state.models.filter((model) => {
    const categoryMatch =
      state.discoverFilters.category === "All" ||
      model.categories.includes(state.discoverFilters.category);
    const locationMatch =
      !state.discoverFilters.location ||
      model.location.toLowerCase().includes(state.discoverFilters.location.toLowerCase());
    return categoryMatch && locationMatch;
  });
}

function getSearchResults() {
  const query = state.searchQuery.toLowerCase();
  const allProfiles = [
    ...state.models.map((item) => ({ id: item.id, name: item.name, role: "Model", location: item.location })),
    ...state.brands.map((item) => ({ id: item.id, name: item.name, role: "Brand", location: item.location }))
  ];

  return allProfiles.filter((item) => {
    return [item.name, item.role, item.location].join(" ").toLowerCase().includes(query);
  });
}

function parseHash() {
  const hash = window.location.hash || (state.session ? "#/home" : "#/auth");
  const clean = hash.replace(/^#\//, "");
  const [routeNameRaw, routeParam] = clean.split("/");
  const routeName = appRoutes.has(routeNameRaw) ? routeNameRaw : state.session ? "home" : "auth";
  return { routeName, routeParam };
}

function splitCsv(value) {
  const items = String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  return items.length ? items : null;
}
