import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "./firebase.js";
import {
  createUserProfile,
  getSessionBundle
} from "./services/dataService.js";

function buildSession({ uid, email, role, profileId, displayName }) {
  return { uid, email, role, profileId, displayName };
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

const PENDING_SIGNUP_KEY = "runwaylink-pending-signup";

function savePendingSignup(payload) {
  localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify(payload));
}

function readPendingSignup() {
  return JSON.parse(localStorage.getItem(PENDING_SIGNUP_KEY) || "null");
}

function clearPendingSignup() {
  localStorage.removeItem(PENDING_SIGNUP_KEY);
}

export function watchSession(callback) {
  if (!isFirebaseConfigured || !auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }

    try {
      const bundle = await getSessionBundle(firebaseUser.uid);
      callback(
        bundle
          ? buildSession({
              uid: firebaseUser.uid,
              email: firebaseUser.email || "",
              role: bundle.user.role,
              profileId: bundle.user.profileId,
              displayName:
                bundle.profile?.name ||
                bundle.user.displayName ||
                firebaseUser.email ||
                ""
            })
          : null
      );
    } catch (error) {
      console.error("Failed to restore Firebase session.", error);
      callback(null);
    }
  });
}

export async function signupUser({ email, password, role, profile }) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured.");
  }

  const normalizedEmail = normalizeEmail(email);
  savePendingSignup({
    email: normalizedEmail,
    role,
    profile
  });

  const credentials = await createUserWithEmailAndPassword(auth, normalizedEmail, password);

  try {
    await createUserProfile({
      uid: credentials.user.uid,
      email: normalizedEmail,
      role,
      profile
    });
    clearPendingSignup();

    return buildSession({
      uid: credentials.user.uid,
      email: normalizedEmail,
      role,
      profileId: credentials.user.uid,
      displayName: profile.name
    });
  } catch (error) {
    try {
      await deleteUser(credentials.user);
    } catch (deleteError) {
      console.error("Failed to roll back partially created auth user.", deleteError);
    }
    throw new Error(
      "Authentication was created, but Firestore profile setup was blocked. Deploy the Firestore rules, then sign up again."
    );
  }
}

export async function loginUser({ email, password }) {
  if (!isFirebaseConfigured || !auth) {
    throw new Error("Firebase is not configured.");
  }

  const normalizedEmail = normalizeEmail(email);
  const credentials = await signInWithEmailAndPassword(auth, normalizedEmail, password);
  let bundle = await getSessionBundle(credentials.user.uid);

  if (!bundle) {
    const pending = readPendingSignup();
    if (pending && pending.email === normalizedEmail) {
      try {
        await createUserProfile({
          uid: credentials.user.uid,
          email: normalizedEmail,
          role: pending.role,
          profile: pending.profile
        });
        clearPendingSignup();
        bundle = await getSessionBundle(credentials.user.uid);
      } catch (error) {
        throw new Error(
          "Login succeeded, but your Firestore profile could not be created. Deploy the Firestore rules first."
        );
      }
    }
  }

  if (!bundle) {
    throw new Error(
      "Your Firebase Auth account exists, but its Firestore profile is missing. Deploy the Firestore rules and sign up again."
    );
  }

  return buildSession({
    uid: credentials.user.uid,
    email: normalizedEmail,
    role: bundle.user.role,
    profileId: bundle.user.profileId,
    displayName:
      bundle.profile?.name ||
      bundle.user.displayName ||
      normalizedEmail
  });
}

export async function logoutUser() {
  if (!isFirebaseConfigured || !auth) {
    return;
  }
  await signOut(auth);
}
