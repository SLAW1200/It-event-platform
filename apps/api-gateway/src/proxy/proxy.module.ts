// Proxy feature module — owns the route table (controller) and the axios-
// backed forwarder (service). HttpModule supplies the shared HttpService.
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';

@Module({
  imports: [HttpModule],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
