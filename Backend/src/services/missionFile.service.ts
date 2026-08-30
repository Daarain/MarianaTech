import { MissionFileModel, IMissionFileDoc } from '../models/missionFile.model';
import { validateFileMetadata, calculateBufferChecksum } from '../utils/fileValidation';
import { storageService } from './storage.service';

export async function createFileMetadataFromMission(
  missionId: string,
  files: { name: string; size: number }[]
): Promise<IMissionFileDoc[]> {
  const fileDocs: IMissionFileDoc[] = [];

  for (const f of files) {
    const validation = validateFileMetadata(f.name, f.size);

    const doc = await MissionFileModel.create({
      missionId,
      fileName: f.name,
      originalFileName: f.name,
      size: f.size,
      format: validation.format,
      mimeType: validation.mimeType,
      checksum: '',
      storageProvider: (process.env.STORAGE_PROVIDER as any) || 'local',
      storagePath: `pending_binary_upload/${f.name}`,
      uploadStatus: 'pending',
      validationStatus: validation.isValid ? 'valid' : 'invalid',
    });

    fileDocs.push(doc);
  }

  return fileDocs;
}

export async function uploadMissionFileRecord(
  missionId: string,
  file: Express.Multer.File
): Promise<IMissionFileDoc> {
  const validation = validateFileMetadata(file.originalname, file.size, file.mimetype);

  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid file uploaded');
  }

  const checksum = calculateBufferChecksum(file.buffer);
  const saveResult = await storageService.saveFile(missionId, file.originalname, file.buffer);

  // Store metadata & storage reference in MongoDB (never store raw binary buffers in Mongo)
  const doc = await MissionFileModel.create({
    missionId,
    fileName: file.filename || file.originalname,
    originalFileName: file.originalname,
    size: file.size,
    format: validation.format,
    mimeType: validation.mimeType,
    checksum,
    storageProvider: saveResult.storageProvider,
    storagePath: saveResult.storagePath,
    uploadStatus: 'completed',
    validationStatus: 'valid',
  });

  // Note: AI processing is NOT started automatically upon upload as per requirements.
  return doc;
}

export async function getFilesForMission(missionId: string): Promise<IMissionFileDoc[]> {
  const files = await MissionFileModel.find({ missionId }).sort({ createdAt: -1 });
  return files;
}
