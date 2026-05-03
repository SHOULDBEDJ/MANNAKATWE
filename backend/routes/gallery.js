import { Router } from 'express';
import { upload } from '../middleware/upload.js';
import { 
  getAlbums, createAlbum, updateAlbum, deleteAlbum,
  getAlbumMedia, uploadMedia, deleteMedia 
} from '../controllers/galleryController.js';

const router = Router();

router.get('/albums', getAlbums);
router.post('/albums', createAlbum);
router.put('/albums/:id', updateAlbum);
router.delete('/albums/:id', deleteAlbum);

router.get('/albums/:id/media', getAlbumMedia);
router.post('/albums/:id/media', upload.array('media', 20), uploadMedia);
router.delete('/media/:id', deleteMedia);

export default router;
