"use client";

import Header from '../../components/Header';
import { useState, useEffect } from 'react';

const apiBase =
  typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000'
    : 'http://localhost:5000';

export default function LostAndFound() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editItem, setEditItem] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [currentUserId, setCurrentUserId] = useState(null);

  // Comments state
  const [activeItemId, setActiveItemId] = useState(null); // which item’s comments are open
  const [comments, setComments] = useState({}); // { itemId: [comments] }
  const [newComment, setNewComment] = useState("");

  // ---------------- Date Formatting ----------------
  const formatDate = (dateString) => {
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
      setItems(data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${apiBase}/me`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setCurrentUserId(data.id);
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchCurrentUser();
  }, []);

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

  const updateItem = async (id) => {
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

  const deleteItem = async (id) => {
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
  const toggleComments = async (itemId) => {
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
        setComments((prev) => ({ ...prev, [itemId]: data }));
      } catch (err) {
        console.error("Error fetching comments:", err);
      }
    }
  };

  const postComment = async (itemId) => {
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
        [itemId]: [...(prev[itemId] || []), data],
      }));
      setNewComment("");
    } catch (err) {
      console.error("Error posting comment:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-4xl font-bold text-gray-800">Lost & Found</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-5 py-2 rounded-xl hover:bg-blue-700 shadow"
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
                className="break-inside-avoid bg-white rounded-2xl shadow-md p-4 hover:shadow-lg transition cursor-pointer"
                onClick={() => toggleComments(item.id)}
              >
                {editingId === item.id ? (
                  <div className="space-y-2">
                    <input
                      className="border rounded px-2 py-1 w-full"
                      value={editItem}
                      onChange={(e) => setEditItem(e.target.value)}
                    />
                    <textarea
                      className="border rounded px-2 py-1 w-full"
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() => updateItem(item.id)}
                      >
                        Save
                      </button>
                      <button
                        className="bg-gray-400 text-white px-3 py-1 rounded"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Title + Date */}
                    <div className="flex justify-between items-start mb-1">
                      <h2 className="text-lg font-semibold text-gray-800">
                        {item.item}
                      </h2>
                      <span
                        className="text-xs text-gray-400"
                        title={new Date(item.created_at).toLocaleString()}
                      >
                        {formatDate(item.created_at)}
                      </span>
                    </div>

                    <p className="text-gray-600 text-sm mb-3">{item.desc}</p>

                    <div className="flex justify-between">
                      {isOwner && (
                        <button
                          className="text-yellow-600 text-sm font-medium"
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
                          className="text-red-600 text-sm font-medium"
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
                      <div className="mt-3 border-t pt-2 space-y-2">
                        {(comments[item.id] || []).map((c) => (
                          <div key={c.id} className="text-sm text-gray-700">
                            {c.comment}{" "}
                            <span className="text-xs text-gray-400">
                              by user {c.user_id}
                            </span>
                          </div>
                        ))}

                        <div className="flex mt-2 gap-2">
                          <input
                            className="border rounded px-2 py-1 flex-1"
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onClick={(e) => e.stopPropagation()} // prevent toggle
                          />
                          <button
                            className="bg-blue-600 text-white px-3 py-1 rounded"
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
          <p className="text-gray-500">No lost & found items.</p>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            {errorMsg && (
              <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg text-sm">
                {errorMsg}
              </div>
            )}

            <h2 className="text-2xl font-semibold">Add New Item</h2>

            <input
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="Item"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
            />
            <textarea
              className="border rounded-lg px-3 py-2 w-full"
              placeholder="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />

            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded-lg"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
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