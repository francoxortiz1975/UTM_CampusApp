"use client";

import Header from '../../components/Header';
import { useState, useEffect } from 'react';

const apiBase =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : 'http://localhost:5000';

type LostFoundItem = {
  id: number;
  user_id: number;
  current_user_id?: number;
  item: string;
  desc: string;
  created_at: string;
};

type LostFoundComment = {
  id: number;
  comment: string;
  user_id: number;
};

export default function LostAndFound() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [newItem, setNewItem] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Comments state
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, LostFoundComment[]>>({});
  const [newComment, setNewComment] = useState("");

  // ---------------- Date Formatting ----------------
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ---------------- Fetch Items & User ----------------
  const fetchItems = async () => {
    try {
      const res = await fetch(`${apiBase}/lostandfound/`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();

      // Sort newest first
      setItems(
        (data as LostFoundItem[]).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
      );
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${apiBase}/me`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setCurrentUserId(typeof data.id === "number" ? data.id : null);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!showModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showModal]);

  // ---------------- CRUD Operations ----------------
  const createItem = async () => {
    if (!newItem || !newDesc) return;
    setErrorMsg("");
    try {
      const res = await fetch(`${apiBase}/lostandfound/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ item: newItem, desc: newDesc }),
      });

      if (res.status === 401) {
        setErrorMsg("Please sign in to add a new item");
        return;
      }

      if (!res.ok) return;
      await res.json();
      setNewItem("");
      setNewDesc("");
      setShowModal(false);
      fetchItems();
    } catch (err) {
      console.error("Error creating item:", err);
    }
  };

  const updateItem = async (id: number) => {
    try {
      const res = await fetch(`${apiBase}/lostandfound/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ id, item: editItem, desc: editDesc }),
      });
      if (!res.ok) return;
      await res.json();
      setEditingId(null);
      fetchItems();
    } catch (err) {
      console.error("Error updating item:", err);
    }
  };

  const deleteItem = async (id: number) => {
    try {
      const res = await fetch(`${apiBase}/lostandfound/delete/${id}`, {
        method: "GET",
        credentials: "include",
      });
      if (!res.ok) return;
      await res.json();
      fetchItems();
    } catch (err) {
      console.error("Error deleting item:", err);
    }
  };

  // ---------------- Comments ----------------
  const toggleComments = async (itemId: number) => {
    if (activeItemId === itemId) {
      setActiveItemId(null);
      return;
    }

    setActiveItemId(itemId);

    // Fetch comments if not already fetched
    if (!comments[itemId]) {
      try {
        const res = await fetch(`${apiBase}/lostandfound/${itemId}/comments`, { credentials: "include" });
        if (!res.ok) return;
        const data = await res.json();
        setComments((prev) => ({ ...prev, [itemId]: data as LostFoundComment[] }));
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    }
  };

  const postComment = async (itemId: number) => {
    if (!newComment) return;

    try {
      const res = await fetch(`${apiBase}/lostandfound/${itemId}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ comment: newComment }),
      });

      if (!res.ok) return;
      const data = await res.json();

      setComments((prev) => ({
        ...prev,
        [itemId]: [...(prev[itemId] || []), data as LostFoundComment],
      }));
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-zinc-950">
      <Header />

      <main id="main-content" className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-zinc-100">Lost & Found</h1>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-xl bg-blue-600 px-5 py-2 text-white shadow hover:bg-blue-700"
          >
            + New Item
          </button>
        </div>

        {/* Grid */}
        <div className="columns-1 sm:columns-2 md:columns-3 gap-4 space-y-4">
          {items.map((item) => {
            const isOwner = item.user_id === item.current_user_id;

            return (
              <div
                key={item.id}
                className="break-inside-avoid bg-white dark:bg-zinc-900 rounded-2xl shadow-md p-4 hover:shadow-lg cursor-pointer border border-transparent dark:border-zinc-800"
                onClick={() => toggleComments(item.id)}
              >
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <input
                      className="border dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editItem}
                      onChange={(e) => setEditItem(e.target.value)}
                    />
                    <textarea
                      className="border dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-zinc-100 rounded px-2 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700"
                        onClick={() => updateItem(item.id)}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        className="rounded bg-gray-400 px-3 py-1 text-white hover:bg-gray-500 dark:bg-zinc-700 dark:hover:bg-zinc-600"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Title + Date */}
                    <div className="mb-1 flex items-start justify-between">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-zinc-100">
                        {item.item}
                      </h3>
                      <span
                        className="text-xs text-gray-400 dark:text-zinc-500"
                        title={new Date(item.created_at).toLocaleString()}
                      >
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <p className="text-gray-600 dark:text-zinc-300 text-sm mb-3">{item.desc}</p>

                    <div className="flex justify-between">
                      {isOwner && (
                        <button
                          type="button"
                          className="text-sm font-medium text-yellow-600 hover:text-yellow-700 dark:text-yellow-500 dark:hover:text-yellow-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingId(item.id);
                            setEditItem(item.item);
                            setEditDesc(item.desc);
                          }}
                        >
                          Edit
                        </button>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteItem(item.id);
                          }}
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Comments Section */}
                    {activeItemId === item.id && (
                      <div className="mt-3 border-t dark:border-zinc-700 pt-3 space-y-2">
                        {(comments[item.id] || []).map((c) => (
                          <div key={c.id} className="text-sm text-gray-700 dark:text-zinc-300">
                            {c.comment}{" "}
                            <span className="text-xs text-gray-400 dark:text-zinc-500">
                              by user {c.user_id}
                            </span>
                          </div>
                        ))}

                        <div className="mt-3 flex gap-2">
                          <label htmlFor={`lost-comment-${item.id}`} className="sr-only">
                            {`Add a comment on ${item.item}`}
                          </label>
                          <input
                            id={`lost-comment-${item.id}`}
                            className="flex-1 rounded border bg-gray-50 px-2 py-1 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            type="button"
                            className="rounded bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              postComment(item.id);
                            }}
                          >
                            Post
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <p className="py-10 text-center text-gray-500 dark:text-zinc-400">No lost & found items.</p>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-lost-item-title"
            className="w-full max-w-md space-y-4 rounded-2xl border border-transparent bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            {errorMsg && (
              <div
                role="alert"
                aria-live="assertive"
                className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-400"
              >
                {errorMsg}
              </div>
            )}

            <h2 id="add-lost-item-title" className="text-2xl font-semibold text-gray-900 dark:text-zinc-100">
              Add New Item
            </h2>

            <div>
              <label htmlFor="new-lost-item-name" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Item name
              </label>
              <input
                id="new-lost-item-name"
                className="w-full rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Item Name"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="new-lost-item-desc" className="mb-1 block text-sm font-medium text-gray-700 dark:text-zinc-300">
                Description
              </label>
              <textarea
                id="new-lost-item-desc"
                className="min-h-[100px] w-full resize-y rounded-lg border bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Description"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                className="rounded-lg bg-gray-200 px-5 py-2 text-gray-800 hover:bg-gray-300 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
                onClick={createItem}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}