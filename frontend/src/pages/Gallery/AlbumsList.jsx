import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { getAlbums, createAlbum, updateAlbum, deleteAlbum } from '../../api/gallery.js';
import { Plus, Pencil, Trash2, Folder, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlbumsList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [albums, setAlbums] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('add'); // 'add' or 'edit'
  const [selectedAlbum, setSelectedAlbum] = useState(null);
  const [albumName, setAlbumName] = useState('');
  
  const [activeActions, setActiveActions] = useState(null); // id of album showing actions
  
  const timerRef = useRef(null);

  const fetchAlbums = async () => {
    try {
      const res = await getAlbums();
      setAlbums(res.data);
    } catch (err) {
      toast.error('Failed to load albums');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlbums();
  }, []);

  const handleTouchStart = (id) => {
    timerRef.current = setTimeout(() => {
      setActiveActions(id);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };

  const openModal = (type, album = null) => {
    setModalType(type);
    setSelectedAlbum(album);
    setAlbumName(album ? album.name : '');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!albumName.trim()) return;
    try {
      if (modalType === 'add') {
        await createAlbum({ name: albumName.trim() });
        toast.success('Album created');
      } else {
        await updateAlbum(selectedAlbum.id, { name: albumName.trim() });
        toast.success('Album renamed');
      }
      setShowModal(false);
      setActiveActions(null);
      fetchAlbums();
    } catch (err) {
      toast.error('Failed to save album');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete album and all its media?')) return;
    try {
      await deleteAlbum(id);
      toast.success('Album deleted');
      setActiveActions(null);
      fetchAlbums();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="container" style={{ paddingBottom: '120px', background: 'var(--color-background)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ padding: 'var(--spacing-md)', background: 'var(--glass-bg)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>{t('gallery')}</h1>
      </div>

      <div style={{ padding: 'var(--spacing-md)' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>Loading...</div>
        ) : albums.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-secondary)' }}>
            <Folder size={64} style={{ opacity: 0.2, marginBottom: '16px' }} />
            <p style={{ fontSize: '1.1rem' }}>No albums yet. Create one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md-grid-cols-4 lg-grid-cols-6">
            {albums.map(album => (
              <div 
                key={album.id}
                onMouseDown={() => handleTouchStart(album.id)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchStart={() => handleTouchStart(album.id)}
                onTouchEnd={handleTouchEnd}
                onClick={() => {
                  if (activeActions === album.id) return;
                  navigate(`/gallery/${album.id}`);
                }}
                style={{ 
                  position: 'relative', 
                  background: 'var(--color-surface)', 
                  borderRadius: 'var(--radius-md)', 
                  overflow: 'hidden', 
                  boxShadow: 'var(--shadow-md)', 
                  cursor: 'pointer', 
                  border: activeActions === album.id ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                className="album-card"
              >
                {/* Cover Image */}
                <div style={{ aspectRatio: '1', background: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {album.cover_url ? (
                    <img src={album.cover_url} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
                  ) : (
                    <Folder size={48} style={{ opacity: 0.1, color: 'var(--color-primary)' }} />
                  )}
                  
                  {/* Media Count Badge */}
                  <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', color: 'white', fontSize: '0.75rem', padding: '4px 10px', borderRadius: 'var(--radius-lg)', fontWeight: 700 }}>
                    {album.media_count}
                  </div>
                </div>

                {/* Album Name */}
                <div style={{ padding: 'var(--spacing-sm)', textAlign: 'center', background: 'white' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--color-text)' }}>
                    {album.name}
                  </div>
                </div>

                {/* Action Row (Overlay) */}
                {activeActions === album.id && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', zIndex: 5 }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <button onClick={(e) => { e.stopPropagation(); openModal('edit', album); }} style={{ background: 'var(--color-info)', color: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                        <Pencil size={22} />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); handleDelete(album.id); }} style={{ background: 'var(--color-error)', color: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>
                        <Trash2 size={22} />
                      </button>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setActiveActions(null); }} style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => openModal('add')}
        style={{ 
          position: 'fixed', 
          bottom: 'calc(var(--nav-height) + var(--spacing-lg))', 
          right: 'var(--spacing-lg)', 
          width: '60px', 
          height: '60px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)', 
          color: 'white', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          boxShadow: '0 8px 24px rgba(139, 92, 246, 0.4)', 
          zIndex: 50,
          border: 'none'
        }}
      >
        <Plus size={32} />
      </button>

      {/* Album Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-lg)' }}>
          <div style={{ background: 'var(--color-surface)', width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-md)', padding: 'var(--spacing-lg)', boxShadow: 'var(--shadow-lg)' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
              {modalType === 'add' ? 'New Album' : 'Rename Album'}
            </h2>
            <input 
              type="text" 
              value={albumName} 
              onChange={e => setAlbumName(e.target.value)} 
              placeholder="Album name"
              autoFocus
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)', marginBottom: '20px' }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowModal(false)} style={{ flex: 1, padding: '12px', background: 'var(--color-background)', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>Cancel</button>
              <button onClick={handleSave} style={{ flex: 1, padding: '12px', background: 'var(--color-primary)', color: 'white', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
