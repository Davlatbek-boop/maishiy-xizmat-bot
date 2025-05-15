import { Injectable } from '@nestjs/common';
import { InjectBot } from 'nestjs-telegraf';
import { BOT_NAME } from '../app.constants';
import { Context, Markup, Telegraf } from 'telegraf';
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
      await ctx.replyWithHTML('Maishiy xizmatlar botiga hush kelibsiz', {
        ...Markup.keyboard([["Ro'yxatdan o'tish"]])
          .oneTime()
          .resize(),
      });
    } catch (error) {
      console.log(`Error on Start`, error);
    }
  }

  async onRegistr(ctx: Context) {
    try {
      await ctx.replyWithHTML('Tanlang', {
        ...Markup.keyboard([['Usta', 'Mijoz']])
          .oneTime()
          .resize(),
      });
    } catch (error) {
      console.log(`Error on Registr`, error);
    }
  }

  async onRegistrUsta(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const master = await this.masterModel.findOne({ where: { user_id } });
      console.log(user_id);
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
      } else {
        if (master!.last_state == 'finish') {
          this.getMasterProfils(master!, ctx);
          return;
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
              `Bitta mijoz uchun ketadigan o'rtacha vaqtni kiritng ex: 30`,
            );
            break;

          default:
            await ctx.editMessageReplyMarkup(undefined);
            break;
        }
      }
    } catch (error) {
      console.log(`Error on action Masters`, error);
    }
  }

  async onActionSendToAdminAndDeleteMaster(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const master = await this.masterModel.findOne({ where: { user_id } });

      if (!master) {
        await ctx.reply(`Siz avval Startni bosing`, {
          parse_mode: 'HTML',
          ...Markup.keyboard([['/start']]).resize(),
        });
      } else {
        if ('data' in ctx.callbackQuery!) {
          const data = ctx.callbackQuery.data;
          const ADMIN = process.env.ADMIN;
          if (data == 'registr_3') {
            const message = `👤 Master Info:
  📛 Name: ${master.name}
  📱 Phone: ${master.phone_number}
  ✅ Ustaxona nomi: ${master.workshop_name}
  🏢 Manzili: ${master.address}
  🎯 Mo'ljal: ${master.destination}
  🏠 Locatsiya: ${master.location || 'Not Provided'}
  ⏲️ Ishni boshlash vaqti: ${master.start_time}
  ⏲️ Ishni yakunlash vaqti: ${master.end_time}
  ⏳ Har bir mijoz uchun o'rtacha sarflanadigan vaqt: ${master.time_by_customer} daqiqa`;

            await ctx.telegram.sendMessage(ADMIN!, message, {
              reply_markup: {
                inline_keyboard: [
                  [
                    {
                      text: '✅ Ustani Tasdiqlash',
                      callback_data: `confirm_master_${master.user_id}`,
                    },
                    {
                      text: '❌ Ustani Bekor qilish',
                      callback_data: `reject_master_${master.user_id}`,
                    },
                  ],
                ],
              },
            });
            const contextMessage = ctx.callbackQuery?.message;

            if (contextMessage?.message_id) {
              await ctx.deleteMessage(contextMessage.message_id);
            }
            await ctx.replyWithHTML(
              'Malumotlaringiz tasdiqlash uchun adminga yuborildi.',
              Markup.inlineKeyboard([
                [
                  {
                    text: '✅ Tekshirish',
                    callback_data: `sended_1`,
                  },
                  {
                    text: '❌ Bekor qilish',
                    callback_data: `sended_2`,
                  },
                ],
                [
                  {
                    text: 'Admin bilan boglanish',
                    callback_data: `sended_3`,
                  },
                ],
              ]),
            );
          } else if (data == 'registr_2') {
            this.deleteMaster(ctx, user_id!);
          }
        }
      }
    } catch (error) {
      console.log('error on onActionSendToAdminAndDeleteMaster', error);
    }
  }

  async onConfirmMaster(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const admin = await this.masterModel.findOne({ where: { user_id } });
      if ('data' in ctx.callbackQuery!) {
        const data = ctx.callbackQuery.data;
        const master_id = data.split('_')[2];
        const master = await this.masterModel.findOne({
          where: { user_id: master_id },
        });
        if (!master?.status) {
          master!.status = true;
          await master?.save();
          await ctx.telegram.sendMessage(
            master_id,
            "Tabriklaymiz ma'lumotlaringiz ADMIN tomonidan tasdiqlandi🎉",
            Markup.inlineKeyboard([
              [
                {
                  text: 'Mijozlar',
                  callback_data: `tasdiq_1`,
                },
                {
                  text: 'Vaqt',
                  callback_data: `tasdiq_2`,
                },
                {
                  text: 'Reyting',
                  callback_data: `tasdiq_3`,
                },
              ],
              [
                {
                  text: "Ma'lumotlarni o'zgartirish",
                  callback_data: `tasdiq_4`,
                },
              ]
            ]),
          );
          const contextMessage = ctx.callbackQuery?.message;

          if (contextMessage?.message_id) {
            await ctx.deleteMessage(contextMessage.message_id);
          }
          await ctx.replyWithHTML(`Usta ${master?.name} faollashtirildi`);
        } else {
          const contextMessage = ctx.callbackQuery?.message;

          if (contextMessage?.message_id) {
            await ctx.deleteMessage(contextMessage.message_id);
          }
          await ctx.replyWithHTML(
            `Usta ${master?.name} ni avval faollashtirgansiz`,
          );
        }
      }
    } catch (error) {
      console.log('error on onConfirmMaster', error);
    }
  }

  async onActionCheckAndDeleteAndConnectByAdmin(ctx: Context) {
    try {
      const user_id = ctx.from?.id;
      const master = await this.masterModel.findOne({ where: { user_id } });
      if (!master) {
        await ctx.reply(`Siz avval Startni bosing`, {
          parse_mode: 'HTML',
          ...Markup.keyboard([['/start']]).resize(),
        });
      } else {
        if ('data' in ctx.callbackQuery!) {
          const data = ctx.callbackQuery.data;
          switch (data) {
            case 'sended_1':
              if (master.status) {
                await ctx.reply(
                  "Tabriklaymiz ma'lumotlaringiz ADMIN tomonidan tasdiqlangan🎉",
                );
              } else {
                await ctx.reply('Malumotlaringiz tasdiqlanishini kuting');
              }
              break;
            case 'sended_2':
              this.deleteMaster(ctx, user_id!);
              break;
            default:
              break;
          }
        }
      }
    } catch (error) {
      console.log('error on onActionCheckAndDeleteAndConnectByAdmin', error);
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
              this.getMasterProfils(master, ctx);
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

  async getMasterProfils(master: Master, ctx: Context) {
    const message = `👤 Master Info:
      📛 Name: ${master.name}
      📱 Phone: ${master.phone_number}
      ✅ Ustaxona nomi: ${master.workshop_name}
      🏢 Manzili: ${master.address}
      🎯 Mo'ljal: ${master.destination}
      🏠 Locatsiya: ${master.location || 'Not Provided'}
      ⏲️ Ishni boshlash vaqti: ${master.start_time}
      ⏲️ Ishni yakunlash vaqti: ${master.end_time}
      ⏳ Har bir mijoz uchun o'rtacha sarflanadigan vaqt: ${master.time_by_customer} daqiqa`;

    const buttons = [
      [
        {
          text: '🔄 Update',
          callback_data: 'registr_1',
        },
        {
          text: '❌ Bekor qilish',
          callback_data: 'registr_2',
        },
      ],
      [
        {
          text: '✅ Tasdiqlash',
          callback_data: 'registr_3',
        },
      ],
    ];
    const contextMessage = ctx.callbackQuery?.message;

    if (contextMessage?.message_id) {
      await ctx.deleteMessage(contextMessage.message_id);
    }
    await ctx.reply(message, Markup.inlineKeyboard(buttons));
  }

  async deleteMaster(ctx: Context, user_id: number) {
    try {
      await this.masterModel.destroy({ where: { user_id } });
      await ctx.reply(
        `Sizning malumotlaringiz o'chirildi. Iltimos start tugmasini bosing.`,
        {
          parse_mode: 'HTML',
          ...Markup.keyboard([['/start']]).resize(),
        },
      );
    } catch (error) {
      console.log(`Error on delete Master`, error);
    }
  }
}
