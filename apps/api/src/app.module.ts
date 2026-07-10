import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { TemplatesModule } from './templates/templates.module';
import { InvitationsModule } from './invitations/invitations.module';
import { AiGenerationsModule } from './ai-generations/ai-generations.module';
import { ParticipantsModule } from './participants/participants.module';
import { LocationsModule } from './locations/locations.module';
import { MissionsModule } from './missions/missions.module';
import { PhotosModule } from './photos/photos.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PushModule } from './push/push.module';
import { TextBlastsModule } from './text-blasts/text-blasts.module';
import { QuestionnaireModule } from './questionnaire/questionnaire.module';
import { ParticipantsExampleModule } from './participants_example/participants-example.module';
import { SendLogsModule } from './send-logs/send-logs.module';
import { S3Module } from './s3/s3.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { BlocklistModule } from './blocklist/blocklist.module';
import { AdminModule } from './admin/admin.module';
import { FaqModule } from './faq/faq.module';
import { AiModule } from './ai/ai.module';
import { TermsModule } from './terms/terms.module';
import { DateVoteModule } from './date-vote/date-vote.module';
import { ActivityFeedModule } from './activity-feed/activity-feed.module';
import { SettlementsModule } from './settlements/settlements.module';
import { ReportsModule } from './reports/reports.module';
import { DevAuthModule } from './dev/dev-auth.module';
import { WeatherModule } from './weather/weather.module';
import { FriendsModule } from './friends/friends.module';
import { ConversationsModule } from './conversations/conversations.module';
import { HealthModule } from './health/health.module';
import { RedisModule } from './redis/redis.module';
import { QueueModule } from './queues/queue.module';
import { ImageProcessingModule } from './image-processing/image-processing.module';
import { IdempotencyModule } from './idempotency/idempotency.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    LoggerModule,
    ScheduleModule.forRoot(),
    RedisModule,
    QueueModule,
    ImageProcessingModule,
    IdempotencyModule,
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL');
        if (!url && process.env.NODE_ENV === 'production') {
          throw new Error('REDIS_URL is required in production');
        }
        return { stores: [createKeyv(url ?? 'redis://localhost:6379')] };
      },
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: process.env.NODE_ENV !== 'production' ? 10000 : 60 }]),
    DatabaseModule,
    // dev 전용: AuthController의 @Post(':provider/token') 와일드카드가 /auth/dev/token을
    // 가로채지 않도록 AuthModule보다 먼저 등록 (NestJS는 import 순서대로 controller 등록).
    // NODE_ENV !== 'production'일 때만 등록 → prod 빌드 시 자동 제외.
    ...(process.env.NODE_ENV !== 'production' ? [DevAuthModule] : []),
    AuthModule,
    UsersModule,
    TemplatesModule,
    InvitationsModule,
    AiGenerationsModule,
    ParticipantsModule,
    LocationsModule,
    MissionsModule,
    PhotosModule,
    FeedbacksModule,
    NotificationsModule,
    PushModule,
    TextBlastsModule,
    QuestionnaireModule,
    InquiriesModule,
    S3Module,
    ParticipantsExampleModule,
    SendLogsModule,
    BlocklistModule,
    AdminModule,
    FaqModule,
    AiModule,
    TermsModule,
    DateVoteModule,
    ActivityFeedModule,
    SettlementsModule,
    ReportsModule,
    WeatherModule,
    FriendsModule,
    ConversationsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
  ],
})
export class AppModule {}
