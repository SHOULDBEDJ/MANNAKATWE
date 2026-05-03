import { Router } from 'express';
import multer from 'multer';
import { 
  getKpiConfig, updateKpiConfig, backupData, restoreData, deleteAllData 
} from '../controllers/settingsController.js';

const router = Router();
const upload = multer({ dest: 'temp_uploads/' });

router.get('/kpi-config', getKpiConfig);
router.put('/kpi-config', updateKpiConfig);

router.get('/backup', backupData);
router.post('/restore', upload.single('backup'), restoreData);
router.delete('/delete-all', deleteAllData);

export default router;
