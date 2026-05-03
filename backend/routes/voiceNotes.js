import express from 'express';
import { getVoiceNotes, addVoiceNote, deleteVoiceNote, upload } from '../controllers/voiceNotesController.js';

const router = express.Router({ mergeParams: true });

router.get('/', getVoiceNotes);
router.post('/', upload.single('audio'), addVoiceNote);
router.delete('/:noteId', deleteVoiceNote);

export default router;
