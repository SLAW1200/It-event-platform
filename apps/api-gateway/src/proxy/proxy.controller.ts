import {
  All, Controller, Req, Res, Param, UseGuards, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProxyService } from './proxy.service';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
];

@Controller()
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  // ── Public (unauthenticated) surface ──────────────────────────────────────
  // The attendee-facing event page and self-registration must work without a
  // login. These routes carry no JwtAuthGuard and rewrite onto the dedicated
  // public service endpoints (which only expose live events / safe fields).

  @All('public/events/:id')
  publicEventProxy(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.proxyService.forward(
      req,
      res,
      'event-service',
      `/api/v1/events/${id}/public`,
    );
  }

  @All('public/register')
  publicRegisterProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(
      req,
      res,
      'registration-service',
      '/api/v1/registrations/public',
    );
  }

  @All(['auth', 'auth/*'])
  authProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'user-service');
  }

  @All(['users', 'users/*'])
  @UseGuards(JwtAuthGuard)
  usersProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'user-service');
  }

  @All(['events', 'events/*'])
  @UseGuards(JwtAuthGuard)
  eventsProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'event-service');
  }

  @All(['registrations', 'registrations/*'])
  @UseGuards(JwtAuthGuard)
  registrationsProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'registration-service');
  }

  @All(['form-fields', 'form-fields/*'])
  @UseGuards(JwtAuthGuard)
  formFieldsProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'registration-service');
  }

  @All(['checkin', 'checkin/*'])
  @UseGuards(JwtAuthGuard)
  checkinProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'checkin-service');
  }

  @All(['campaigns', 'campaigns/*'])
  @UseGuards(JwtAuthGuard)
  campaignsProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'email-service');
  }

  @All(['analytics', 'analytics/*'])
  @UseGuards(JwtAuthGuard)
  analyticsProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'analytics-service');
  }

  @All(['tasks', 'tasks/*'])
  @UseGuards(JwtAuthGuard)
  tasksProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'task-service');
  }

  @All(['tickets', 'tickets/*'])
  @UseGuards(JwtAuthGuard)
  ticketsProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'support-service');
  }

  @All(['networking', 'networking/*'])
  @UseGuards(JwtAuthGuard)
  networkingProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'networking-service');
  }

  @All(['files', 'files/*'])
  @UseGuards(JwtAuthGuard)
  filesProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'file-service');
  }

  @All(['notifications', 'notifications/*'])
  @UseGuards(JwtAuthGuard)
  notificationsProxy(@Req() req: Request, @Res() res: Response) {
    return this.proxyService.forward(req, res, 'notification-service');
  }
}