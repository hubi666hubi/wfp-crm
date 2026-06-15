import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError } from '../lib/firebaseErrors';
import { User, CheckCircle2, Copy, Check } from 'lucide-react';
import { useClipboard } from '../hooks/useClipboard';

interface UserProfileData {
  email: string;
  displayName: string;
  photoURL: string;
  createdAt?: string;
}

export function UserProfile({ userId }: { userId: string }) {
  const { hasCopied, copy } = useClipboard();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ displayName: '', photoURL: '' });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ displayName?: string, photoURL?: string }>({});
  const [showToast, setShowToast] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'users', userId),
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfileData);
        } else {
          setProfile(null);
        }
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, 'get', `users/${userId}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  const handleEditClick = () => {
    setEditForm({
      displayName: profile?.displayName || '',
      photoURL: profile?.photoURL || ''
    });
    setErrors({});
    setImageLoadError(false);
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const validateForm = () => {
    const newErrors: { displayName?: string, photoURL?: string } = {};
    if (!editForm.displayName.trim()) {
      newErrors.displayName = 'Nazwa wyświetlana nie może być pusta.';
    }
    if (editForm.photoURL.trim()) {
      try {
        new URL(editForm.photoURL);
      } catch {
        newErrors.photoURL = 'Wpisz poprawny adres URL.';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveClick = async () => {
    if (!validateForm()) {
      return;
    }
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        displayName: editForm.displayName,
        photoURL: editForm.photoURL
      });
      setIsEditing(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (e) {
      handleFirestoreError(e, 'update', `users/${userId}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6 flex items-center space-x-6 animate-pulse">
        <div className="w-16 h-16 rounded-full bg-gray-700 shrink-0"></div>
        <div className="space-y-3 flex-1">
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-red-400 mt-6 border border-red-800 bg-red-900/20 p-4 rounded-lg">Nie znaleziono profilu dla tego użytkownika.</div>;
  }

  if (isEditing) {
    return (
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Edytuj Profil</h2>
          <button onClick={handleCancelClick} className="text-gray-400 hover:text-white transition-colors duration-200">Anuluj</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Nazwa wyświetlana</label>
            <input 
              type="text" 
              value={editForm.displayName} 
              onChange={(e) => {
                setEditForm({ ...editForm, displayName: e.target.value });
                if (errors.displayName) setErrors({ ...errors, displayName: undefined });
              }}
              className={`w-full bg-gray-900 border ${errors.displayName ? 'border-red-500' : 'border-gray-700'} rounded px-3 py-2 text-white focus:outline-none focus:border-green-500`}
            />
            {errors.displayName && <p className="text-red-500 text-xs mt-1">{errors.displayName}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">URL zdjęcia (opcjonalnie)</label>
            <input 
              type="text" 
              value={editForm.photoURL} 
              onChange={(e) => {
                setEditForm({ ...editForm, photoURL: e.target.value });
                setImageLoadError(false);
                if (errors.photoURL) setErrors({ ...errors, photoURL: undefined });
              }}
              className={`w-full bg-gray-900 border ${errors.photoURL ? 'border-red-500' : 'border-gray-700'} rounded px-3 py-2 text-white focus:outline-none focus:border-green-500`}
            />
            {errors.photoURL && <p className="text-red-500 text-xs mt-1">{errors.photoURL}</p>}
            
            {editForm.photoURL && (
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-1">Podgląd:</p>
                {imageLoadError ? (
                  <div className="w-16 h-16 rounded bg-gray-800 flex items-center justify-center border border-gray-700 text-[10px] text-gray-500 text-center px-1">
                    Brak obrazka
                  </div>
                ) : (
                  <img 
                    src={editForm.photoURL} 
                    alt="Podgląd zdjęcia profilowego" 
                    className="h-16 max-w-[100px] object-cover rounded bg-gray-800 border border-gray-700"
                    onError={() => setImageLoadError(true)}
                    onLoad={() => setImageLoadError(false)}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end pt-2">
            <button 
              onClick={handleSaveClick} 
              disabled={saving}
              className="px-4 py-2 bg-green-800 hover:bg-green-700 text-white rounded transition-colors duration-200 disabled:opacity-50"
            >
              {saving ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-lg p-6 flex justify-between items-center">
        <div className="flex items-center space-x-6">
          {profile.photoURL ? (
            <img 
              src={profile.photoURL} 
              alt={profile.displayName || 'Awatar użytkownika'} 
              className="w-16 h-16 rounded-full bg-gray-700" 
              referrerPolicy="no-referrer"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-xl font-bold text-white">
              <User className="w-8 h-8 text-gray-300" />
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{profile.displayName || 'Anonimowy Użytkownik'}</h2>
            <p className="text-gray-400 mt-1">{profile.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => copy(`${window.location.origin}/profile/${userId}`)} 
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors duration-200 flex items-center gap-1.5"
            title="Skopiuj link do profilu"
          >
            {hasCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            {hasCopied ? 'Skopiowano' : 'Udostępnij profil'}
          </button>
          <button onClick={handleEditClick} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors duration-200">
            Edytuj
          </button>
        </div>
      </div>

      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-900/90 border border-green-700 text-green-100 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 z-50">
          <CheckCircle2 className="w-5 h-5 text-green-400" />
          <p className="font-medium text-sm">Profil zaktualizowany pomyślnie</p>
        </div>
      )}
    </>
  );
}
