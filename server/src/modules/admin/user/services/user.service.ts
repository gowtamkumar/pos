import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
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

    const qb = this.userRepo
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.name',
        'user.email',
        'user.username',
        'user.isAdmin',
        'user.roles',
        'user.status',
        'user.avatarUrl',
        'user.createdAt',
        'user.updatedAt',
      ])
      .orderBy('user.createdAt', 'DESC')

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
    this.logger.log(`${this.getUser.name} Service Called for id: ${id}`)

    const user = await this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'name',
        'email',
        'username',
        'isAdmin',
        'roles',
        'status',
        'avatarUrl',
        'createdAt',
        'updatedAt',
      ],
    })
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`)
    }
    return user
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { id } })
  }

  async findUserByUsername(username: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { username } })
  }

  async findByCredential(credential: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({
      where: [{ username: credential }, { email: credential }],
    })
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepo.findOne({ where: { email } })
  }

  async saveUser(user: UserEntity): Promise<UserEntity> {
    return this.userRepo.save(user)
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserEntity> {
    this.logger.log(`${this.createUser.name} Service Called for username: ${createUserDto.username}`)

    // Check duplicate username
    const existingUser = await this.findUserByUsername(createUserDto.username)
    if (existingUser) {
      throw new ConflictException(`Username '${createUserDto.username}' is already in use`)
    }

    // Check duplicate email
    if (createUserDto.email) {
      const existingEmail = await this.findUserByEmail(createUserDto.email)
      if (existingEmail) {
        throw new ConflictException(`Email '${createUserDto.email}' is already registered`)
      }
    }

    const hashPassword = await bcrypt.hash(createUserDto.password, 10)
    const assignedRoles =
      createUserDto.roles && createUserDto.roles.length > 0
        ? createUserDto.roles
        : [UserRole.Cashier]
    const isAdmin = assignedRoles.includes(UserRole.Admin)

    const user = this.userRepo.create({
      ...createUserDto,
      roles: assignedRoles,
      isAdmin,
      password: hashPassword,
    })

    const savedUser = await this.userRepo.save(user)
    delete savedUser.password

    return savedUser
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    this.logger.log(`${this.updateUser.name} Service Called for id: ${id}`)

    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`)
    }

    // Check if new username conflicts with another user
    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existing = await this.findUserByUsername(updateUserDto.username)
      if (existing && existing.id !== id) {
        throw new ConflictException(`Username '${updateUserDto.username}' is already in use`)
      }
    }

    // Check if new email conflicts with another user
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existing = await this.findUserByEmail(updateUserDto.email)
      if (existing && existing.id !== id) {
        throw new ConflictException(`Email '${updateUserDto.email}' is already registered`)
      }
    }

    if (updateUserDto.roles) {
      user.isAdmin = updateUserDto.roles.includes(UserRole.Admin)
    }

    this.userRepo.merge(user, updateUserDto)
    const updatedUser = await this.userRepo.save(user)
    delete updatedUser.password

    return updatedUser
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<UserEntity> {
    this.logger.log(`${this.updatePassword.name} Service Called for id: ${id}`)

    const { currentPassword, newPassword } = updatePasswordDto

    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`)
    }

    const valid = await this.validateUser(user, currentPassword)
    if (!valid) {
      throw new UnauthorizedException('Current password does not match')
    }

    user.password = await bcrypt.hash(newPassword, 10)
    const updatedUser = await this.userRepo.save(user)
    delete updatedUser.password

    return updatedUser
  }

  async resetPassword(id: string, password: string): Promise<UserEntity> {
    this.logger.log(`${this.resetPassword.name} Service Called for id: ${id}`)

    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`)
    }

    user.password = await bcrypt.hash(password, 10)
    const updatedUser = await this.userRepo.save(user)
    delete updatedUser.password

    return updatedUser
  }

  async deleteUser(id: string, currentUserId?: string): Promise<UserEntity> {
    this.logger.log(`${this.deleteUser.name} Service Called for id: ${id}`)

    if (currentUserId && id === currentUserId) {
      throw new BadRequestException('Security violation: You cannot delete your own account')
    }

    const user = await this.userRepo.findOne({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with ID '${id}' not found`)
    }

    const deletedUser = await this.userRepo.remove(user)
    delete deletedUser.password

    return deletedUser
  }

  validateUser(user: UserEntity, password: string): Promise<boolean> {
    if (!user || !user.password) return Promise.resolve(false)
    return bcrypt.compare(password, user.password)
  }
}
