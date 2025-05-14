import { Injectable } from '@nestjs/common';
import { Ctx, InjectBot } from 'nestjs-telegraf';
import { BOT_NAME } from '../app.constants';
import { Context, Markup, Telegraf } from 'telegraf';
import { text } from 'stream/consumers';
import { InjectModel } from '@nestjs/sequelize';
import { Master } from './models/master.model';
import { Op } from 'sequelize';

@Injectable()
export class BotService {
  constructor(
    @InjectBot(BOT_NAME) private readonly bot: Telegraf<Context>,
    @InjectModel(Master) private readonly masterModel: typeof Master,
  ) {}

  async onStart(ctx: Context) {
    try {
      await ctx.replyWithHTML('Assalomu alaykum', {
        ...Markup.keyboard([["Ro'yxatdan o'tish"]]).resize(),
      });
    } catch (error) {
      console.log(`Error on Start`, error);
    }
  }

  async onRegistr(ctx: Context) {
    try {
      await ctx.replyWithHTML('Tanlang', {
        ...Markup.keyboard([['Usta', 'Mijoz']]).resize(),
      });
    } catch (error) {
      console.log(`Error on Registr`, error);
    }
  }

  async onRegistrUsta(ctx: Context) {
    try {
      const workshop = [
        [
          {
            text: 'Sartaroshxona',
            callback_data: 'master_1',
          },
        ],
        [
          {
            text: "Go'zallik saloni",
            callback_data: 'master_2',
          },
        ],
        [
          {
            text: 'Zargarlik ustaxonasi',
            callback_data: 'master_3',
          },
        ],
        [
          {
            text: 'Soatsoz',
            callback_data: 'master_4',
          },
        ],
        [
          {
            text: 'Poyabzal ustaxonasi',
            callback_data: 'master_5',
          },
        ],
      ];

      await ctx.reply('Siz Usta ni tanladingiz', Markup.removeKeyboard());
      await ctx.reply(
        'Mutaxasisligingizni tanlang',
        Markup.inlineKeyboard(workshop),
      );
    } catch (error) {
      console.log(`Error on Registr usta`, error);
    }
  }

