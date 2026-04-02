require('dotenv').config();
const {
  Client,
  GatewayIntentBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes
} = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// ===== CONFIG =====
const LINEUP_CHANNEL_ID = "1431229040055947336";
const STAFF_ROLE_ID = "1430153702609518668";

// ===== COMMANDS =====
const commands = [
  new SlashCommandBuilder()
    .setName('tip')
    .setDescription('Send a tip')
    .addUserOption(o => o.setName('user').setRequired(true).setDescription('User'))
    .addIntegerOption(o => o.setName('amount').setRequired(true).setDescription('Amount')),

  new SlashCommandBuilder()
    .setName('order')
    .setDescription('Start order'),

  new SlashCommandBuilder()
    .setName('received')
    .setDescription('Send lineup')
    .addUserOption(o => o.setName('buyer').setRequired(true).setDescription('Buyer'))
    .addStringOption(o => o.setName('item').setRequired(true).setDescription('Item'))
    .addStringOption(o => o.setName('price').setRequired(true).setDescription('Price')),

  new SlashCommandBuilder()
    .setName('cal')
    .setDescription('Calculator')
    .addStringOption(o => o.setName('equation').setRequired(true).setDescription('Equation')),

  new SlashCommandBuilder()
    .setName('check')
    .setDescription('Check Roblox link'),

  new SlashCommandBuilder()
    .setName('vouch')
    .setDescription('Send vouch reminder')
];

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands });
  console.log("Commands loaded");
})();

// ===== READY =====
client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== INTERACTIONS =====
client.on('interactionCreate', async interaction => {

  if (interaction.isChatInputCommand()) {

    // ===== TIP =====
    if (interaction.commandName === 'tip') {
      const user = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      return interaction.reply(`💸 Thank you ${interaction.user} for tipping ${user} **${amount}**!`);
    }

    // ===== ORDER =====
    if (interaction.commandName === 'order') {
      const btn = new ButtonBuilder()
        .setCustomId('agree')
        .setLabel('Agree to TOS')
        .setStyle(ButtonStyle.Success);

      return interaction.reply({
        content: "📜 Please agree to the Terms & Conditions.",
        components: [new ActionRowBuilder().addComponents(btn)]
      });
    }

    // ===== RECEIVED =====
    if (interaction.commandName === 'received') {

      const buyer = interaction.options.getUser('buyer');
      const item = interaction.options.getString('item');
      const price = interaction.options.getString('price');

      const channel = client.channels.cache.get(LINEUP_CHANNEL_ID);

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`noted_${buyer.id}_${item}_${price}`).setLabel('🤍 Noted').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId(`processing_${buyer.id}_${item}_${price}`).setLabel('🤍 Processing').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`complete_${buyer.id}_${item}_${price}`).setLabel('🤍 Complete').setStyle(ButtonStyle.Success)
      );

      await channel.send({
        content: `📦 **New Order**
Buyer ${buyer} for ${item} ${price}`,
        components: [row]
      });

      return interaction.reply("✅ Sent to lineup!");
    }

    // ===== CAL =====
    if (interaction.commandName === 'cal') {
      const eq = interaction.options.getString('equation');
      try {
        const result = eval(eq);
        return interaction.reply(`🧮 Result: ${result}`);
      } catch {
        return interaction.reply("❌ Invalid equation");
      }
    }

    // ===== CHECK =====
    if (interaction.commandName === 'check') {
      const messages = await interaction.channel.messages.fetch({ limit: 1 });
      const msg = messages.first();

      if (!msg || !msg.content.includes("roblox.com")) {
        return interaction.reply("❌ No Roblox link found.");
      }

      return interaction.reply("✅ Roblox link detected (basic check)");
    }

    // ===== VOUCH =====
    if (interaction.commandName === 'vouch') {
      await interaction.deleteReply().catch(() => {});
      return interaction.channel.send(`**Order complete! Please vouch within 12 hours or your warranty will be void.**
https://discord.gg/KUkvzkKE5t`);
    }
  }

  // ===== BUTTONS =====
  if (interaction.isButton()) {

    // ===== ORDER FLOW =====
    if (interaction.customId === 'agree') {
      return interaction.update({
        content: `**_ _**
🤍  ${interaction.user} confirmed !

> before u proceed with ur payment, 
> read our [rules](https://discord.com/channels/1430153702609518664/1430153704031654073) first. by doing so, u
> agree to our [tnc](https://discord.com/channels/1430153702609518664/1430153704031654074). happy shopping!  
**_ _**

_ _
<:PROCESSING:1431231228954279976>  how would you like to pay? 

-# note: once payment is sent, ‎__no refunds__. 
-# force refund will cost **₱50**. always double check!
_ _`,
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('gcash').setLabel('GCash').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('paypal').setLabel('PayPal').setStyle(ButtonStyle.Secondary)
          )
        ]
      });
    }

    if (interaction.customId === 'gcash') {
      return interaction.update({
        content: `_ _

‎                        **gcash payment**  <:loveyou:1431453413777870948> 

‎              <:loveyou:1431453413777870948> no.   \`09153884008\`
              <:loveyou:1431453413777870948> send [receipt](https://cdn.discordapp.com/attachments/1432245022069227600/1488809000878473376/1761263430902.jpg)
-# ‎                       no refund once payment is sent
‎              <:loveyou:1431453413777870948> no receipt  =  no item

_ _`,
        components: []
      });
    }

    if (interaction.customId === 'paypal') {
      return interaction.update({
        content: "💳 PayPal: Kioshiaizen@gmail.com  send using friends/family and add 5%",
        components: []
      });
    }

    // ===== LINEUP BUTTONS =====
    if (!interaction.member.roles.cache.has(STAFF_ROLE_ID)) {
      return interaction.reply({ content: "❌ Staff only!", ephemeral: true });
    }

    const [status, userId, item, price] = interaction.customId.split("_");

    let message = "";

    if (status === "complete") {
      message = `Buyer <@${userId}> for ${item} ${price} thanks for shopping with us`;
    } else if (status === "processing" || status === "noted") {
      message = `Buyer <@${userId}> for ${item} ${price} please wait for your item Thank you!`;
    }

    await interaction.update({
      content: message,
      components: []
    });
  }
});

client.login(process.env.TOKEN);
