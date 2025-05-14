import { Module } from '@nestjs/common';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';
import { SequelizeModule } from '@nestjs/sequelize';
import { Master } from './models/master.model';

@Module({
  imports: [SequelizeModule.forFeature([Master])],
  controllers: [],
  providers: [BotService, BotUpdate],
})
export class BotModule {}
