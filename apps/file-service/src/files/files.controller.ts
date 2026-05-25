// HTTP routes for the file-service. Each upload endpoint uses Multer's
// memoryStorage so the buffer streams straight into S3 — nothing touches
// the local disk.
import {
  Controller, Post, Delete, Get,
  Param, ParseIntPipe, UploadedFile, UseInterceptors, Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { FilesService } from './files.service';

// Buffer uploads in RAM; S3 upload happens before the handler returns, so
// peak memory is bounded by MAX_FILE_SIZE per concurrent upload.
const multerOpts = { storage: memoryStorage() };

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
export class FilesController {
  constructor(private readonly service: FilesService) {}

  @Post('events/:eventId/cover')
  @UseInterceptors(FileInterceptor('file', multerOpts))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload event cover image' })
  uploadCover(
    @UploadedFile() file: Express.Multer.File,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) { return this.service.uploadEventCover(file, eventId); }

  @Post('events/:eventId/documents')
  @UseInterceptors(FileInterceptor('file', multerOpts))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload event document' })
  uploadDocument(
    @UploadedFile() file: Express.Multer.File,
    @Param('eventId', ParseIntPipe) eventId: number,
  ) { return this.service.uploadDocument(file, eventId); }

  @Post('users/:userId/avatar')
  @UseInterceptors(FileInterceptor('file', multerOpts))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('userId', ParseIntPipe) userId: number,
  ) { return this.service.uploadAvatar(file, userId); }

  @Get('signed-url')
  @ApiOperation({ summary: 'Get signed URL for private file' })
  getSignedUrl(@Query('key') key: string) {
    return this.service.getSignedUrl(key);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete a file by key' })
  deleteFile(@Query('key') key: string) {
    return this.service.deleteFile(key);
  }
}
