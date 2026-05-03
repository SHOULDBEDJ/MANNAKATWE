import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import { getAlbumMedia, uploadMedia, deleteMedia } from '../../api/gallery.js';
import { ArrowLeft, Camera, Upload, X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AlbumDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { t } = useTranslation();
  
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Carousel state
  const [carouselIndex, setCarouselIndex] = useState(null); // null means closed
  const [touchStart, setTouchStart] = useState(null);

  const fetchMedia = async () => {
    try {
      const res = await getAlbumMedia(id);
      setMedia(res.data);
    } catch (err) {
      toast.error(t('failed_to_load') || 'Failed to load media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [id]);

  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const loadingToast = toast.loading(t('uploading') || 'Uploading...');
    try {
      await uploadMedia(id, files);
      toast.success(t('upload_success') || 'Media uploaded', { id: loadingToast });
      fetchMedia();
    } catch (err) {
      toast.error(t('upload_failed') || 'Upload failed', { id: loadingToast });
    }
  };

  const handleDelete = async (e, mediaId) => {
    e.stopPropagation();
    if (!window.confirm(t('confirm_delete') || 'Delete this item?')) return;
    try {
      await deleteMedia(mediaId);
      toast.success(t('delete_success') || 'Item deleted');
      fetchMedia();
    } catch (err) {
      toast.error(t('failed_to_delete') || 'Delete failed');
    }
  };

  // Carousel Handlers
  const handleNext = () => {
    if (carouselIndex < media.length - 1) setCarouselIndex(carouselIndex + 1);
  };
  const handlePrev = () => {
    if (carouselIndex > 0) setCarouselIndex(carouselIndex - 1);
  };
  
  const handleTouchStart = (e) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    if (touchStart - touchEnd > 70) handleNext(); // swipe left
    if (touchStart - touchEnd < -70) handlePrev(); // swipe right
    setTouchStart(null);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '24px' }}>{t('loading')}</div>;

  return (
    <div style={{ paddingBottom: '100px', background: 'var(--color-background)', minHeight: '100vh' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: 'var(--spacing-md)', background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={() => navigate('/gallery')} style={{ marginRight: 'var(--spacing-md)' }}>
          <ArrowLeft size={24} />
        </button>
        <h1 style={{ flex: 1, fontSize: '1.125rem', fontWeight: 600 }}>{t('media_list') || 'Media List'}</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <label style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>
            <Camera size={24} />
            <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
          <label style={{ cursor: 'pointer', color: 'var(--color-primary)' }}>
            <Upload size={24} />
            <input type="file" multiple accept="image/*,video/*" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      <div style={{ padding: '8px' }}>
        {media.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-secondary)' }}>
            {t('no_media')}
          </div>
        ) : (
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', 
            gap: '4px' 
          }}>
            {media.map((item, index) => (
              <div 
                key={item.id} 
                onClick={() => setCarouselIndex(index)}
                style={{ aspectRatio: '1', position: 'relative', background: 'var(--color-surface)', overflow: 'hidden' }}
              >
                {item.media_type === 'video' ? (
                  <video src={item.file_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <img src={item.file_url} alt="Gallery" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                
                <button 
                  onClick={(e) => handleDelete(e, item.id)}
                  style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(255,0,0,0.7)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px' }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Carousel Viewer */}
      {carouselIndex !== null && (
        <div 
          style={{ position: 'fixed', inset: 0, background: 'black', zIndex: 1000, display: 'flex', flexDirection: 'column' }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Top Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', color: 'white' }}>
            <span style={{ fontWeight: 600 }}>{carouselIndex + 1} / {media.length}</span>
            <button onClick={() => setCarouselIndex(null)} style={{ color: 'white' }}>
              <X size={28} />
            </button>
          </div>

          {/* Media Container */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {media[carouselIndex].media_type === 'video' ? (
              <video src={media[carouselIndex].file_url} controls autoPlay style={{ maxWidth: '100%', maxHeight: '100%' }} />
            ) : (
              <img src={media[carouselIndex].file_url} alt="Full" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            )}

            {/* Navigation Arrows */}
            <button 
              disabled={carouselIndex === 0}
              onClick={handlePrev} 
              style={{ position: 'absolute', left: '12px', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '12px', borderRadius: '50%', border: 'none', opacity: carouselIndex === 0 ? 0.3 : 1 }}
            >
              <ChevronLeft size={32} />
            </button>
            <button 
              disabled={carouselIndex === media.length - 1}
              onClick={handleNext} 
              style={{ position: 'absolute', right: '12px', background: 'rgba(255,255,255,0.2)', color: 'white', padding: '12px', borderRadius: '50%', border: 'none', opacity: carouselIndex === media.length - 1 ? 0.3 : 1 }}
            >
              <ChevronRight size={32} />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
