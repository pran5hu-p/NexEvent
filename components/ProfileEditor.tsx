'use client';

import { useState, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface UserData {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string | null;
}

export default function ProfileEditor({ user }: { user: UserData }) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(user.name);
    const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
    const [loading, setLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false); // New state to track image upload

    const router = useRouter();
    const { update } = useSession();

    // The Cloudinary Upload Function
    const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);

        const formData = new FormData();
        formData.append('file', file);
        
        // REPLACE THESE WITH YOUR CLOUDINARY DETAILS
        formData.append('upload_preset', 'nexevent_avatars'); // The name of your unsigned preset
        const cloudName = 'bzvu69bx'; 

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (data.secure_url) {
                // Cloudinary returned a short, safe URL! Set it in state.
                setAvatarUrl(data.secure_url);
            } else {
                throw new Error('Failed to upload image');
            }
        } catch (error) {
            console.error('Upload Error:', error);
            alert('Failed to upload image to Cloudinary. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, avatarUrl }),
            });

            if (!res.ok) throw new Error('Failed to update profile');

            // Refresh the NextAuth session cache with the safe, short URL
            await update({
                name: name,
                avatarUrl: avatarUrl
            });

            setIsEditing(false);
            router.refresh();
        } catch (error: any) {
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const getRoleBadgeStyle = (userRole: string) => {
        switch (userRole.toLowerCase()) {
            case 'admin': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'organizer': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            default: return 'bg-green-500/20 text-green-400 border-green-500/30';
        }
    };

    return (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-neutral-800">
                
                {/* Left Side: Avatar and Info */}
                <div className="flex flex-col sm:flex-row items-center gap-6 w-full md:w-auto">
                    <div className="relative group">
                        <div className="w-20 h-20 rounded-full bg-neutral-800 border-2 border-neutral-700 flex items-center justify-center text-white text-3xl font-bold shadow-inner overflow-hidden">
                            {isUploading ? (
                                <span className="text-sm font-medium animate-pulse text-green-400">...</span>
                            ) : avatarUrl ? (
                                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                name.charAt(0).toUpperCase()
                            )}
                        </div>
                        {isEditing && (
                            <label className={`absolute inset-0 rounded-full flex items-center justify-center text-xs font-bold transition ${isUploading ? 'bg-black/80 cursor-not-allowed' : 'bg-black/60 cursor-pointer opacity-0 group-hover:opacity-100'}`}>
                                {isUploading ? 'Uploading...' : 'Upload'}
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="hidden" 
                                    onChange={handleImageUpload}
                                    disabled={isUploading}
                                />
                            </label>
                        )}
                    </div>

                    <div className="flex-1 w-full text-center sm:text-left">
                        {isEditing ? (
                            <div className="space-y-3 max-w-sm mx-auto sm:mx-0">
                                <div>
                                    <label className="text-xs text-neutral-400 uppercase font-semibold mb-1 block">Display Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2 justify-center sm:justify-start">
                                    <button
                                        onClick={handleSave}
                                        disabled={loading || isUploading}
                                        className="bg-green-500 hover:bg-green-600 text-black text-sm font-bold px-4 py-2 rounded-lg transition disabled:opacity-50"
                                    >
                                        {loading ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setName(user.name);
                                            setAvatarUrl(user.avatarUrl || '');
                                        }}
                                        className="bg-neutral-800 hover:bg-neutral-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <h2 className="text-2xl font-bold text-white">{name}</h2>
                                <p className="text-neutral-400 text-sm">{user.email}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Actions & Badges */}
                <div className="flex flex-col items-center sm:items-end gap-3 w-full md:w-auto mt-2 md:mt-0">
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-lg transition whitespace-nowrap"
                        >
                            Edit Profile
                        </button>
                    )}
                    
                    {!isEditing && (
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase border whitespace-nowrap ${getRoleBadgeStyle(user.role)}`}>
                            {user.role} Account
                        </span>
                    )}
                </div>

            </div>
        </div>
    );
}