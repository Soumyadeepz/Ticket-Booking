import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Mail,
  AtSign,
  Phone,
  ShieldCheck,
  Save,
  Ticket,
  Sparkles,
  Camera,
  Upload,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const GENRE_OPTIONS = [
  'Sci-Fi',
  'Action',
  'Thriller',
  'Live Music',
  'Live Sports',
  'Drama',
  'Comedy',
  'Horror',
  'Musical',
];

const PRESET_AVATARS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=AlexMercer',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=AriaVance',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=KaelenRao',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=ElenaCross',
  'https://api.dicebear.com/7.x/bottts/svg?seed=CyberSamurai',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=CinemaStar',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=DirectorCut',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=VIPPopcorn',
];

export const Profile = () => {
  const { user, updateUserProfile } = useAuth();
  const fileInputRef = useRef(null);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [avatar, setAvatar] = useState(
    user?.avatar ||
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'user'}`
  );
  const [selectedGenres, setSelectedGenres] = useState(
    user?.favoriteGenres || ['Sci-Fi', 'Action']
  );
  const [saving, setSaving] = useState(false);

  const toggleGenre = (g) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  };

  // Compress and convert uploaded image file to a clean 320x320 Data URL
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX_SIZE = 320;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setAvatar(compressedDataUrl);

        // Auto-save the newly selected profile photo immediately
        try {
          await updateUserProfile({
            name,
            phone,
            avatar: compressedDataUrl,
            favoriteGenres: selectedGenres,
          });
          toast.success('Profile photo updated & saved!');
        } catch {
          toast.success('Photo preview ready — click Save Profile to confirm.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = async (presetUrl) => {
    setAvatar(presetUrl);
    try {
      await updateUserProfile({
        name,
        phone,
        avatar: presetUrl,
        favoriteGenres: selectedGenres,
      });
      toast.success('Avatar updated!');
    } catch {
      // will save on form submit
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateUserProfile({
        name,
        phone,
        avatar,
        favoriteGenres: selectedGenres,
      });
      toast.success('Profile & photo saved successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      {/* Hidden File Input for Profile Photo Upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Profile Hero Card */}
      <div className="glass-card rounded-3xl p-5 sm:p-8 border border-white/15 flex flex-col sm:flex-row items-center gap-6">
        {/* Interactive Profile Photo with Camera Upload Overlay */}
        <div className="relative group shrink-0">
          <img
            src={avatar}
            alt={user?.name}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-purple-500 shadow-glow bg-zinc-900"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Choose Profile Photo"
            className="keep-white absolute -bottom-2 -right-2 p-2.5 rounded-2xl btn-gradient shadow-lg hover:scale-105 transition-transform flex items-center gap-1 text-xs font-bold"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        <div className="text-center sm:text-left flex-1 space-y-2">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="font-display font-black text-2xl sm:text-3xl text-white">
              {user?.name}
            </h1>
            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" /> Verified Account
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 break-all">
            @{user?.username} • {user?.email}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs font-bold text-purple-300 transition-all"
            >
              <Upload className="w-3.5 h-3.5" /> Choose Photo from Device
            </button>

            <Link
              to="/my-bookings"
              className="keep-white px-4 py-2 rounded-xl btn-gradient text-xs font-bold flex items-center gap-1.5"
            >
              <Ticket className="w-3.5 h-3.5" /> My Bookings
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Form & Avatar Gallery */}
      <form
        onSubmit={handleSave}
        className="glass-card rounded-3xl p-5 sm:p-8 border border-white/10 space-y-6"
      >
        <h2 className="font-display font-bold text-lg sm:text-xl text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" /> Choose Avatar or Upload Custom Photo
        </h2>

        {/* Preset Avatar Gallery */}
        <div className="space-y-3">
          <p className="text-xs text-zinc-400">
            Click <strong className="text-purple-400">Choose Photo from Device</strong> above to
            upload any picture from your phone/laptop, or tap a preset cinema avatar below:
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
            {PRESET_AVATARS.map((presetUrl, idx) => {
              const isSelected = avatar === presetUrl;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPresetAvatar(presetUrl)}
                  className={`relative p-1.5 rounded-2xl border-2 transition-all flex items-center justify-center bg-zinc-900/60 ${
                    isSelected
                      ? 'border-purple-500 scale-105 shadow-glow'
                      : 'border-white/10 hover:border-purple-400/50'
                  }`}
                >
                  <img
                    src={presetUrl}
                    alt={`Avatar ${idx + 1}`}
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  {isSelected && (
                    <span className="keep-white absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 pt-2 border-t border-white/10">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950/80 border border-white/15 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Username
            </label>
            <div className="relative">
              <AtSign className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="text"
                disabled
                value={user?.username || ''}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 text-sm text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
              Verified Gmail / Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3.5" />
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-900/50 border border-white/5 text-sm text-zinc-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Favorite Genres */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
            Favorite Cinema & Live Event Genres
          </label>
          <div className="flex flex-wrap gap-2">
            {GENRE_OPTIONS.map((g) => {
              const active = selectedGenres.includes(g);
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => toggleGenre(g)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    active
                      ? 'keep-white bg-purple-600 border-purple-400 text-white shadow-sm'
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="keep-white w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl btn-gradient text-sm font-bold disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving Changes...' : 'Save Profile & Photo'}
          </button>
        </div>
      </form>
    </div>
  );
};
