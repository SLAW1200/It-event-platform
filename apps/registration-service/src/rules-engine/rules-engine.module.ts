// Rules-engine feature module. No repositories — the engine is stateless,
// so other modules just import this and inject RulesEngineService.
import { Module } from '@nestjs/common';
import { RulesEngineService } from './rules-engine.service';

@Module({
  providers: [RulesEngineService],
  exports: [RulesEngineService],
})
export class RulesEngineModule {}
