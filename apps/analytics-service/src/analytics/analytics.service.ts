import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Registration, CheckIn, EmailCampaign, Event } from '@event-platform/database';
import { RegistrationStatus } from '@event-platform/shared';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectRepository(Registration)
    private readonly registrationRepo: Repository<Registration>,
    @InjectRepository(CheckIn)
    private readonly checkInRepo: Repository<CheckIn>,
    @InjectRepository(EmailCampaign)
    private readonly campaignRepo: Repository<EmailCampaign>,
    @InjectRepository(Event)
    private readonly eventRepo: Repository<Event>,
  ) {}

  async getEventDashboard(eventId: number) {
    const [
      totalRegistrations,
      confirmedRegistrations,
      checkedIn,
      revenue,
      campaigns,
    ] = await Promise.all([
      this.registrationRepo.count({ where: { eventId } }),
      this.registrationRepo.count({ where: { eventId, status: RegistrationStatus.CONFIRMED } }),
      this.registrationRepo.count({ where: { eventId, status: RegistrationStatus.CHECKED_IN } }),
      this.registrationRepo
        .createQueryBuilder('r')
        .select('SUM(r.amountPaid)', 'total')
        .where('r.eventId = :eventId', { eventId })
        .getRawOne(),
      this.campaignRepo.find({ where: { eventId } }),
    ]);

    const totalRevenue = parseFloat(revenue?.total || '0');
    const emailStats = campaigns.reduce(
      (acc, c) => ({
        sent: acc.sent + c.totalSent,
        opened: acc.opened + c.totalOpened,
        clicked: acc.clicked + c.totalClicked,
      }),
      { sent: 0, opened: 0, clicked: 0 },
    );

    return {
      eventId,
      registrations: {
        total: totalRegistrations,
        confirmed: confirmedRegistrations,
        checkedIn,
        conversionRate: totalRegistrations > 0
          ? ((confirmedRegistrations / totalRegistrations) * 100).toFixed(1)
          : '0',
        attendanceRate: confirmedRegistrations > 0
          ? ((checkedIn / confirmedRegistrations) * 100).toFixed(1)
          : '0',
      },
      revenue: {
        total: totalRevenue,
        currency: 'USD',
        avgPerRegistration: confirmedRegistrations > 0
          ? (totalRevenue / confirmedRegistrations).toFixed(2)
          : '0',
      },
      email: {
        ...emailStats,
        openRate: emailStats.sent > 0
          ? ((emailStats.opened / emailStats.sent) * 100).toFixed(1)
          : '0',
        clickRate: emailStats.sent > 0
          ? ((emailStats.clicked / emailStats.sent) * 100).toFixed(1)
          : '0',
      },
    };
  }

  async getRegistrationTimeline(eventId: number) {
    return this.registrationRepo
      .createQueryBuilder('r')
      .select("DATE_TRUNC('day', r.registrationDate)", 'date')
      .addSelect('COUNT(*)', 'count')
      .where('r.eventId = :eventId', { eventId })
      .groupBy("DATE_TRUNC('day', r.registrationDate)")
      .orderBy('date', 'ASC')
      .getRawMany();
  }

  async getCheckInTimeline(eventId: number) {
    return this.checkInRepo
      .createQueryBuilder('ci')
      .innerJoin('ci.registration', 'r')
      .select("DATE_TRUNC('hour', ci.checkInTime)", 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('r.eventId = :eventId', { eventId })
      .groupBy("DATE_TRUNC('hour', ci.checkInTime)")
      .orderBy('hour', 'ASC')
      .getRawMany();
  }

  async getPricingBreakdown(eventId: number) {
    return this.registrationRepo
      .createQueryBuilder('r')
      .select('r.pricingTier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(r.amountPaid)', 'revenue')
      .where('r.eventId = :eventId', { eventId })
      .groupBy('r.pricingTier')
      .getRawMany();
  }

  async getPlatformOverview() {
    const [totalEvents, totalUsers, totalRegistrations, totalRevenue] = await Promise.all([
      this.eventRepo.count(),
      this.registrationRepo
        .createQueryBuilder('r')
        .select('COUNT(DISTINCT r.userId)', 'count')
        .getRawOne(),
      this.registrationRepo.count(),
      this.registrationRepo
        .createQueryBuilder('r')
        .select('SUM(r.amountPaid)', 'total')
        .getRawOne(),
    ]);
    return {
      totalEvents,
      totalUsers: parseInt(totalUsers?.count || '0'),
      totalRegistrations,
      totalRevenue: parseFloat(totalRevenue?.total || '0'),
    };
  }
}
