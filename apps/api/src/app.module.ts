import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { TemplatesModule } from './templates/templates.module';
import { InvitationsModule } from './invitations/invitations.module';
import { ParticipantsModule } from './participants/participants.module';
import { LocationsModule } from './locations/locations.module';
import { MissionsModule } from './missions/missions.module';
import { PhotosModule } from './photos/photos.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ParticipantsExampleModule } from './participants_example/participants-example.module';
import { SendLogsModule } from './send-logs/send-logs.module';
import { S3Module } from './s3/s3.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { BlocklistModule } from './blocklist/blocklist.module';
import { AdminModule } from './admin/admin.module';
import { FaqModule } from './faq/faq.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]),
    DatabaseModule,
    AuthModule,
    UsersModule,
    TemplatesModule,
    InvitationsModule,
    ParticipantsModule,
    LocationsModule,
    MissionsModule,
    PhotosModule,
    FeedbacksModule,
    NotificationsModule,
    InquiriesModule,
    S3Module,
    ParticipantsExampleModule,
    SendLogsModule,
    BlocklistModule,
    AdminModule,
    FaqModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
