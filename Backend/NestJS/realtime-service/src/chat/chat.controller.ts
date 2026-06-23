import { Controller, Get, Headers, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiTags, ApiOperation, ApiQuery, ApiHeader } from '@nestjs/swagger';

@ApiTags('Chat')
@Controller('api/v1/chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('token')
  @ApiOperation({ summary: 'Lấy Firebase Custom Token cho Chat (Member hoặc Guest)' })
  @ApiHeader({
    name: 'authorization',
    required: false,
    description: 'Bearer Token của Member đã đăng nhập',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Email của khách vãng lai',
  })
  @ApiQuery({
    name: 'orderCode',
    required: false,
    description: 'Mã đơn hàng của khách vãng lai',
  })
  async getChatToken(
    @Headers('authorization') authHeader?: string,
    @Query('email') email?: string,
    @Query('orderCode') orderCode?: string,
  ) {
    const result = await this.chatService.getChatToken(authHeader, { email, orderCode });
    return {
      success: true,
      message: 'Lấy token chat Firebase thành công',
      data: result,
    };
  }
}
