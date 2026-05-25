// File-upload service. Wraps S3 with three opinionated entry points
// (cover/document/avatar) each enforcing its own MIME-type allow-list, plus
// a generic uploadFile() for everything else. Keys are namespaced by folder
// (`events/<id>/...`, `users/<id>/...`) so listing/deleting by prefix is easy.
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { S3 } from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

// MIME allow-lists. Server-side enforcement — clients can lie about file
// extensions, but `file.mimetype` is detected by multer from magic bytes.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly s3: S3;
  private readonly bucket: string;
  private readonly cdnUrl: string;

  constructor() {
    this.s3 = new S3({ region: process.env.AWS_REGION || 'us-east-1' });
    this.bucket = process.env.AWS_S3_BUCKET || 'it-event-platform-files';
    this.cdnUrl = process.env.AWS_CLOUDFRONT_URL || '';
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'uploads',
    userId?: number,
  ): Promise<{ key: string; url: string; cdnUrl: string }> {
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File too large. Max size is ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Random UUID prevents collisions and frustrates URL-guessing. Keep the
    // original extension so the CDN serves the right Content-Type.
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;

    await this.s3.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        originalName: file.originalname,
        uploadedBy: userId?.toString() || 'anonymous',
        uploadedAt: new Date().toISOString(),
      },
    }).promise();

    // Return both URLs so callers can choose: direct S3 for private flows
    // (signed access), CDN-fronted for public assets like event covers.
    const s3Url = `https://${this.bucket}.s3.amazonaws.com/${key}`;
    const cdnFileUrl = this.cdnUrl ? `${this.cdnUrl}/${key}` : s3Url;

    this.logger.log(`File uploaded: ${key} (${file.size} bytes)`);
    return { key, url: s3Url, cdnUrl: cdnFileUrl };
  }

  async uploadEventCover(file: Express.Multer.File, eventId: number) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, and GIF images are allowed');
    }
    return this.uploadFile(file, `events/${eventId}/covers`);
  }

  async uploadDocument(file: Express.Multer.File, eventId: number) {
    if (![...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOC_TYPES].includes(file.mimetype)) {
      throw new BadRequestException('File type not allowed');
    }
    return this.uploadFile(file, `events/${eventId}/documents`);
  }

  async uploadAvatar(file: Express.Multer.File, userId: number) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException('Only image files are allowed for avatars');
    }
    return this.uploadFile(file, `users/${userId}/avatars`);
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.deleteObject({ Bucket: this.bucket, Key: key }).promise();
    this.logger.log(`File deleted: ${key}`);
  }

  // Mints a short-lived signed GET URL for private objects (default 1h).
  // Used when content must be auth-gated server-side before serving.
  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    return this.s3.getSignedUrlPromise('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expiresIn,
    });
  }

  async listFiles(prefix: string): Promise<string[]> {
    const result = await this.s3.listObjectsV2({
      Bucket: this.bucket,
      Prefix: prefix,
    }).promise();
    return (result.Contents || []).map((obj) => obj.Key);
  }
}
