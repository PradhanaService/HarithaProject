import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import {
  getDownloadURL,
  ref,
  uploadBytes
} from "firebase/storage";
import { db, isFirebaseConfigured, storage } from "../firebase.js";
import {
  normalizeChat,
  normalizeJob,
  normalizePost,
  normalizeProfile,
  uid
} from "../utils.js";

const COLLECTIONS = {
  users: "users",
  profiles: "profiles",
  posts: "posts",
  jobs: "jobs",
  chats: "chats"
};

export function subscribeRealtimeData(session, callback, onError) {
  if (!isFirebaseConfigured || !db) {
    callback({
      models: [],
      brands: [],
      posts: [],
      jobs: [],
      chats: []
    });
    return () => {};
  }

  let profiles = [];
  let posts = [];
  let jobs = [];
  let chats = [];

  const emit = () => {
    callback({
      models: profiles.filter((item) => item.role === "model"),
      brands: profiles.filter((item) => item.role === "brand"),
      posts,
      jobs,
      chats
    });
  };

  const unsubscribers = [
    onSnapshot(
      query(collection(db, COLLECTIONS.profiles), orderBy("createdAt", "desc")),
      (snapshot) => {
        profiles = snapshot.docs.map((item) =>
          normalizeProfile({ id: item.id, ...item.data(), source: "firebase" })
        );
        emit();
      },
      onError
    ),
    onSnapshot(
      query(collection(db, COLLECTIONS.posts), orderBy("createdAt", "desc")),
      (snapshot) => {
        posts = snapshot.docs.map((item) =>
          normalizePost({ id: item.id, ...item.data(), source: "firebase" })
        );
        emit();
      },
      onError
    ),
    onSnapshot(
      query(collection(db, COLLECTIONS.jobs), orderBy("createdAt", "desc")),
      (snapshot) => {
        jobs = snapshot.docs.map((item) =>
          normalizeJob({ id: item.id, ...item.data(), source: "firebase" })
        );
        emit();
      },
      onError
    )
  ];

  if (session?.uid) {
    unsubscribers.push(
      onSnapshot(
        query(
          collection(db, COLLECTIONS.chats),
          where("participantsUids", "array-contains", session.uid)
        ),
        (snapshot) => {
          chats = snapshot.docs.map((item) =>
            normalizeChat({ id: item.id, ...item.data(), source: "firebase" }, session.uid)
          );
          emit();
        },
        onError
      )
    );
  } else {
    emit();
  }

  return () => {
    unsubscribers.forEach((unsubscribe) => unsubscribe());
  };
}

export async function getSessionBundle(uidValue) {
  if (!isFirebaseConfigured || !db || !uidValue) return null;

  const userSnap = await getDoc(doc(db, COLLECTIONS.users, uidValue));
  if (!userSnap.exists()) return null;

  const user = { id: userSnap.id, ...userSnap.data() };
  const profileSnap = await getDoc(doc(db, COLLECTIONS.profiles, user.profileId));
  return {
    user,
    profile: profileSnap.exists()
      ? normalizeProfile({ id: profileSnap.id, ...profileSnap.data(), source: "firebase" })
      : null
  };
}

export async function createUserProfile({ uid: userUid, email, role, profile }) {
  await setDoc(doc(db, COLLECTIONS.users, userUid), {
    email,
    role,
    profileId: userUid,
    displayName: profile.name,
    createdAt: serverTimestamp()
  });

  await setDoc(doc(db, COLLECTIONS.profiles, userUid), {
    ownerUid: userUid,
    role,
    name: profile.name,
    location: profile.location,
    bio: profile.bio || "",
    description: profile.description || "",
    industry: profile.industry || "",
    categories: profile.categories || [],
    measurements: profile.measurements || {},
    profileImage: profile.profileImage || "",
    coverImage: profile.coverImage || "",
    banner: profile.banner || "",
    portfolio: profile.portfolio || [],
    createdAt: serverTimestamp()
  });
}

export async function updateUserDisplayName(userId, displayName) {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, COLLECTIONS.users, userId), { displayName });
}

