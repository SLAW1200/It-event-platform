// Root module for file-service. No DB — file metadata lives on the parent
// entity (Event.coverImage, Task.attachments, etc) as plain S3 keys.
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FilesController } from './files/files.controller';
import { FilesService } from './files/files.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env', '../../.env'] })],
  controllers: [FilesController],
  providers: [FilesService],
})
export class AppModule {}
