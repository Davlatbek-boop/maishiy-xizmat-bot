import { Controller } from '@nestjs/common';
import { BotService } from './bot.service';
import { Action, Command, Ctx, Hears, On, Start, Update } from 'nestjs-telegraf';
import { Context, Markup } from 'telegraf';


@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}
  @Start()
  async onStart(@Ctx() ctx: Context) {
    return this.botService.onStart(ctx)
  }

  @Hears("Ro'yxatdan o'tish")
  async onRegistr(@Ctx() ctx: Context){
    return this.botService.onRegistr(ctx)
  }

  @Hears("Usta")
  async onRegistrUsta(@Ctx() ctx: Context){
    return this.botService.onRegistrUsta(ctx)
  }
  
  @Action(/^master_\d+$/)
  async onActionMasters(@Ctx() ctx: Context){
    return this.botService.onActionMasters(ctx)
  }

  @Action(/^registr_\d+$/)
  async onActionSendToAdminAndDeleteMaster(@Ctx() ctx: Context){
    return this.botService.onActionSendToAdminAndDeleteMaster(ctx)
  }

  @Action(/^sended_\d+$/)
  async onActionCheckAndDeleteAndConnectByAdmin(@Ctx() ctx: Context){
    return this.botService.onActionCheckAndDeleteAndConnectByAdmin(ctx)
  }

  @Action(/^confirm_master_+\d/)
  async onConfirmMaster(@Ctx() ctx: Context) {
    await this.botService.onConfirmMaster(ctx);
  }


  // @Action(/^reject_master_+\d/)
  // async onRejectMaster(@Ctx() ctx: Context) {
  //   await this.botService.OnRejection(ctx);
  // }


  @On('location')
  async onLocation(@Ctx() ctx: Context){
    await this.botService.onLocation(ctx)
  }

  @On('contact')
  async OnContact(@Ctx() ctx: Context){
    await this.botService.OnContact(ctx)
  }

  @Command("stop")
  async onStop(@Ctx() ctx: Context){
    return this.botService.onStop(ctx)
  }

  @On("text")
  async onText(@Ctx() ctx: Context){
    return this.botService.onText(ctx)
  }
}
