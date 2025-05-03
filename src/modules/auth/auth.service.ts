import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto, SignInDto } from './dto/create-auth.dto';
import { User, UserDocument } from '@/database/schemas/user.schema';
import { Hash } from '@/utils/Hash';
import { ConfigService } from '@nestjs/config';
import { GoogleAuthenData } from '@/shared/interfaces/google-authen-data';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signup(createAuthDto: CreateAuthDto) {
    const { email, password, username } = createAuthDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Create new user
    const hashedPassword = Hash.make(password);
    const user = await this.userModel.create({
      email,
      username,
      password: hashedPassword,
    });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(user._id.toString(), user.email);

    return {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
      accessTokenTtl: Number(this.configService.get<string>('auth.jwtExpires')),
      refreshTokenTtl: Number(this.configService.get<string>('auth.refreshTokenTime')),
    };
  }

  async signin(signInDto: SignInDto) {
    const { email, password } = signInDto;

    // Find user
    const user = await this.userModel.findOne({ email });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = Hash.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user._id.toString(), user.email);

    return {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
      },
      ...tokens,
      accessTokenTtl: Number(this.configService.get<string>('auth.jwtExpires')),
      refreshTokenTtl: Number(this.configService.get<string>('auth.refreshTokenTime')),
    };
  }

  async handleGoogleAuth(googleData: GoogleAuthenData) {
    if (!googleData.email_verified) {
      throw new UnauthorizedException('Google email not verified');
    }

    // Find user by email
    let user = await this.userModel.findOne({ email: googleData.email });

    if (user) {
      // Update existing user's Google provider if not present
      const hasGoogleProvider = user.providers.some((p) => p.provider === 'google');
      if (!hasGoogleProvider) {
        user = await this.userModel.findByIdAndUpdate(
          user._id,
          {
            $push: {
              providers: {
                provider: 'google',
                providerId: googleData.email,
              },
            },
          },
          { new: true },
        );
      }
    } else {
      // Create new user
      user = await this.userModel.create({
        email: googleData.email,
        username: googleData.name,
        avatar: googleData.picture,
        password: '', // Empty password for Google users
        providers: [
          {
            provider: 'google',
            providerId: googleData.email,
          },
        ],
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user._id.toString(), user.email);

    return {
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  private async generateTokens(userId: string, email: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('auth.secret'),
          expiresIn: this.configService.get<string>('auth.jwtExpires') + 'm',
        },
      ),
      this.jwtService.signAsync(
        {
          sub: userId,
          email,
        },
        {
          secret: this.configService.get<string>('auth.secret'),
          expiresIn: this.configService.get<string>('auth.refreshTokenTime') + 'm',
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user._id,
      email: user.email,
      username: user.username,
      avatar: user.avatar,
    };
  }
}
