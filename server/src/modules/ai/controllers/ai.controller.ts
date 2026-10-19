import { Controller, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../admin/auth/guards/jwt-auth.guard'
import { RolesGuard } from '../../admin/auth/guards/roles.guard'
import { Roles } from '../../admin/auth/decorators/roles.decorator'
import { UserRole } from '../../admin/user/enums/user-role.enum'
import { SalesInsightQueryDto } from '../dtos/sales-insight-query.dto'
import { AiService } from '../services/ai.service'

@ApiTags('AI Insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Cashier)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('/sales-insights')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate AI sales insights and urgent restock recommendations',
  })
  @ApiResponse({
    status: 200,
    description: 'AI sales insights and restock predictions generated successfully',
  })
  async generateSalesInsights(@Query() queryDto: SalesInsightQueryDto) {
    const days = queryDto.days ?? 1
    const insights = await this.aiService.generateSalesInsights(days)
    return {
      success: true,
      statusCode: 200,
      message: 'AI sales insights generated successfully',
      data: insights,
    }
  }
}
