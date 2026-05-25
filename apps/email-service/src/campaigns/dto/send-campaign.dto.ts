// Re-export so consumers can import from a path that mirrors the route name
// (`/campaigns/:id/send`). The actual definitions live alongside CreateCampaignDto.
export { SendCampaignDto, RecipientDto } from './create-campaign.dto';
