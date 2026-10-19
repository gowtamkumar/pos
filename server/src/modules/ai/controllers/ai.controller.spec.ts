import { HttpStatus } from '@nestjs/common'
import { HTTP_CODE_METADATA } from '@nestjs/common/constants'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from '../../admin/auth/decorators/roles.decorator'
import { UserRole } from '../../admin/user/enums/user-role.enum'
import { AiController } from './ai.controller'
import { AiService } from '../services/ai.service'

describe('AiController', () => {
  it('sets HTTP 200 and restricts access to the documented POS roles', () => {
    const reflector = new Reflector()
    expect(reflector.get(HTTP_CODE_METADATA, AiController.prototype.generateSalesInsights)).toBe(
      HttpStatus.OK,
    )
    expect(reflector.get(ROLES_KEY, AiController)).toEqual([UserRole.Admin, UserRole.Cashier])
  })

  it('passes the requested day range to the service', async () => {
    const generateSalesInsights = jest.fn().mockResolvedValue({ engine: 'test' })
    const controller = new AiController({ generateSalesInsights } as unknown as AiService)
    const result = await controller.generateSalesInsights({ days: 7 })
    expect(generateSalesInsights).toHaveBeenCalledWith(7)
    expect(result).toMatchObject({ success: true, statusCode: 200, data: { engine: 'test' } })
  })
})