export async function createPost({ session, caption, imageUrl }) {
  const result = await addDoc(collection(db, COLLECTIONS.posts), {
    authorId: session.profileId,
    authorUid: session.uid,
    authorRole: session.role,
    caption,
    image: imageUrl || "",
    likes: 0,
    comments: 0,
    createdAt: serverTimestamp()
  });

  return { id: result.id };
}

export async function updatePostCounts(postId, counts) {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, COLLECTIONS.posts, postId), counts);
}

export async function createJob({ session, job }) {
  const result = await addDoc(collection(db, COLLECTIONS.jobs), {
    ...job,
    authorUid: session.uid,
    createdAt: serverTimestamp()
  });
  return { id: result.id };
}

export async function updateJobStatus(jobId, status) {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, COLLECTIONS.jobs, jobId), { status });
}

export async function uploadImageFile({ file, path }) {
  if (!isFirebaseConfigured || !storage) {
    throw new Error("Firebase Storage is not configured.");
  }

  const storageRef = ref(storage, `${path}/${Date.now()}-${uid("img")}-${file.name}`);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function updateProfileMedia(profileId, payload) {
  if (!isFirebaseConfigured || !db) return;
  await updateDoc(doc(db, COLLECTIONS.profiles, profileId), payload);
}

export async function addPortfolioImage(profileId, imageUrl) {
  if (!isFirebaseConfigured || !db) return;
  const profileRef = doc(db, COLLECTIONS.profiles, profileId);
  const profileSnap = await getDoc(profileRef);
  if (!profileSnap.exists()) throw new Error("Profile not found.");
  const current = profileSnap.data().portfolio || [];
  const portfolio = [...current, { id: uid("portfolio"), image: imageUrl }];
  await updateDoc(profileRef, { portfolio });
}

export async function removePortfolioImage(profileId, portfolioItemId) {
  if (!isFirebaseConfigured || !db) return;
  const profileRef = doc(db, COLLECTIONS.profiles, profileId);
  const profileSnap = await getDoc(profileRef);
  if (!profileSnap.exists()) throw new Error("Profile not found.");
  const current = profileSnap.data().portfolio || [];
  const portfolio = current.filter((item) => item.id !== portfolioItemId);
  await updateDoc(profileRef, { portfolio });
}

export async function findOrCreateChat({ session, otherProfile }) {
  const existingSnap = await getDocs(
    query(
      collection(db, COLLECTIONS.chats),
      where("participantsUids", "array-contains", session.uid)
    )
  );

  const found = existingSnap.docs.find((item) => {
    const data = item.data();
    return (data.participantsUids || []).includes(otherProfile.ownerUid);
  });

  if (found) {
    return found.id;
  }

  const participantRecords = [
    {
      uid: session.uid,
      profileId: session.profileId,
      name: session.displayName || session.email,
      role: session.role
    },
    {
      uid: otherProfile.ownerUid,
      profileId: otherProfile.id,
      name: otherProfile.name,
      role: otherProfile.role
    }
  ];

  const result = await addDoc(collection(db, COLLECTIONS.chats), {
    ownerUid: session.uid,
    participantsUids: participantRecords.map((item) => item.uid),
    participants: participantRecords,
    preview: "",
    messages: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  return result.id;
}

export async function sendChatMessage({ chatId, session, text }) {
  if (!isFirebaseConfigured || !db) {
    throw new Error("Firebase is not configured.");
  }
  const chatRef = doc(db, COLLECTIONS.chats, chatId);
  const chatSnap = await getDoc(chatRef);
  if (!chatSnap.exists()) {
    throw new Error("Chat not found.");
  }

  const data = chatSnap.data();
  const messages = data.messages || [];
  const nextMessage = {
    id: uid("message"),
    senderUid: session.uid,
    senderProfileId: session.profileId,
    senderName: session.displayName || session.email || "User",
    text,
    createdAt: Date.now()
  };

  await updateDoc(chatRef, {
    messages: [...messages, nextMessage],
    preview: text,
    updatedAt: serverTimestamp()
  });
}
