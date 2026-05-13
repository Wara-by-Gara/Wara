import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminModule } from './admin/admin.module';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    DatabaseModule,
    AuthModule,
    AdminModule,
    UsersModule,
    TemplatesModule,
    InvitationsModule,
    ParticipantsModule,
    LocationsModule,
    MissionsModule,
    PhotosModule,
    FeedbacksModule,
    NotificationsModule,
    ParticipantsExampleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