  async onActionMasters(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const master = await this.masterModel.findOne({ where: { user_id } });

      if (!master) {
        if ('data' in ctx.callbackQuery!) {
          const profession = ctx.callbackQuery.data;

          await this.masterModel.create({
            user_id: user_id!,
            username: ctx.from?.username!,
            profession: profession!,
            last_state: 'name',
          });
        }
        await ctx.deleteMessage();
        await ctx.replyWithHTML('Ismingizni kiriting');
      }
      switch (master?.last_state) {
        case 'name':
          await ctx.replyWithHTML(`Ismingizni kiriting`);
          break;

        case 'phone_number':
          await ctx.replyWithHTML(
            `Iltimos, telefon raqamingizni yuboring!`,
            Markup.keyboard([
              [Markup.button.contactRequest('📞Telefon raqam yuborish!')],
            ])
              .oneTime()
              .resize(),
          );
          break;

        case 'workshop_name':
          await ctx.replyWithHTML(`Ustaxona nomini kiriting`);
          break;

        case 'address':
          await ctx.replyWithHTML(`Ustaxona manzilini kiriting`);
          break;

        case 'destination':
          await ctx.replyWithHTML(`Manzil uchun moljal kiriting`);
          break;

        case 'location':
          await ctx.replyWithHTML(`Manzil locatsiyasini yuboring`);
          break;

        case 'start_time':
          await ctx.replyWithHTML(
            `Kunning ish boshlash vaqtini kiriting ex: 8:00`,
          );
          break;

        case 'end_time':
          await ctx.replyWithHTML(
            `Kunning ish tugash vaqtini kiriting ex: 17:00`,
          );
          break;

        case 'time_by_customer':
          await ctx.replyWithHTML(
            `Bitta mijoz uchun ketadigan o'rtacha vaqtni kiritng ex: 30:00`,
          );
          break;
      }
    } catch (error) {
      console.log(`Error on action Masters`, error);
    }
  }

  async onLocation(ctx: Context) {
    try {
      if ('location' in ctx.message!) {
        const user_id = ctx.from?.id;
        const master = await this.masterModel.findOne({ where: { user_id } });
        if (!master) {
          await ctx.reply(`Siz avval Startni bosing`, {
            parse_mode: 'HTML',
            ...Markup.keyboard([['/start']]).resize(),
          });
        } else {
          const master = await this.masterModel.findOne({
            where: {
              user_id,
              last_state: { [Op.ne]: 'finish' },
            },
            order: [['id', 'DESC']],
          });
          if (master && master.last_state == 'location') {
            master.location = `${ctx.message.location.latitude},${ctx.message.location.longitude}`;
            master.last_state = 'start_time';
            await master.save();
            await ctx.reply('Kunning ish boshlash vaqtini kiriting ex: 8:00', {
              parse_mode: 'HTML',
            });
          }
        }
      }
    } catch (error) {
      console.log(`Error on OnLocation`, error);
    }
  }

  async OnContact(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const master = await this.masterModel.findOne({ where: { user_id } });
      if (!master) {
        await ctx.replyWithHTML(
          `Iltimos, <b>/start</b> tugmasini bosing!`,
          Markup.keyboard([['/start']])
            .oneTime()
            .resize(),
        );
        return;
      }

      if ('contact' in ctx.message!) {
        const contact = ctx.message.contact;

        if (contact.user_id !== user_id) {
          await ctx.replyWithHTML(
            `Iltimos, o'zingizni telefon raqamingizni yuboring!`,
            Markup.keyboard([
              [Markup.button.contactRequest('📞Telefon raqam yuborish!')],
            ])
              .oneTime()
              .resize(),
          );
          return;
        }
        let phone = contact.phone_number;
        master.phone_number = phone;
        master.last_state = 'workshop_name';
        await master.save();
        await ctx.reply('Ustaxona nomini kiriting');
      }
    } catch (error) {
      console.error('Error on OnContact():', error);
    }
  }

  async onText(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const master = await this.masterModel.findOne({ where: { user_id } });

      if (!master) {
        await ctx.reply(`Siz avval startni bosing`, {
          parse_mode: 'HTML',
          ...Markup.keyboard([['/start']]).resize(),
        });
      } else {
        if ('text' in ctx.message!) {
          const userInput = ctx.message.text;

          switch (master.last_state) {
            case 'name':
              master.name = userInput;
              master.last_state = 'phone_number';
              await master.save();
              await ctx.replyWithHTML(
                `Iltimos, telefon raqamingizni yuboring!`,
                Markup.keyboard([
                  [Markup.button.contactRequest('📞Telefon raqam yuborish!')],
                ])
                  .oneTime()
                  .resize(),
              );
              break;
            case 'workshop_name':
              master.workshop_name = userInput;
              master.last_state = 'address';
              await master.save();
              await ctx.reply('Ustaxona manzilini kiriting', {
                parse_mode: 'HTML',
                ...Markup.removeKeyboard(),
              });
              break;

            case 'address':
              master.address = userInput;
              master.last_state = 'destination';
              await master.save();
              await ctx.reply('Manzil uchun moljal kiriting', {
                parse_mode: 'HTML',
                ...Markup.removeKeyboard(),
              });
              break;

            case 'destination':
              master.destination = userInput;
              master.last_state = 'location';
              await master.save();
              await ctx.reply('Manzil locatsiyasini yuboring', {
                parse_mode: 'HTML',
                ...Markup.removeKeyboard(),
              });
              break;

            case 'start_time':
              master.start_time = userInput;
              master.last_state = 'end_time';
              await master.save();
              await ctx.reply('Kunning ish tugash vaqtini kiriting ex: 17:00', {
                parse_mode: 'HTML',
                ...Markup.removeKeyboard(),
              });
              break;

            case 'end_time':
              master.end_time = userInput;
              master.last_state = 'time_by_customer';
              await master.save();
              await ctx.reply(
                "Bitta mijoz uchun ketadigan o'rtacha vaqtni kiritng ex: 30:00",
                {
                  parse_mode: 'HTML',
                  ...Markup.removeKeyboard(),
                },
              );
              break;

            case 'time_by_customer':
              master.time_by_customer = userInput;
              master.last_state = 'finish';
              await master.save();
              await ctx.reply("Siz ro'yxatdan otdingiz", {
                parse_mode: 'HTML',
                ...Markup.removeKeyboard(),
              });
              break;
            default:
              break;
          }
        }
      }
    } catch (error) {
      console.log(`Error on Text`, error);
    }
  }

  async onStop(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const master = await this.masterModel.findOne({ where: { user_id } });
      if (!master) {
        await ctx.replyWithHTML(`Iltimos, <b>Start</b> tugmasini bosing`, {
          ...Markup.keyboard([['/start']])
            .oneTime()
            .resize(),
        });
      } else {
        await ctx.replyWithHTML(
          `Siz vaqtincha botdan chiqdingiz. Qayta faollashtirish uchun <b>/start</b> tugmasini bosing`,
          {
            ...Markup.keyboard([['/start']])
              .oneTime()
              .resize(),
          },
        );
      }
    } catch (error) {
      console.log(`Error on Stop`, error);
    }
  }
}
