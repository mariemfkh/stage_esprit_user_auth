import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('mongoUri'),
        connectionFactory: (connection: {
          on: (event: string, callback: (err: Error) => void) => void;
          once: (event: string, callback: () => void) => void;
        }) => {
          connection.on('error', (err: Error) => {
            console.error('❌ MongoDB connection error:', err.message);
          });
          connection.once('open', () => {
            console.log('✅ MongoDB connected successfully');
          });
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
