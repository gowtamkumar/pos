import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import * as bcrypt from 'bcrypt'
import { Repository } from 'typeorm'
import { paginate, PaginatedResult } from '../../../../common/helpers/paginate.helper'
import { CreateUserDto, FilterUserDto, UpdatePasswordDto, UpdateUserDto } from '../dtos'
import { UserEntity } from '../entities/user.entity'
import { UserRole } from '../enums/user-role.enum'

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name)

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
  ) {}

  async getUsers(filterUserDto: FilterUserDto): Promise<PaginatedResult<UserEntity>> {
    this.logger.log(`${this.getUsers.name} Service Called`)
    const {
      search,
      name,
      username,
      email,
      role,
      roles,
      status,
      page = 1,
      limit = 20,
    } = filterUserDto
    const activePage = Number(page) || 1
    const activeLimit = Number(limit) || 20

    const qb = this.userRepo.createQueryBuilder('user').orderBy('user.createdAt', 'DESC')

    if (search?.trim()) {
      const s = `%${search.trim()}%`
      qb.andWhere('(user.name ILIKE :s OR user.email ILIKE :s OR user.username ILIKE :s)', { s })
    }

    if (name?.trim()) {
      qb.andWhere('user.name ILIKE :name', { name: `%${name.trim()}%` })
    }

    if (email?.trim()) {
      qb.andWhere('user.email ILIKE :email', { email: `%${email.trim()}%` })
    }

    if (username?.trim()) {
      qb.andWhere('user.username ILIKE :username', { username: `%${username.trim()}%` })
    }

    const targetRole = (role || roles)?.toString().trim()
    if (
      targetRole &&
      targetRole !== 'ALL' &&
      Object.values(UserRole).includes(targetRole as UserRole)
    ) {
      qb.andWhere(':targetRole::users_roles_enum = ANY(user.roles)', { targetRole })
    }

    if (status) {
      qb.andWhere('user.status = :status', { status })
    }

    const skip = (activePage - 1) * activeLimit
    qb.skip(skip).take(activeLimit)

    const [data, total] = await qb.getManyAndCount()

    return paginate(data, total, activePage, activeLimit)
  }

  async getUser(id: string): Promise<UserEntity> {
    this.logger.log(`${this.getUser.name} Service Called`)

    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User of id ${id} not found`)
    }
    return user
  }

  async findUserById(id: string) {
    this.logger.log(`${this.findUserById.name} Service Called`)

    return this.userRepo.findOne({ where: { id } })
  }

  async findUserByUsername(username: string) {
    this.logger.log(`${this.findUserByUsername.name} Service Called`)
    return this.userRepo.findOne({ where: { username } })
  }

  async findByCredential(credential: string) {
    this.logger.log(`${this.findByCredential.name} Service Called`)
    // Try username first, then email — works for all roles (Admin, Instructor, Student)
    return this.userRepo.findOne({
      where: [{ username: credential }, { email: credential }],
    })
  }

  async findUserByEmail(email: string) {
    this.logger.log(`${this.findUserByEmail.name} Service Called`)
    return this.userRepo.findOne({ where: { email } })
  }

  async saveUser(user: UserEntity): Promise<UserEntity> {
    return this.userRepo.save(user)
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    this.logger.log(`${this.createUser.name} Service Called`)

    const hashPassword = await bcrypt.hash(createUserDto.password, 10)
    const user = this.userRepo.create({
      ...createUserDto,
      password: hashPassword,
    })
    await this.userRepo.save(user)
    delete user.password

    return user
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    this.logger.log(`${this.updateUser.name} Service Called`)

    const user = await this.userRepo.findOne({ where: { id } })

    if (!user) {
      throw new NotFoundException(`User of id ${id} not found`)
    }
    this.userRepo.merge(user, updateUserDto)
    const updatedUser = await this.userRepo.save(user)

    return updatedUser
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<UserEntity> {
    this.logger.log(`${this.updatePassword.name} Service Called`)

    const { currentPassword, newPassword } = updatePasswordDto

    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User of id ${id} not found`)
    }
    const valid = await this.validateUser(user, currentPassword)
    if (!valid) {
      throw new UnauthorizedException('Password is not valid')
    }

    user.password = await bcrypt.hash(newPassword, 10)
    const updatedUser = await this.userRepo.save(user)

    return updatedUser
  }

  async resetPassword(id: string, password: string): Promise<UserEntity> {
    this.logger.log(`${this.resetPassword.name} Service Called`)

    const user = await this.getUser(id)
    user.password = await bcrypt.hash(password, 10)
    const updatedUser = await this.userRepo.save(user)

    return updatedUser
  }

  async deleteUser(id: string): Promise<UserEntity> {
    this.logger.log(`${this.deleteUser.name} Service Called`)

    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User of id ${id} not found`)
    }
    const deletedUser = await this.userRepo.remove(user)

    return deletedUser
  }

  validateUser(user: UserEntity, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password)
  }
}
