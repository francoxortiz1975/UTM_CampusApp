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

  // -----------------------------
  // Fetch all items
  // -----------------------------
  const fetchItems = async () => {
    try {
      const res = await fetch(`${apiBase}/lostandfound/`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Error fetching items:", err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // -----------------------------
  // Create item
  // -----------------------------
  const createItem = async () => {
    if (!newItem || !newDesc) return;
    try {
      const res = await fetch(`${apiBase}/lostandfound/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ item: newItem, desc: newDesc }),
      });
      if (!res.ok) return;
      await res.json();
      setNewItem("");
      setNewDesc("");
      fetchItems();
    } catch (err) {
      console.error("Error creating item:", err);
    }
  };

  // -----------------------------
  // Update item
  // -----------------------------
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

  // -----------------------------
  // Delete item
  // -----------------------------
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

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold text-gray-800">Lost & Found</h1>

        {/* Create new entry */}
        <div className="bg-white rounded-xl shadow p-4 space-x-2 flex">
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="Item"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 flex-1"
            placeholder="Description"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
          />
          <button
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            onClick={createItem}
          >
            Add
          </button>
        </div>

        {/* List of entries */}
        <div className="bg-white rounded-xl shadow p-4 space-y-2">
          {items.length === 0 && <p className="text-gray-500">No lost & found items.</p>}
          {items.map((item) => (
            <div key={item.id} className="flex justify-between items-center space-x-2">
              {editingId === item.id ? (
                <>
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    value={editItem}
                    onChange={(e) => setEditItem(e.target.value)}
                  />
                  <input
                    className="border rounded px-2 py-1 flex-1"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                  />
                  <button
                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                    onClick={() => updateItem(item.id)}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1">
                    <strong>{item.item}</strong>: {item.desc}
                  </span>
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditItem(item.item);
                      setEditDesc(item.desc);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    onClick={() => deleteItem(item.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}