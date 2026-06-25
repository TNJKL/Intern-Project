import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { ChatSession } from './entities/chat-session.entity';

@Module({
  imports: [
    FirebaseModule,
    TypeOrmModule.forFeature([ChatSession], 'chatConnection'),
  ],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
