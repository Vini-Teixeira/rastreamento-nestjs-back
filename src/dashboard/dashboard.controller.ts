import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { AdminAuthGuard } from 'src/auth/guards/admin-auth.guard';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';

@Controller('dashboard')
@UseGuards(AdminAuthGuard)
export class DashboardController {
    constructor(private readonly dashboardService: DashboardService) {}

    @Get('summary')
    async getSummary(): Promise<DashboardSummaryDto> {
        return this.dashboardService.getDashboardSummary()
    }
}