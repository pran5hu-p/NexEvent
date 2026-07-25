'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreateEventPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    date: '',
    location: '',
    capacity: 50,
    tags: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Uploading poster...');

    try {
      let posterUrl: string | undefined;

      // 1. Upload the image first if one was selected
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadRes = await fetch('/api/upload', { 
          method: 'POST', 
          body: formData 
        });
        
        if (!uploadRes.ok) throw new Error('Image upload failed');
        const uploadData = await uploadRes.json();
        posterUrl = uploadData.url;
      }

      toast.loading('Creating event...', { id: toastId });

      // 2. Submit the event data to our database API
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          capacity: Number(form.capacity),
          tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
          posterUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create event');
      }

      toast.success('Event submitted for admin approval!', { id: toastId });
      
      // Redirect back to the dashboard
      router.push('/dashboard/organizer');
      
    } catch (err: any) {
      toast.error(err.message, { id: toastId });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-8 bg-neutral-900 border border-neutral-800 rounded-xl">
      <h1 className="text-2xl font-bold text-white mb-6">Create New Event</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-400 mb-1">Event Title</label>
          <input
            required
            className="w-full bg-neutral-800 text-white rounded-lg p-3 border border-neutral-700 focus:border-white outline-none"
            placeholder="e.g. Quasar x AI Hackathon"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Description</label>
          <textarea
            required
            rows={4}
            className="w-full bg-neutral-800 text-white rounded-lg p-3 border border-neutral-700 focus:border-white outline-none"
            placeholder="What is this event about?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Category</label>
            <input
              required
              className="w-full bg-neutral-800 text-white rounded-lg p-3 border border-neutral-700 focus:border-white outline-none"
              placeholder="e.g. Technology"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Date & Time</label>
            <input
              required
              type="datetime-local"
              className="w-full bg-neutral-800 text-white rounded-lg p-3 border border-neutral-700 focus:border-white outline-none [color-scheme:dark]"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Location</label>
            <input
              required
              className="w-full bg-neutral-800 text-white rounded-lg p-3 border border-neutral-700 focus:border-white outline-none"
              placeholder="Room number or address"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-neutral-400 mb-1">Capacity (Max Attendees)</label>
            <input
              required
              type="number"
              min="1"
              className="w-full bg-neutral-800 text-white rounded-lg p-3 border border-neutral-700 focus:border-white outline-none"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Tags (Comma separated)</label>
          <input
            className="w-full bg-neutral-800 text-white rounded-lg p-3 border border-neutral-700 focus:border-white outline-none"
            placeholder="react, ai, networking"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-400 mb-1">Event Poster (Optional)</label>
          <input
            type="file"
            accept="image/*"
            className="w-full text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-neutral-800 file:text-white hover:file:bg-neutral-700"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-6 bg-white text-black font-bold py-3 rounded-lg hover:bg-neutral-200 transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Submit Event for Approval'}
        </button>
      </form>
    </div>
  );
}